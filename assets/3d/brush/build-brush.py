"""Build the Xbarber salon round brush (escova redonda) from scratch, headless and deterministic.

Run from the repo root (output paths resolve from this file). Needs `npx` on PATH:

    /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
        --python assets/3d/brush/build-brush.py -- [--review-dir DIR] [--no-compress]

Writes:
    public/models/brush.glb            meshopt-compressed GLB (contract below)
    <review-dir>/brush-*.png           side, three-quarter and bristle close-up renders (optional)

GLB contract (glTF space: Y up), same conventions as the razor:
    Brush (root) > Handle, Barrel, Bristles
        Each is a transform-only pivot with an identity transform at the origin and holds one
        mesh child (<name>_Mesh); meshopt quantization bakes its offset into the mesh node, so
        the named pivots stay exactly on the origin.
    The long axis is Y (as the razor). The barrel axis IS the spin axis (rotate Barrel and
    Bristles about local Y). Origin = centre of the barrel. Barrel spans y = -0.27..+0.27,
    the handle extends toward -Y; overall length (top of barrel to end cap) is exactly 1.0
    (y = +0.27 .. -0.73).
    Materials (no textures): Champagne (barrel, ferrule, end cap), Lacquer (handle),
    Bristle (bristles).
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
from mathutils import Vector

REPO_ROOT = Path(__file__).resolve().parents[3]
OUT_GLB = REPO_ROOT / "public" / "models" / "brush.glb"
PARTS = ("Handle", "Barrel", "Bristles")

# Design constants. Built in Blender space with the brush axis on +Z; the glTF exporter maps
# Blender +Z to glTF +Y. Units are final glTF units (overall length 1.0).
BARREL_HALF = 0.27
BARREL_R = 0.075
BARREL_SEGS = 48               # faces around; even columns carry bristles, odd columns vents
BARREL_ROWS = 16               # face rows along the axis
VENT_INSET = 0.0022
VENT_DEPTH = 0.0075
BRISTLE_COLS = 24
BRISTLE_ROWS = 32
BRISTLE_BASE_R = 0.0052
BRISTLE_LEN = 0.058
BRISTLE_SINK = 0.004           # base starts inside the barrel wall
BRISTLE_Z_HALF = 0.248
LENGTH_TOTAL = 1.0
END_Z = BARREL_HALF - LENGTH_TOTAL   # -0.73, bottom of the end cap

CHAMPAGNE = ("#D8BE98", 0.9, 0.3)     # hex, metallic, roughness
LACQUER = ("#7B4A3C", 0.0, 0.25)
BRISTLE = ("#4A4039", 0.0, 0.85)      # warm charcoal-brown, not pure black
IVORY = (0.9216, 0.8784, 0.8235)      # approx #F6F1EA in linear terms
TRIANGLE_BUDGET = 12000
SIZE_BUDGET = 120 * 1024


def srgb_to_linear(hex_str):
    def ch(c):
        c = int(c, 16) / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    h = hex_str.lstrip("#")
    return (ch(h[0:2]), ch(h[2:4]), ch(h[4:6]), 1.0)


def make_material(name, spec):
    hex_color, metallic, roughness = spec
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = srgb_to_linear(hex_color)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    mat.diffuse_color = srgb_to_linear(hex_color)
    return mat


# ---------------------------------------------------------------------------------------------
# Geometry
# ---------------------------------------------------------------------------------------------
def lathe(bm, profile, mats, segs):
    """Revolve (r, z) points about Z. mats[i] is the material of segment i -> i+1.
    Returns the list of faces created, in segment-major order."""
    rings = []
    for r, z in profile:
        if r < 1e-9:
            rings.append([bm.verts.new((0.0, 0.0, z))])
        else:
            rings.append([bm.verts.new((r * math.cos(2 * math.pi * k / segs),
                                        r * math.sin(2 * math.pi * k / segs), z))
                          for k in range(segs)])
    faces = []
    for i in range(len(profile) - 1):
        a, b = rings[i], rings[i + 1]
        for k in range(segs):
            k2 = (k + 1) % segs
            if len(a) == 1:
                vs = [a[0], b[k2], b[k]]
            elif len(b) == 1:
                vs = [a[k], a[k2], b[0]]
            else:
                vs = [a[k], a[k2], b[k2], b[k]]
            f = bm.faces.new(vs)
            f.material_index = mats[i]
            faces.append(f)
    return faces


def finish_mesh(name, bm, materials, sharp_deg=40.0):
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    limit = math.radians(sharp_deg)
    for f in bm.faces:
        f.smooth = True
    for e in bm.edges:
        if len(e.link_faces) == 2 and e.calc_face_angle(0.0) > limit:
            e.smooth = False
    tris = sum(len(f.verts) - 2 for f in bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in materials:
        me.materials.append(m)
    return me, tris


def build_barrel(champagne):
    bm = bmesh.new()
    bevel = 0.006
    zs = [-BARREL_HALF + BARREL_HALF * 2 * i / BARREL_ROWS for i in range(BARREL_ROWS + 1)]
    profile = [(0.0, -BARREL_HALF), (BARREL_R - bevel, -BARREL_HALF),
               (BARREL_R, -BARREL_HALF + bevel)]
    profile += [(BARREL_R, z) for z in zs[1:-1]]
    profile += [(BARREL_R, BARREL_HALF - bevel), (BARREL_R - bevel, BARREL_HALF),
                (0.0, BARREL_HALF)]
    n = len(profile) - 1
    faces = lathe(bm, profile, [0] * n, BARREL_SEGS)
    # Body faces are the segments between the first rounded ring and the last one
    first_body = 2
    vent_faces = []
    for i in range(first_body, first_body + BARREL_ROWS):
        row = i - first_body
        for k in range(BARREL_SEGS):
            if k % 2 == 1 and ((k // 2) + row) % 2 == 0:
                vent_faces.append(faces[i * BARREL_SEGS + k])
    res = bmesh.ops.inset_individual(bm, faces=vent_faces, thickness=VENT_INSET,
                                     depth=-VENT_DEPTH, use_even_offset=True)
    del res
    return finish_mesh("Barrel_Mesh", bm, [champagne], sharp_deg=35.0)


def build_handle(champagne, lacquer):
    bm = bmesh.new()
    top = -BARREL_HALF
    # (r, z); material 0 = champagne (ferrule, end cap), 1 = lacquer. Duplicate points make
    # crisp steps; the dome at the end is a small arc.
    profile = [(0.0, top), (0.033, top), (0.033, top - 0.002), (0.037, top - 0.002),
               (0.037, top - 0.040), (0.033, top - 0.040), (0.033, top - 0.044)]
    mats = [0, 0, 0, 0, 0, 0]
    lacquer_pts = [(0.0295, top - 0.044), (0.0330, top - 0.080), (0.0368, top - 0.150),
                   (0.0385, top - 0.220), (0.0372, top - 0.290), (0.0335, top - 0.360),
                   (0.0300, top - 0.405), (0.0292, top - 0.415)]
    profile += [(0.0295, top - 0.044)]
    mats += [1]
    for p in lacquer_pts[1:]:
        profile.append(p)
        mats.append(1)
    z_cap = top - 0.415
    profile += [(0.0318, z_cap), (0.0318, z_cap - 0.012)]
    mats += [0, 0]
    # domed end cap down to END_Z
    dome_h = z_cap - 0.012 - END_Z
    steps = 5
    for s in range(1, steps + 1):
        a = (math.pi / 2) * s / steps
        profile.append((0.0318 * math.cos(a), z_cap - 0.012 - dome_h * math.sin(a)))
        mats.append(0)
    profile[-1] = (0.0, END_Z)
    lathe(bm, profile, mats, 36)
    return finish_mesh("Handle_Mesh", bm, [champagne, lacquer], sharp_deg=45.0)


def hash01(i, j):
    return ((i * 73856093) ^ (j * 19349663) ^ 0x5bd1e995) % 1000 / 999.0


def build_bristles(bristle):
    bm = bmesh.new()
    for row in range(BRISTLE_ROWS):
        z = -BRISTLE_Z_HALF + 2 * BRISTLE_Z_HALF * row / (BRISTLE_ROWS - 1)
        for col in range(BRISTLE_COLS):
            ang = 2 * math.pi * (2 * col + 0.5) / BARREL_SEGS
            ca, sa = math.cos(ang), math.sin(ang)
            h = hash01(row, col)
            length = BRISTLE_LEN * (0.86 + 0.28 * h)
            r0 = BARREL_R - BRISTLE_SINK
            tilt = (h - 0.5) * 0.05                     # tiny deterministic lean along the axis
            base = []
            for k in range(6):
                t = 2 * math.pi * k / 6
                u = BRISTLE_BASE_R * math.cos(t)        # tangential
                w = BRISTLE_BASE_R * math.sin(t)        # axial
                base.append(bm.verts.new((r0 * ca - u * sa, r0 * sa + u * ca, z + w)))
            apex = bm.verts.new(((r0 + length) * ca, (r0 + length) * sa, z + tilt * length))
            for k in range(6):
                bm.faces.new([base[k], base[(k + 1) % 6], apex])
    return finish_mesh("Bristles_Mesh", bm, [bristle], sharp_deg=179.0)


# ---------------------------------------------------------------------------------------------
# Scene / export
# ---------------------------------------------------------------------------------------------
def build_scene():
    champagne = make_material("Champagne", CHAMPAGNE)
    lacquer = make_material("Lacquer", LACQUER)
    bristle = make_material("Bristle", BRISTLE)
    col = bpy.data.collections.new("Brush")
    bpy.context.scene.collection.children.link(col)

    def empty(name, parent=None):
        ob = bpy.data.objects.new(name, None)
        ob.empty_display_type = "PLAIN_AXES"
        col.objects.link(ob)
        ob.parent = parent
        return ob

    root = empty("Brush")
    objs = {"Brush": root}
    tris = {}
    for name, builder in (("Handle", lambda: build_handle(champagne, lacquer)),
                          ("Barrel", lambda: build_barrel(champagne)),
                          ("Bristles", lambda: build_bristles(bristle))):
        me, n = builder()
        pivot = empty(name, root)
        mesh_ob = bpy.data.objects.new(name + "_Mesh", me)
        col.objects.link(mesh_ob)
        mesh_ob.parent = pivot
        objs[name] = pivot
        objs[name + "_Mesh"] = mesh_ob
        tris[name] = n
    return objs, tris


def export_glb(objs, path):
    bpy.ops.object.select_all(action="DESELECT")
    for ob in objs.values():
        ob.select_set(True)
    bpy.context.view_layer.objects.active = objs["Brush"]
    wanted = dict(filepath=str(path), export_format="GLB", use_selection=True, export_yup=True,
                  export_apply=True, export_normals=True, export_texcoords=False,
                  export_tangents=False, export_materials="EXPORT", export_cameras=False,
                  export_lights=False, export_animations=False, export_skins=False,
                  export_morph=False, export_extras=False, export_attributes=False)
    available = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    bpy.ops.export_scene.gltf(**{k: v for k, v in wanted.items() if k in available})


def compress_glb(raw_path, out_path):
    npx = shutil.which("npx")
    if not npx:
        raise RuntimeError("npx not found on PATH; needed for @gltf-transform/cli")
    cmd = [npx, "-y", "@gltf-transform/cli", "meshopt", str(raw_path), str(out_path),
           "--level", "medium", "--quantize-normal", "12"]
    subprocess.run(cmd, check=True, cwd=str(Path(raw_path).parent))


def read_glb_json(path):
    data = Path(path).read_bytes()
    length = struct.unpack_from("<I", data, 8)[0]
    off = 12
    while off < length:
        clen, ctype = struct.unpack_from("<II", data, off)
        if ctype == 0x4E4F534A:
            return json.loads(data[off + 8:off + 8 + clen])
        off += 8 + clen
    raise RuntimeError("no JSON chunk")


def world_bounds(objs):
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for name in PARTS:
        ob = objs[name + "_Mesh"]
        for v in ob.data.vertices:
            p = ob.matrix_world @ v.co
            lo = Vector(min(a, b) for a, b in zip(lo, p))
            hi = Vector(max(a, b) for a, b in zip(hi, p))
    # Blender (x, y, z) -> glTF (x, z, -y)
    return (lo.x, lo.z, -hi.y), (hi.x, hi.z, -lo.y)


# ---------------------------------------------------------------------------------------------
# Review renders
# ---------------------------------------------------------------------------------------------
def setup_studio(scene):
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 64
    scene.render.film_transparent = False
    img = scene.render.image_settings
    img.file_format, img.color_mode = "PNG", "RGB"
    scene.view_settings.view_transform = "Khronos PBR Neutral"
    world = bpy.data.worlds.new("Studio")
    scene.world = world
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    nodes.clear()
    coord, sep = nodes.new("ShaderNodeTexCoord"), nodes.new("ShaderNodeSeparateXYZ")
    remap, ramp = nodes.new("ShaderNodeMapRange"), nodes.new("ShaderNodeValToRGB")
    lp, mix = nodes.new("ShaderNodeLightPath"), nodes.new("ShaderNodeMix")
    bg, out = nodes.new("ShaderNodeBackground"), nodes.new("ShaderNodeOutputWorld")
    mix.data_type = "RGBA"
    remap.inputs["From Min"].default_value = -1.0
    stops = ramp.color_ramp.elements
    stops[0].position, stops[0].color = 0.0, (0.10, 0.085, 0.07, 1.0)
    stops[1].position, stops[1].color = 1.0, (0.55, 0.52, 0.49, 1.0)
    mid = stops.new(0.55)
    mid.color = (0.30, 0.27, 0.24, 1.0)
    links.new(coord.outputs["Generated"], sep.inputs[0])
    links.new(sep.outputs["Z"], remap.inputs["Value"])
    links.new(remap.outputs["Result"], ramp.inputs["Fac"])
    links.new(lp.outputs["Is Camera Ray"], mix.inputs["Factor"])
    links.new(ramp.outputs["Color"], mix.inputs[6])
    mix.inputs[7].default_value = (*IVORY, 1.0)
    links.new(mix.outputs[2], bg.inputs["Color"])
    links.new(bg.outputs["Background"], out.inputs["Surface"])
    lights = [("Key", (-1.6, -1.8, 1.4), (1.2, 1.2), 140.0),
              ("Rim", (1.8, 1.2, 0.9), (0.8, 1.6), 100.0),
              ("Fill", (1.4, -1.8, -0.2), (1.6, 1.0), 40.0)]
    col = bpy.data.collections.new("Studio")
    scene.collection.children.link(col)
    for name, loc, size, watts in lights:
        ld = bpy.data.lights.new(name, "AREA")
        ld.shape, ld.size, ld.size_y, ld.energy = "RECTANGLE", size[0], size[1], watts
        ld.use_shadow = False
        ob = bpy.data.objects.new(name, ld)
        ob.location = loc
        ob.rotation_euler = (Vector((0, 0, -0.2)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        col.objects.link(ob)
    cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam"))
    cam.data.clip_start, cam.data.clip_end = 0.02, 50.0
    col.objects.link(cam)
    scene.camera = cam
    return cam


def shoot(scene, cam, path, azimuth, elev, dist, target, lens, size):
    az, el = math.radians(azimuth), math.radians(elev)
    # camera orbits the target; azimuth 0 looks along +Y from -Y
    pos = Vector(target) + Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el),
                                   math.sin(el))) * dist
    cam.location = pos
    cam.rotation_euler = (Vector(target) - pos).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = lens
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    return str(path)


def render_reviews(objs, out_dir):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    cam = setup_studio(scene)
    paths = [
        shoot(scene, cam, out_dir / "brush-side.png", 0.0, 0.0, 3.2, (0, 0, -0.23), 85, (700, 1200)),
        shoot(scene, cam, out_dir / "brush-three-quarter.png", 35.0, 18.0, 3.2, (0, 0, -0.23), 85,
              (900, 1200)),
        shoot(scene, cam, out_dir / "brush-bristles-closeup.png", 28.0, 12.0, 1.0, (0, 0, 0.1), 85,
              (1100, 900)),
    ]
    return paths


# ---------------------------------------------------------------------------------------------
def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--review-dir", default=None)
    ap.add_argument("--no-compress", action="store_true")
    args = ap.parse_args(argv)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    objs, tris = build_scene()
    total = sum(tris.values())
    lo, hi = world_bounds(objs)
    length = hi[1] - lo[1]
    checks = {
        "triangles_within_budget": total <= TRIANGLE_BUDGET,
        "length_is_1": abs(length - 1.0) < 1e-4,
        "barrel_centered": abs((lo[1] + hi[1]) / 2 - (END_Z + BARREL_HALF) / 2) < 1e-3,
        "axis_is_y": length > (hi[0] - lo[0]) and length > (hi[2] - lo[2]),
    }
    report = {"triangles": tris, "triangles_total": total,
              "bbox_min": [round(v, 5) for v in lo], "bbox_max": [round(v, 5) for v in hi],
              "length": round(length, 5)}

    tmp = Path(tempfile.mkdtemp(prefix="brush-"))
    raw = tmp / "brush-raw.glb"
    export_glb(objs, raw)
    OUT_GLB.parent.mkdir(parents=True, exist_ok=True)
    if args.no_compress:
        shutil.copyfile(raw, OUT_GLB)
    else:
        compress_glb(raw, OUT_GLB)
    size = OUT_GLB.stat().st_size
    doc = read_glb_json(OUT_GLB)
    names = [n.get("name") for n in doc["nodes"]]
    checks["glb_size_within_budget"] = size <= SIZE_BUDGET
    checks["nodes_present"] = all(n in names for n in ("Brush",) + PARTS)
    report.update(glb_bytes=size, glb_nodes=names)
    if args.review_dir:
        report["reviews"] = render_reviews(objs, args.review_dir)
    report["checks"] = checks
    print("BRUSH_REPORT " + json.dumps(report))
    if not all(checks.values()):
        sys.exit(1)


main()
