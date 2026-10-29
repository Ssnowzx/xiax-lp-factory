"""Build the Xbarber 3D barber shears from scratch, headless and deterministic.

Run from the repo root (output paths default to repo paths resolved from this file, so the
current directory only matters for the --python argument). Needs `npx` on PATH for compression:

    /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
        --python assets/3d/scissors/build-scissors.py -- [--review-dir DIR] [--no-compress]

The run prints a SCISSORS_REPORT JSON (triangles, bounds, overlap sweep, GLB checks, still
framing) and exits non-zero if any contract check fails.

Writes:
    assets/3d/scissors/scissors.blend   source scene (model + studio used for the still)
    public/models/scissors.glb          meshopt-compressed GLB (contract below)
    assets/3d/scissors/scissors-still.png  transparent front render of the rest pose (source;
                                           `npm run assets:v3` turns it into the web .webp)

GLB contract (glTF space: Y up, camera on +Z), relied on by the web code:
    Scissors (root) > BladeL, BladeR, Rivet
        Each of the three is a transform-only pivot with an identity transform at the rivet
        center (0, 0, 0) and holds one mesh child (<name>_Mesh). The extra level exists because
        meshopt position quantization bakes a bbox-centered offset into the mesh node's
        transform; keeping it on the child leaves the named pivots exactly on the rivet.
    Tips point -Y, rings +Y, ring top to blade tip = 1.0. BladeL is in front (z > 0), BladeR
    behind (z < 0). Opening = BladeL rotates about +Z, BladeR about -Z.
    Materials: Brass (rings, handles, rivet) and Steel (blades). No textures.
"""

import argparse
import json
import math
import shutil
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

REPO_ROOT = Path(__file__).resolve().parents[3]

# ---------------------------------------------------------------------------------------------
# Design constants, in glTF units before the final normalization to length 1.0.
# The model is authored in glTF space (x right, y up, z toward camera) and converted to
# Blender space only when meshes are created, so the contract stays readable.
# ---------------------------------------------------------------------------------------------
BLADE_LEN = 0.60          # rivet -> tip (~60% of the total length, as in the approved SVG)
EDGE_X_PIVOT = -0.030     # cutting edge x at the rivet (side A of BladeL)
BACK_X_PIVOT = 0.046      # blade back x at the rivet (side B of BladeL)
GAP = 0.002               # depth gap between halves: they live in disjoint z half-spaces
Z0 = GAP / 2              # inner face of BladeL (BladeR is the 180-degree turned copy)
T_PIVOT = 0.016           # plate thickness around the rivet
T_TIP = 0.007
T_SHANK_END = 0.018
EDGE_T = 0.0032           # metal left at the cutting edge after the convex grind
EDGE_R = 0.0014
ROUND_R = 0.0045          # rounding of backs and handle edges: this is what catches highlights
CROWN = 0.0007            # slight dome across blade faces so reflections are not dead flat
HANDLE_CROWN = 0.0035     # handles are domed: on a mirror-like metal the gradient *is* the form
FACET_FRAC = 0.36         # convex edge facet width as a fraction of the blade width
HW_NECK = 0.0136          # handle half-width between boss and ring (readable at 64 px)
HW_FLARE = 0.0185         # handle half-width where it merges into the ring (reads as a fillet)
BRASS_FROM = 0.075        # handles turn brass this far above the rivet (two-tone shears)

# Ring and tang parameters are given in the BladeL frame; BladeR is mirrored afterwards.
RING_L = dict(center=(-0.096, 0.322), a=0.066, b=0.055, tilt=16.0,
              rod_w=0.0128, depth=0.020, boost=0.30, shape=2.4)
RING_R = dict(center=(-0.101, 0.318), a=0.073, b=0.059, tilt=16.0,
              rod_w=0.0128, depth=0.020, boost=0.30, shape=2.4)
TANG = dict(theta=228.0, c1=(-0.018, -0.026), c2=(-0.006, -0.060), r0=0.0110, r1=0.0080)

# (radius, height above the plate) of the screw head; revolved around the rivet axis.
RIVET_PROFILE = [(0.0215, 0.0), (0.0215, 0.0010), (0.0208, 0.0017), (0.0185, 0.0019),
                 (0.0172, 0.0022)] + [
    (0.0165 * math.cos(math.radians(a)), 0.0024 + 0.0042 * math.sin(math.radians(a)))
    for a in (10, 35, 58, 78)] + [(0.0, 0.0066)]

RIVET_LIFT = 0.00015      # invisible (0.03 px at 220 px) but keeps the contact test exact

BRASS_HEX = "#D6A24E"     # --brass-400 from the design system
STEEL_HEX = "#E6E8EB"     # near-white grey; metal F0, so it reads as polished steel
MAT_STEEL, MAT_BRASS = 0, 1

STILL_PX_PER_UNIT = 480   # still: 1 model unit = 480 px, 16 px margin, 512 px tall
STILL_MARGIN_PX = 16


# ---------------------------------------------------------------------------------------------
# Small math helpers
# ---------------------------------------------------------------------------------------------
def lerp(a, b, t):
    return a + (b - a) * t


def smoothstep(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0)
    return t * t * (3.0 - 2.0 * t)


def spow(v, e):
    return math.copysign(abs(v) ** e, v)


def arc(cx, cy, r, a0, a1, n=3):
    return [(cx + r * math.cos(math.radians(lerp(a0, a1, k / (n - 1)))),
             cy + r * math.sin(math.radians(lerp(a0, a1, k / (n - 1))))) for k in range(n)]


def to_blender(p):
    """glTF (x, y, z) -> Blender (x, -z, y); the glTF exporter applies the inverse."""
    return Vector((p[0], -p[2], p[1]))


def srgb_hex_to_linear(hex_str):
    def channel(c):
        c = int(c, 16) / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    h = hex_str.lstrip("#")
    return (channel(h[0:2]), channel(h[2:4]), channel(h[4:6]), 1.0)


# ---------------------------------------------------------------------------------------------
# Mesh accumulation (plain lists, converted to bmesh once per object)
# ---------------------------------------------------------------------------------------------
class MeshBuilder:
    def __init__(self):
        self.verts, self.faces, self.mats, self.sharp = [], [], [], []

    def add_loop(self, pts):
        base = len(self.verts)
        self.verts.extend(tuple(p) for p in pts)
        return list(range(base, base + len(pts)))

    def bridge(self, la, lb, mat):
        n = len(la)
        for j in range(n):
            self.faces.append((la[j], la[(j + 1) % n], lb[(j + 1) % n], lb[j]))
            self.mats.append(mat)

    def fan(self, loop, apex_pt, mat):
        apex = self.add_loop([apex_pt])[0]
        n = len(loop)
        for j in range(n):
            self.faces.append((loop[j], loop[(j + 1) % n], apex))
            self.mats.append(mat)

    def cap(self, loop, mat):
        self.faces.append(tuple(loop))
        self.mats.append(mat)

    def transform(self, fn):
        self.verts = [fn(v) for v in self.verts]


# ---------------------------------------------------------------------------------------------
# Blade + boss + handle: one swept plate with a varying cross-section
# ---------------------------------------------------------------------------------------------
def blade_outline(t):
    """x of the cutting edge (side A) and blade back (side B); t = 0 at rivet, 1 at tip."""
    x_edge = lerp(EDGE_X_PIVOT, 0.0, t)
    x_back = BACK_X_PIVOT * (1 - t) * (1 + 0.55 * t - 0.25 * t * t)
    return x_edge, x_back


def thickness_at(sig):
    if sig < 0:
        t = -sig / BLADE_LEN
        return lerp(T_PIVOT, T_TIP, t ** 1.3) * (1 - 0.55 * smoothstep(0.92, 1.0, t))
    return lerp(T_PIVOT, T_SHANK_END, smoothstep(0.10, 0.25, sig))


def edge_blend(sig):
    """1 where the blade has its convex edge grind, 0 on the boss under the rivet and handle."""
    return 1.0 - smoothstep(-0.11, -0.035, sig)


def section_profile(hw, sig):
    """Closed (d, h) loop of 16 points: d across the width (side A < 0), h outward from the
    inner face. Side A is the cutting edge on the blade and a rounded edge on the handle."""
    beta, thick = edge_blend(sig), thickness_at(sig)
    crown = CROWN * smoothstep(0.03, 0.09, abs(sig))
    if sig > 0:
        crown = lerp(crown, HANDLE_CROWN, smoothstep(0.05, 0.12, sig))
    r_round = min(ROUND_R, 0.42 * thick, 0.35 * hw)
    r_a = lerp(r_round, min(EDGE_R, 0.25 * hw), beta)
    r_b = r_round

    def outer_h(d):
        return thick - crown * (d / hw) ** 2

    cx_a, cx_b = -hw + r_a, hw - r_b
    grind_d = lerp(cx_a + 0.2 * (cx_b - cx_a), -hw + 2 * hw * FACET_FRAC, beta)
    edge_t = max(lerp(outer_h(cx_a), EDGE_T, beta), 2.05 * r_a)
    g_h = outer_h(grind_d)
    phi = math.degrees(math.atan2(g_h - edge_t, grind_d - cx_a))
    pts = arc(cx_a, r_a, r_a, 270, 180)
    pts += arc(cx_a, edge_t - r_a, r_a, 180, 90 + phi)
    pts.append((grind_d, g_h))
    pts += [(lerp(grind_d, cx_b, k / 4), outer_h(lerp(grind_d, cx_b, k / 4))) for k in (1, 2, 3)]
    # Start the back corner tangent to the dome so the rounding has no visible ridge.
    hb = outer_h(cx_b)
    psi = math.atan2(outer_h(cx_b - 1e-4) - hb, 1e-4)
    pts += arc(cx_b - r_b * math.sin(psi), hb - r_b * math.cos(psi), r_b, 90 - math.degrees(psi), 0)
    pts += arc(cx_b, r_b, r_b, 0, -90)
    return pts, beta


GRIND_INDEX = 6  # position of the grind line in section_profile's loop


def blade_stations(n=46, t_max=0.985):
    stations = []
    for i in range(n + 1):
        t = t_max * (1 - (i / n) ** 1.35)  # dense near the tip where the outline curves
        xe, xb = blade_outline(t)
        stations.append(dict(c=Vector(((xe + xb) / 2, -BLADE_LEN * t)), e=Vector((1.0, 0.0)),
                             hw=(xb - xe) / 2, sig=-BLADE_LEN * t))
    return stations


def ring_point(ring, theta):
    """Centerline point and outward in-plane normal of an oval ring at parameter theta."""
    tilt = math.radians(ring["tilt"])
    ca, sa = math.cos(tilt), math.sin(tilt)
    lx, ly = ring["a"] * math.cos(theta), ring["b"] * math.sin(theta)
    tx, ty = -ring["a"] * math.sin(theta), ring["b"] * math.cos(theta)
    p = Vector(ring["center"]) + Vector((ca * lx - sa * ly, sa * lx + ca * ly))
    tan = Vector((ca * tx - sa * ty, sa * tx + ca * ty)).normalized()
    return p, Vector((tan.y, -tan.x))


def ring_junction_theta(ring, toward):
    tilt = math.radians(ring["tilt"])
    v = Vector(toward) - Vector(ring["center"])
    lx = v.x * math.cos(-tilt) - v.y * math.sin(-tilt)
    ly = v.x * math.sin(-tilt) + v.y * math.cos(-tilt)
    return math.atan2(ly / ring["b"], lx / ring["a"])


def bezier3(p0, p1, p2, p3, s):
    u = 1 - s
    pos = p0 * u ** 3 + p1 * 3 * u * u * s + p2 * 3 * u * s * s + p3 * s ** 3
    tan = (p1 - p0) * 3 * u * u + (p2 - p1) * 6 * u * s + (p3 - p2) * 3 * s * s
    return pos, tan.normalized()


def handle_stations(ring, n=36):
    """Stations from the rivet up to the ring, along a cubic that leaves the boss vertically
    and enters the ring radially (so the joint reads as forged, not glued)."""
    p0 = Vector(((EDGE_X_PIVOT + BACK_X_PIVOT) / 2, 0.0))
    theta_j = ring_junction_theta(ring, p0)
    pj, _ = ring_point(ring, theta_j)
    into_ring = (Vector(ring["center"]) - pj).normalized()
    ctrl = (p0, p0 + Vector((0.0, 0.09)), pj - into_ring * 0.08, pj)
    samples = [bezier3(*ctrl, k / 400) for k in range(401)]
    arc_len = [0.0]
    for k in range(1, 401):
        arc_len.append(arc_len[-1] + (samples[k][0] - samples[k - 1][0]).length)
    total, hw0 = arc_len[-1], (BACK_X_PIVOT - EDGE_X_PIVOT) / 2
    stations, k = [], 0
    for i in range(1, n + 1):
        target = total * i / n
        while arc_len[k] < target and k < 400:
            k += 1
        pos, tan = samples[k]
        sig = arc_len[k]
        # Round boss: circular shoulder around the pivot, blended into the neck with a
        # smooth max so the outline gets a fillet instead of an arrowhead corner.
        boss = math.sqrt(max(0.0, hw0 * hw0 - sig * sig))
        neck = HW_NECK + (HW_FLARE - HW_NECK) * smoothstep(total - 0.05, total, sig)
        hw = 0.5 * (boss + neck + math.sqrt((boss - neck) ** 2 + 0.010 ** 2))
        stations.append(dict(c=pos, e=Vector((tan.y, -tan.x)), hw=hw, sig=sig))
    return stations, theta_j


def build_plate(mb, ring):
    """Blade, boss and handle as one swept plate; returns the ring junction parameter."""
    handles, theta_j = handle_stations(ring)
    stations = blade_stations() + handles
    loops, betas = [], []
    for st in stations:
        prof, beta = section_profile(st["hw"], st["sig"])
        pts = [(st["c"].x + d * st["e"].x, st["c"].y + d * st["e"].y, Z0 + h) for d, h in prof]
        loops.append(mb.add_loop(pts))
        betas.append(beta)
    for i in range(len(loops) - 1):
        mat = MAT_BRASS if stations[i]["sig"] >= BRASS_FROM else MAT_STEEL
        mb.bridge(loops[i], loops[i + 1], mat)
        if betas[i] > 0.35 and betas[i + 1] > 0.35:
            mb.sharp.append((loops[i][GRIND_INDEX], loops[i + 1][GRIND_INDEX]))
    tip_t = thickness_at(stations[0]["sig"])
    mb.fan(list(reversed(loops[0])), (0.0, -BLADE_LEN, Z0 + 0.45 * tip_t), MAT_STEEL)
    mb.cap(loops[-1], MAT_BRASS)  # hidden inside the ring rod
    return theta_j


# ---------------------------------------------------------------------------------------------
# Finger ring, finger-rest tang, rivet
# ---------------------------------------------------------------------------------------------
def build_ring(mb, ring, theta_j, n_seg=64, n_prof=16):
    hd = ring["depth"] / 2
    loops = []
    for i in range(n_seg):
        th = 2 * math.pi * i / n_seg
        p, n_out = ring_point(ring, th)
        # Thicker toward the handle joint, slimmer on top: reads as a forged ring.
        wr = ring["rod_w"] * (1 + ring["boost"] * max(0.0, math.cos(th - theta_j)) ** 3)
        pts = []
        for j in range(n_prof):
            ph = 2 * math.pi * j / n_prof
            u = spow(math.cos(ph), 2 / ring["shape"])
            v = spow(math.sin(ph), 2 / ring["shape"])
            pts.append((p.x + n_out.x * wr * u, p.y + n_out.y * wr * u, Z0 + hd + hd * v))
        loops.append(mb.add_loop(pts))
    for i in range(n_seg):
        mb.bridge(loops[i], loops[(i + 1) % n_seg], MAT_BRASS)


def build_tang(mb, ring, n_seg=20, n_prof=12):
    """Curled finger rest hanging off the larger ring; ends in a ball."""
    hd = ring["depth"] / 2
    q0, _ = ring_point(ring, math.radians(TANG["theta"]))
    q1, q2 = q0 + Vector(TANG["c1"]), q0 + Vector(TANG["c2"])

    def tube_loop(center, tan, r):
        side, rz = Vector((tan.y, -tan.x)), min(r, hd)
        return mb.add_loop([(center.x + side.x * r * math.cos(a), center.y + side.y * r * math.cos(a),
                             Z0 + hd + rz * math.sin(a))
                            for a in (2 * math.pi * j / n_prof for j in range(n_prof))])

    loops = []
    for i in range(n_seg + 1):
        s = i / n_seg
        pos = q0 * (1 - s) ** 2 + q1 * 2 * (1 - s) * s + q2 * s * s
        tan = ((q1 - q0) * 2 * (1 - s) + (q2 - q1) * 2 * s).normalized()
        loops.append(tube_loop(pos, tan, lerp(TANG["r0"], TANG["r1"], s)))
    r1, tan_end = TANG["r1"], (q2 - q1).normalized()
    for a in (30, 60):
        loops.append(tube_loop(q2 + tan_end * r1 * math.sin(math.radians(a)), tan_end,
                               r1 * math.cos(math.radians(a))))
    for i in range(len(loops) - 1):
        mb.bridge(loops[i], loops[i + 1], MAT_BRASS)
    mb.cap(loops[0], MAT_BRASS)
    mb.fan(loops[-1], (q2.x + tan_end.x * r1, q2.y + tan_end.y * r1, Z0 + hd), MAT_BRASS)


def build_rivet_head(mb, z_base, sign, n_seg=32):
    loops = []
    for r, h in RIVET_PROFILE[:-1]:
        z = sign * (z_base + h)
        loops.append(mb.add_loop([(r * math.cos(2 * math.pi * k / n_seg),
                                   r * math.sin(2 * math.pi * k / n_seg), z) for k in range(n_seg)]))
    for i in range(len(loops) - 1):
        mb.bridge(loops[i], loops[i + 1], MAT_BRASS)
    mb.fan(loops[-1], (0.0, 0.0, sign * (z_base + RIVET_PROFILE[-1][1])), MAT_BRASS)


def build_half(ring, with_tang):
    mb = MeshBuilder()
    theta_j = build_plate(mb, ring)
    build_ring(mb, ring, theta_j)
    if with_tang:
        build_tang(mb, ring)
    return mb


def build_geometry():
    """Returns builders for BladeL, BladeR and the rivet, normalized to length 1.0."""
    blade_l = build_half(RING_L, with_tang=False)
    blade_r = build_half(RING_R, with_tang=True)
    blade_r.transform(lambda v: (-v[0], v[1], -v[2]))  # 180-degree turn about Y: no winding flip
    rivet = MeshBuilder()
    seat = Z0 + T_PIVOT + RIVET_LIFT
    build_rivet_head(rivet, seat, +1.0)  # screw head on BladeL's outer face
    build_rivet_head(rivet, seat, -1.0)  # nut on BladeR's outer face (seen when the model spins)
    ys = [v[1] for b in (blade_l, blade_r) for v in b.verts]
    scale = 1.0 / (max(ys) - min(ys))
    for b in (blade_l, blade_r, rivet):
        b.transform(lambda v: (v[0] * scale, v[1] * scale, v[2] * scale))
    return blade_l, blade_r, rivet, scale


# ---------------------------------------------------------------------------------------------
# Blender objects and materials
# ---------------------------------------------------------------------------------------------
def make_material(name, hex_color, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = srgb_hex_to_linear(hex_color)
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = roughness
    mat.diffuse_color = srgb_hex_to_linear(hex_color)
    mat.use_backface_culling = True  # every part is a closed solid: export single-sided
    return mat


def builder_to_mesh(name, mb, materials, sharp_angle_deg=50.0):
    bm = bmesh.new()
    bverts = [bm.verts.new(to_blender(v)) for v in mb.verts]
    for face, mat in zip(mb.faces, mb.mats):
        f = bm.faces.new([bverts[i] for i in face])
        f.material_index = mat
        f.smooth = True
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    limit = math.radians(sharp_angle_deg)
    for e in bm.edges:  # crisp only where a real crease exists (caps, rivet steps)
        if len(e.link_faces) == 2 and e.calc_face_angle(0.0) > limit:
            e.smooth = False
    bm.edges.ensure_lookup_table()
    for a, b in mb.sharp:  # grind line of the convex edge: always a crisp facet
        e = bm.edges.get((bverts[a], bverts[b]))
        if e:
            e.smooth = False
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in materials:
        me.materials.append(m)
    return me


def build_scene_objects(builders, materials):
    blade_l, blade_r, rivet = builders
    col = bpy.data.collections.new("Scissors")
    bpy.context.scene.collection.children.link(col)

    def empty(name, parent):
        ob = bpy.data.objects.new(name, None)
        ob.empty_display_type = "PLAIN_AXES"
        ob.empty_display_size = 0.05
        ob.parent = parent
        col.objects.link(ob)
        return ob

    root = empty("Scissors", None)
    objs = {"Scissors": root}
    for name, mb in (("BladeL", blade_l), ("BladeR", blade_r), ("Rivet", rivet)):
        pivot = empty(name, root)
        mesh_ob = bpy.data.objects.new(name + "_Mesh", builder_to_mesh(name + "_Mesh", mb, materials))
        mesh_ob.parent = pivot
        col.objects.link(mesh_ob)
        objs[name], objs[name + "_Mesh"] = pivot, mesh_ob
    return objs


def set_opening(objs, deg):
    """glTF +Z is Blender -Y: BladeL turns about -Y (CCW seen from the camera), BladeR about +Y."""
    objs["BladeL"].rotation_euler = (0.0, -math.radians(deg), 0.0)
    objs["BladeR"].rotation_euler = (0.0, math.radians(deg), 0.0)
    bpy.context.view_layer.update()


# ---------------------------------------------------------------------------------------------
# Geometric checks
# ---------------------------------------------------------------------------------------------
def world_bvh(ob):
    mw = ob.matrix_world
    verts = [mw @ v.co for v in ob.data.vertices]
    return BVHTree.FromPolygons(verts, [tuple(p.vertices) for p in ob.data.polygons])


def overlap_sweep(objs, max_deg, step=1.0):
    """Counts intersecting triangle pairs between the halves (and each half vs the rivet)."""
    rows = []
    for k in range(int(round(max_deg / step)) + 1):
        deg = k * step
        set_opening(objs, deg)
        bl, br = world_bvh(objs["BladeL_Mesh"]), world_bvh(objs["BladeR_Mesh"])
        rv = world_bvh(objs["Rivet_Mesh"])
        rows.append(dict(deg=deg, l_vs_r=len(bl.overlap(br)), l_vs_rivet=len(bl.overlap(rv)),
                         r_vs_rivet=len(br.overlap(rv))))
    set_opening(objs, 0.0)
    return rows


def depth_clearance(objs):
    zl = [(objs["BladeL_Mesh"].matrix_world @ v.co).y for v in objs["BladeL_Mesh"].data.vertices]
    zr = [(objs["BladeR_Mesh"].matrix_world @ v.co).y for v in objs["BladeR_Mesh"].data.vertices]
    # Blender -Y is glTF +Z: BladeL must be entirely in front of BladeR.
    return min(-y for y in zl) - max(-y for y in zr)


def triangle_count(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def mesh_bounds(objs):
    """Closed-pose bounds in glTF space (x, y, z) over both halves."""
    pts = []
    for name in ("BladeL_Mesh", "BladeR_Mesh"):
        ob = objs[name]
        pts += [ob.matrix_world @ v.co for v in ob.data.vertices]
    xs, ys, zs = [p.x for p in pts], [p.z for p in pts], [-p.y for p in pts]
    return (min(xs), min(ys), min(zs)), (max(xs), max(ys), max(zs))


# ---------------------------------------------------------------------------------------------
# Studio: soft key upper-left, dim front box, two strip rims, gradient world.
# Metal is mostly reflection. With roughness 0.18 a camera-facing face is close to a mirror
# of whatever sits behind the camera, so the front box is kept dim (its GGX tail alone
# would wash the blades out) and its lower edge sits near the rivet: blades get a bright
# top fading toward the tip. Light tints stay near-neutral; warm tints over a warm base
# turn brass orange.
# ---------------------------------------------------------------------------------------------
STUDIO_LIGHTS = [
    # name, Blender location, (width, height), watts, linear color
    ("Key", (-1.6, -1.8, 1.8), (1.0, 0.7), 350.0, (1.0, 0.90, 0.78)),
    ("Front", (0.0, -2.4, 0.5), (1.8, 1.0), 12.0, (1.0, 0.97, 0.93)),
    ("RimL", (-1.9, 0.9, 0.25), (0.22, 2.4), 300.0, (0.92, 0.95, 1.0)),
    ("RimR", (1.9, 0.7, -0.15), (0.22, 2.4), 260.0, (1.0, 0.95, 0.90)),
    ("Top", (0.15, -0.5, 2.6), (1.4, 0.7), 120.0, (1.0, 0.97, 0.94)),
]
LIGHT_TARGET = (0.0, 0.0, -0.1)


def setup_world(scene):
    world = bpy.data.worlds.new("Studio")
    scene.world = world
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    nodes.clear()
    coord, sep = nodes.new("ShaderNodeTexCoord"), nodes.new("ShaderNodeSeparateXYZ")
    remap, ramp = nodes.new("ShaderNodeMapRange"), nodes.new("ShaderNodeValToRGB")
    bg, out = nodes.new("ShaderNodeBackground"), nodes.new("ShaderNodeOutputWorld")
    remap.inputs["From Min"].default_value = -1.0
    stops = ramp.color_ramp.elements
    stops[0].position, stops[0].color = 0.0, (0.020, 0.016, 0.012, 1.0)
    stops[1].position, stops[1].color = 1.0, (0.35, 0.33, 0.31, 1.0)
    mid = stops.new(0.5)
    mid.color = (0.150, 0.135, 0.120, 1.0)  # horizon: steel stays steel at any spin angle
    links.new(coord.outputs["Generated"], sep.inputs[0])
    links.new(sep.outputs["Z"], remap.inputs["Value"])
    links.new(remap.outputs["Result"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bg.inputs["Color"])
    links.new(bg.outputs["Background"], out.inputs["Surface"])


def setup_studio(scene, samples, view_transform, light_scale):
    col = bpy.data.collections.new("Studio")
    scene.collection.children.link(col)
    for name, loc, size, watts, color in STUDIO_LIGHTS:
        ld = bpy.data.lights.new(name, "AREA")
        ld.shape, ld.size, ld.size_y = "RECTANGLE", size[0], size[1]
        ld.energy, ld.color = watts * light_scale, color
        # No shadow maps: they alias into a dashed line across the 0.002 blade gap, and the
        # web scene casts no shadows either, so the still stays closer to the live model.
        ld.use_shadow = False
        ob = bpy.data.objects.new(name, ld)
        ob.location = loc
        ob.rotation_euler = (Vector(LIGHT_TARGET) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        col.objects.link(ob)
    setup_world(scene)
    for name, kind in (("StillCamera", "ORTHO"), ("ReviewCamera", "PERSP")):
        cam = bpy.data.objects.new(name, bpy.data.cameras.new(name))
        cam.data.type = kind
        cam.data.lens = 100.0
        cam.data.clip_start, cam.data.clip_end = 0.05, 50.0
        cam.rotation_euler = (math.radians(90.0), 0.0, 0.0)  # look along +Y (glTF -Z)
        col.objects.link(cam)
    scene.render.engine = "BLENDER_EEVEE"
    eevee = scene.eevee
    eevee.taa_render_samples = samples
    if hasattr(eevee, "use_raytracing"):
        eevee.use_raytracing = True
    scene.render.film_transparent = True
    scene.render.resolution_percentage = 100
    img = scene.render.image_settings
    img.file_format, img.color_mode, img.color_depth, img.compression = "PNG", "RGBA", "8", 100
    # Khronos PBR Neutral keeps the brass hue (AgX bleaches it); three.js has the same curve
    # as THREE.NeutralToneMapping, so the still and the live model can match.
    scene.view_settings.view_transform = view_transform
    scene.view_settings.look = "None"


def render_to(scene, path, width, height):
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def render_still(scene, objs, path):
    """Orthographic front view, rivet on the vertical center line, fixed px-per-unit."""
    (x0, y0, _), (x1, y1, _) = mesh_bounds(objs)
    half_w = max(abs(x0), abs(x1)) * STILL_PX_PER_UNIT + STILL_MARGIN_PX
    width = 2 * math.ceil(half_w)
    height = math.ceil((y1 - y0) * STILL_PX_PER_UNIT + 2 * STILL_MARGIN_PX)
    cam = bpy.data.objects["StillCamera"]
    cam.data.ortho_scale = max(width, height) / STILL_PX_PER_UNIT
    # Shift so the top margin is exactly STILL_MARGIN_PX above the ring top.
    center_y = y1 + STILL_MARGIN_PX / STILL_PX_PER_UNIT - height / 2 / STILL_PX_PER_UNIT
    cam.location = (0.0, -6.0, center_y)
    scene.camera = cam
    render_to(scene, path, width, height)
    rivet_px = (width / 2, STILL_MARGIN_PX + y1 * STILL_PX_PER_UNIT)
    return dict(path=str(path), width=width, height=height, px_per_unit=STILL_PX_PER_UNIT,
                rivet_px=rivet_px, bounds=[[x0, y0], [x1, y1]])


def render_reviews(scene, objs, out_dir, open_deg):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    (_, y0, _), (_, y1, _) = mesh_bounds(objs)
    cam = bpy.data.objects["ReviewCamera"]
    fov_half = math.atan(18.0 / cam.data.lens)
    cam.location = (0.0, -(1.18 * (y1 - y0) / 2) / math.tan(fov_half), (y0 + y1) / 2)
    scene.camera = cam
    root, paths = objs["Scissors"], []
    # The object turns (like the hero spin on the web) while camera and lights stay put.
    for name, spin, opening in (("front", 0.0, 0.0), ("three-quarter", 35.0, 0.0),
                                ("side", 90.0, 0.0), ("open-%d" % round(open_deg), 0.0, open_deg),
                                ("open-%d-three-quarter" % round(open_deg), 35.0, open_deg)):
        root.rotation_euler = (0.0, 0.0, math.radians(spin))
        set_opening(objs, opening)
        path = out_dir / ("review-%s.png" % name)
        render_to(scene, path, 768, 1024)
        paths.append(str(path))
    root.rotation_euler = (0.0, 0.0, 0.0)
    set_opening(objs, 0.0)
    return paths


# ---------------------------------------------------------------------------------------------
# Export, compression and verification of the GLB contract
# ---------------------------------------------------------------------------------------------
def export_glb(objs, path):
    bpy.ops.object.select_all(action="DESELECT")
    for ob in objs.values():
        ob.select_set(True)
    bpy.context.view_layer.objects.active = objs["Scissors"]
    wanted = dict(filepath=str(path), export_format="GLB", use_selection=True, export_yup=True,
                  export_apply=True, export_normals=True, export_texcoords=False,
                  export_tangents=False, export_materials="EXPORT", export_cameras=False,
                  export_lights=False, export_animations=False, export_skins=False,
                  export_morph=False, export_extras=False, export_attributes=False)
    available = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    bpy.ops.export_scene.gltf(**{k: v for k, v in wanted.items() if k in available})


def compress_glb(raw_path, out_path, level):
    npx = shutil.which("npx")
    if not npx:
        raise RuntimeError("npx not found on PATH; needed for @gltf-transform/cli")
    # meshopt (not `optimize`): keeps every node and name; only geometry is re-encoded.
    cmd = [npx, "-y", "@gltf-transform/cli", "meshopt", str(raw_path), str(out_path),
           "--level", level, "--quantize-normal", "12"]
    subprocess.run(cmd, check=True, cwd=str(Path(raw_path).parent))


def read_glb(path):
    data = Path(path).read_bytes()
    length = struct.unpack_from("<I", data, 8)[0]
    off, doc, binary = 12, None, b""
    while off < length:
        clen, ctype = struct.unpack_from("<II", data, off)
        chunk = data[off + 8:off + 8 + clen]
        off += 8 + clen
        if ctype == 0x4E4F534A:
            doc = json.loads(chunk)
        elif ctype == 0x004E4942:
            binary = chunk
    return doc, binary


def node_matrix(node):
    if "matrix" in node:
        m = node["matrix"]
        return Matrix([m[0:4], m[4:8], m[8:12], m[12:16]]).transposed()
    from mathutils import Quaternion
    x, y, z, w = node.get("rotation", (0.0, 0.0, 0.0, 1.0))
    sx, sy, sz = node.get("scale", (1.0, 1.0, 1.0))
    return (Matrix.Translation(node.get("translation", (0.0, 0.0, 0.0)))
            @ Quaternion((w, x, y, z)).to_matrix().to_4x4() @ Matrix.Diagonal((sx, sy, sz, 1.0)))


def walk_nodes(doc):
    """{name: (node, world matrix, parent name)} for the default scene."""
    out = {}
    stack = [(i, Matrix.Identity(4), None) for i in doc["scenes"][doc.get("scene", 0)]["nodes"]]
    while stack:
        idx, parent_m, parent_name = stack.pop()
        node = doc["nodes"][idx]
        world = parent_m @ node_matrix(node)
        out[node.get("name", "#%d" % idx)] = (node, world, parent_name)
        stack += [(c, world, node.get("name")) for c in node.get("children", [])]
    return out


def accessor_floats(doc, binary, idx):
    acc = doc["accessors"][idx]
    view = doc["bufferViews"][acc["bufferView"]]
    stride = view.get("byteStride", 12)
    base = view.get("byteOffset", 0) + acc.get("byteOffset", 0)
    return [Vector(struct.unpack_from("<3f", binary, base + i * stride)) for i in range(acc["count"])]


def check_hierarchy(doc, nodes):
    issues = []
    root = nodes.get("Scissors")
    if not root or root[2] is not None:
        issues.append("Scissors is not a root node")
    for name in ("BladeL", "BladeR", "Rivet"):
        entry = nodes.get(name)
        if not entry or entry[2] != "Scissors":
            issues.append("%s missing or not a child of Scissors" % name)
            continue
        node = entry[0]
        if any(k in node for k in ("translation", "rotation", "scale", "matrix", "mesh")):
            issues.append("%s pivot is not an identity transform-only node: %s" % (name, node))
        if (name + "_Mesh") not in nodes or nodes[name + "_Mesh"][2] != name:
            issues.append("%s_Mesh missing under %s" % (name, name))
    mats = sorted(m.get("name") for m in doc.get("materials", []))
    if mats != ["Brass", "Steel"]:
        issues.append("unexpected materials %s" % mats)
    return issues, mats


def verify_raw_glb(path, open_deg):
    """Reads float positions back from the uncompressed export and checks the contract."""
    doc, binary = read_glb(path)
    nodes = walk_nodes(doc)
    issues, mats = check_hierarchy(doc, nodes)
    pts = {}
    for name in ("BladeL", "BladeR", "Rivet"):
        node, world, _ = nodes[name + "_Mesh"]
        pts[name] = [world @ p for prim in doc["meshes"][node["mesh"]]["primitives"]
                     for p in accessor_floats(doc, binary, prim["attributes"]["POSITION"])]
    allp = pts["BladeL"] + pts["BladeR"]
    y_min, y_max = min(p.y for p in allp), max(p.y for p in allp)
    rot = Matrix.Rotation(math.radians(open_deg), 3, "Z")
    opening = {}
    for name, sign in (("BladeL", 1.0), ("BladeR", -1.0)):
        tip = min(pts[name], key=lambda p: p.y)
        ring = [p for p in pts[name] if p.y > 0.25 * y_max]
        ring_x = sum(p.x for p in ring) / len(ring)
        r = rot if sign > 0 else rot.transposed()
        opening[name] = dict(tip_x=[round(tip.x, 4), round((r @ tip).x, 4)],
                             ring_x=[round(ring_x, 4), round(sum((r @ p).x for p in ring) / len(ring), 4)])
    if not (opening["BladeL"]["tip_x"][1] > opening["BladeL"]["tip_x"][0]
            and opening["BladeL"]["ring_x"][1] < opening["BladeL"]["ring_x"][0]):
        issues.append("BladeL does not open when rotated about +Z")
    if not (opening["BladeR"]["tip_x"][1] < opening["BladeR"]["tip_x"][0]
            and opening["BladeR"]["ring_x"][1] > opening["BladeR"]["ring_x"][0]):
        issues.append("BladeR does not open when rotated about -Z")
    z_l, z_r = min(p.z for p in pts["BladeL"]), max(p.z for p in pts["BladeR"])
    if not z_l > 0 > z_r:
        issues.append("depth order wrong: BladeL z_min %.4f, BladeR z_max %.4f" % (z_l, z_r))
    return dict(issues=issues, materials=mats, length=round(y_max - y_min, 6),
                y_range=[round(y_min, 4), round(y_max, 4)], bladeL_z_min=round(z_l, 5),
                bladeR_z_max=round(z_r, 5), opening_check=opening)


def verify_compressed_glb(path):
    doc, _ = read_glb(path)
    nodes = walk_nodes(doc)
    issues, mats = check_hierarchy(doc, nodes)
    lo, hi = Vector((1e9, 1e9, 1e9)), Vector((-1e9, -1e9, -1e9))
    norm = {5120: 127.0, 5121: 255.0, 5122: 32767.0, 5123: 65535.0}
    for name in ("BladeL_Mesh", "BladeR_Mesh"):
        node, world, _ = nodes[name]
        for prim in doc["meshes"][node["mesh"]]["primitives"]:
            acc = doc["accessors"][prim["attributes"]["POSITION"]]
            div = norm.get(acc["componentType"], 1.0) if acc.get("normalized") else 1.0
            a, b = Vector(acc["min"]) / div, Vector(acc["max"]) / div
            for corner in ((a.x, a.y, a.z), (b.x, b.y, b.z)):
                w = world @ Vector(corner)
                lo, hi = Vector(map(min, lo, w)), Vector(map(max, hi, w))
    required = doc.get("extensionsRequired", [])
    if "EXT_meshopt_compression" not in required:
        issues.append("EXT_meshopt_compression not required: %s" % required)
    return dict(issues=issues, materials=mats, extensions_required=required,
                bbox_min=[round(v, 4) for v in lo], bbox_max=[round(v, 4) for v in hi],
                length=round(hi.y - lo.y, 4), size_bytes=Path(path).stat().st_size,
                mesh_node_transforms={n: {k: nodes[n][0].get(k) for k in ("translation", "scale")}
                                      for n in ("BladeL_Mesh", "BladeR_Mesh", "Rivet_Mesh")})


# ---------------------------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------------------------
def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(prog="build-scissors.py")
    ap.add_argument("--blend", type=Path, default=REPO_ROOT / "assets/3d/scissors/scissors.blend")
    ap.add_argument("--glb", type=Path, default=REPO_ROOT / "public/models/scissors.glb")
    ap.add_argument("--still", type=Path, default=REPO_ROOT / "assets/3d/scissors/scissors-still.png")
    ap.add_argument("--review-dir", type=Path, default=None,
                    help="also render front / 3/4 / side / open review images here")
    ap.add_argument("--open-deg", type=float, default=12.0, help="per-blade opening for reviews")
    ap.add_argument("--test-max-deg", type=float, default=30.0, help="overlap sweep upper bound")
    ap.add_argument("--samples", type=int, default=64)
    ap.add_argument("--view-transform", default="Khronos PBR Neutral")
    ap.add_argument("--light-scale", type=float, default=1.0)
    ap.add_argument("--meshopt-level", choices=("medium", "high"), default="medium")
    ap.add_argument("--no-compress", action="store_true", help="write the raw export as the GLB")
    return ap.parse_args(argv)


def build_and_check(args):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    materials = [make_material("Steel", STEEL_HEX, 0.18), make_material("Brass", BRASS_HEX, 0.35)]
    blade_l, blade_r, rivet, scale = build_geometry()
    objs = build_scene_objects((blade_l, blade_r, rivet), materials)
    sweep = overlap_sweep(objs, args.test_max_deg)
    lo, hi = mesh_bounds(objs)
    report = dict(
        normalize_scale=round(scale, 6),
        triangles={n: triangle_count(objs[n + "_Mesh"]) for n in ("BladeL", "BladeR", "Rivet")},
        bounds_gltf=dict(min=[round(v, 4) for v in lo], max=[round(v, 4) for v in hi]),
        pivots_at_origin=all(objs[n].matrix_world.translation.length == 0.0
                             for n in ("BladeL", "BladeR", "Rivet")),
        depth_clearance=round(depth_clearance(objs), 6),
        overlap_l_vs_r_max=max(r["l_vs_r"] for r in sweep),
        overlap_rivet_max=max(max(r["l_vs_rivet"], r["r_vs_rivet"]) for r in sweep),
        overlap_sweep_deg=[0.0, args.test_max_deg])
    report["triangles"]["total"] = sum(report["triangles"].values())
    return objs, report


def export_and_verify(objs, args, report):
    args.glb.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="scissors-glb-"))
    raw = tmp / "scissors-raw.glb"
    export_glb(objs, raw)
    report["raw_glb"] = verify_raw_glb(raw, args.open_deg)
    report["raw_glb"]["size_bytes"] = raw.stat().st_size
    if args.no_compress:
        shutil.copyfile(raw, args.glb)
    else:
        compress_glb(raw, args.glb, args.meshopt_level)
        report["glb"] = verify_compressed_glb(args.glb)
    shutil.rmtree(tmp, ignore_errors=True)


def main():
    args = parse_args()
    objs, report = build_and_check(args)
    scene = bpy.context.scene
    setup_studio(scene, args.samples, args.view_transform, args.light_scale)
    args.blend.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0  # no stray .blend1 backups in the repo
    bpy.ops.wm.save_as_mainfile(filepath=str(args.blend), compress=True)
    export_and_verify(objs, args, report)
    args.still.parent.mkdir(parents=True, exist_ok=True)
    report["still"] = render_still(scene, objs, args.still)
    if args.review_dir:
        report["reviews"] = render_reviews(scene, objs, args.review_dir, args.open_deg)
    print("SCISSORS_REPORT " + json.dumps(report, indent=2, default=str))
    problems = report["raw_glb"]["issues"] + report.get("glb", {}).get("issues", [])
    if (problems or report["overlap_l_vs_r_max"] or report["overlap_rivet_max"]
            or report["triangles"]["total"] > 15000):
        print("SCISSORS_FAILED", problems)
        sys.exit(1)


if __name__ == "__main__":
    main()
