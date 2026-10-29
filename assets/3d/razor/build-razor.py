"""Build the Xbarber 3D straight razor (navalha) from scratch, headless and deterministic.

Run from the repo root (output paths default to repo paths resolved from this file, so the
current directory only matters for the --python argument). Needs `npx` on PATH for compression:

    /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
        --python assets/3d/razor/build-razor.py -- [--review-dir DIR] [--no-compress]

The run prints a RAZOR_REPORT JSON (triangles, bounds, fold sweep, GLB checks, still framing)
and exits non-zero if any contract check fails.

Writes:
    assets/3d/razor/razor.blend        source scene (model + studio used for the still)
    public/models/razor.glb            meshopt-compressed GLB (contract below)
    assets/3d/razor/razor-still.png    transparent orthographic front render of the open razor:
                                       960 px per unit, 32 px margins, pin on the vertical
                                       center line (source; the web pipeline makes the .webp)

GLB contract (glTF space: Y up, camera on +Z), relied on by the web code:
    Razor (root) > Handle, Blade, Pivot
        Each of the three is a transform-only pivot with an identity transform at the pin
        center (0, 0, 0) and holds one mesh child (<name>_Mesh). The extra level exists because
        meshopt position quantization bakes a bbox-centered offset into the mesh node's
        transform; keeping it on the child leaves the named pivots exactly on the pin.
    Rest pose = fully open, blade in line with the handle: butt +Y (y = +0.52), blade tip -Y
    (y = -0.48), butt to tip = 1.0, so the pin sits 0.52 from the top (pivotFromTop).
    Cutting edge faces +X, spine -X. Folding = Blade rotates about +Z: a positive angle moves the
    tip toward +X, edge first into the handle, like a real razor closing. The blade passes
    between the two handle scales (z > 0 and z < 0) and touches nothing from 0 to 180 degrees;
    at 180 degrees the scales cover the edge and the tang sticks out of the pivot end.
    Materials (no textures): Steel (mirror hollow grind and edge bevel), SteelSatin (spine,
    shank, tang), Horn (scales, wedge), Brass (pins, washers).
"""

import argparse
import json
import math
import shutil
import struct
import subprocess
import sys
import tempfile
import zlib
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector
from mathutils.bvhtree import BVHTree

REPO_ROOT = Path(__file__).resolve().parents[3]
PARTS = ("Handle", "Blade", "Pivot")

# ---------------------------------------------------------------------------------------------
# Design constants, in final glTF units (x toward the cutting edge, y toward the butt, z toward
# the camera). The layout is authored to the contract directly, so there is no normalization.
# ---------------------------------------------------------------------------------------------
PIVOT_FROM_TOP = 0.52          # butt top at y = +0.52 with the pin at the origin
TIP_Y = PIVOT_FROM_TOP - 1.0   # blade tip at y = -0.48: butt to tip is exactly 1.0

# Blade outline in the rest pose: a wide blade with a slight smile, a square point, a neck
# (shank) with jimps below the scales, and a tang that runs on past the pin. The tang hides
# between the scales while the razor is open and sticks out of the pivot end when it is closed.
SPINE_X = -0.050               # straight spine from the toe to the tang tail
EDGE_X = 0.064                 # edge line at the heel and at the toe...
SMILE = 0.004                  # ...bowed out by this much in the middle (a "smiling" edge)
TOE_R_SPINE = 0.006            # square point: both toe corners only eased
TOE_R_EDGE = 0.003
BODY_TOP_Y = -0.150            # the edge starts here; above it the shoulder turns into the shank
SHOULDER_SPAN = (-0.150, -0.106)
SHOULDER_SHAPE = 2.2           # > 1: tight round heel at the edge, long fillet into the shank
GRIND_FADE = (-0.152, -0.114)  # the hollow grind runs out into the flat shank over this span
SHANK_X = 0.016                # underside of the shank...
TANG_X = 0.014                 # ...and of the tang
THUMB_SPAN = (0.008, 0.040)    # thumb notch: shallow scallop on the tang underside
THUMB_DEPTH = 0.004
SHANK_JIMPS = (-0.100, 0.0065, 8)   # (first y, pitch, count): visible below the scales
TANG_JIMPS = (0.046, 0.0065, 7)     # visible when the razor is closed
JIMP_DEPTH = 0.0022
TAIL_GAP = 0.004

# Blade cross-section, as half-thicknesses: a thick satin spine, a concave (hollow) mirror face
# that leaves the steel thin behind the edge, and a short flat bevel. The concave face bends the
# studio into long bright bands that slide across the blade as it turns.
H_SPINE = 0.0145
SPINE_W = 0.010                # flat spine land on each face before the hollow starts
BEVEL_W = 0.0035
H_BEVEL = 0.0008
H_EDGE = 0.0002
HOLLOW_K = 2.4
HOLLOW_US = (0.04, 0.10, 0.18, 0.28, 0.40, 0.54, 0.70, 0.86)  # dense near the steep spine side
R_WALL = 0.0055                # rounding of the spine back and of the shank edges
WALL_SHAPE = 2.4               # superellipse exponent of those walls (2 = round, higher = square)
EDGE_WALL_DEG = (60, 30, 0, -30, -60)
SPINE_WALL_DEG = (-75, -50, -25, 0, 25, 50, 75)
TOE_THIN = 0.12                # the spine thins by this fraction toward the toe
TOE_STEPS, BODY_STEPS = 4, 14
N_TOP = 3 + len(HOLLOW_US) + 2  # top-row points of a blade section (spine land, hollow, bevel)
N_EDGE, N_SPINE = len(EDGE_WALL_DEG), len(SPINE_WALL_DEG)
GRIND_END = 0.5               # beta at which the hollow turns mirror: one clean line at the heel
NEVER = 2.0                    # threshold for segments that are always satin

# Handle: two horn scales (narrow at the pin, widening toward the butt), a wedge spacer at the
# butt, brass pins with washers. The outline is asymmetric like real scales: the belly that
# covers the edge when the razor is closed sits on the spine side when it is open.
SCALE_R_PIVOT = 0.044
SCALE_LEFT = dict(width=0.070, full_y=0.17, tangent_deg=16.0)   # -X: covers the closed edge
SCALE_RIGHT = dict(width=0.052, full_y=0.10, tangent_deg=8.0)   # +X: covers the closed spine
SCALE_FLARE = 0.004            # extra widening from full_y to the butt
BUTT_RY = 0.046
BUTT_CENTER_Y = PIVOT_FROM_TOP - BUTT_RY
SCALE_T = 0.016
SCALE_CROWN = 0.30             # domed outer face: highlights run along the handle
SCALE_TOP_STEPS = 8
SCALE_Z = H_SPINE + 0.0012     # inner face of the front scale; the blade fits in between
WEDGE_MIN_Y = 0.494            # beyond the blade's swept radius (~0.484), so it never collides
WEDGE_INSET = 0.0012           # nearly flush with the scales: the wedge reads as the butt block
BUTT_PIN_Y = 0.503
BUTT_PIN_SIZE = 0.7
PIN_LIFT = 0.00015             # invisible, but keeps the no-contact test exact
CLOSED_CHECK_FROM_Y = 0.10     # closed-edge coverage is measured above the pivot end

STEEL_HEX = "#E6E8EB"          # same steel as the scissors
STEEL_ROUGHNESS = 0.18         # mirror-polished hollow and bevel (as polished as the scissors)
SATIN_HEX = "#C9CDD2"          # brushed steel reads a shade greyer than mirror steel
SATIN_ROUGHNESS = 0.34         # spine, shank and tang: satin, so the spine reads apart
BRASS_HEX = "#D6A24E"          # --brass-400, as on the scissors
BRASS_ROUGHNESS = 0.35
HORN_TONES = {
    # name: (base color, roughness, coat weight, coat roughness)
    "dark-horn": ("#1C1410", 0.30, 0.45, 0.10),
    "ebony": ("#0F0D0C", 0.26, 0.55, 0.08),
    "ivory": ("#E4D7BD", 0.42, 0.35, 0.15),
}
DEFAULT_TONE = "dark-horn"
MAT_STEEL, MAT_HORN, MAT_BRASS, MAT_SATIN = 0, 1, 2, 3
MATERIAL_NAMES = ["Brass", "Horn", "Steel", "SteelSatin"]

STILL_PX_PER_UNIT = 960        # still: 1 unit = 960 px, 32 px margins -> 1024 px tall
STILL_MARGIN_PX = 32
PAGE_BG_HEX = "#14110E"        # page background, used behind the review renders
HORIZONTAL_PX_PER_UNIT = 560   # 280 CSS px long at 2x


# ---------------------------------------------------------------------------------------------
# Small math helpers
# ---------------------------------------------------------------------------------------------
def lerp(a, b, t):
    return a + (b - a) * t


def clamp01(t):
    return min(max(t, 0.0), 1.0)


def smoothstep(e0, e1, x):
    t = clamp01((x - e0) / (e1 - e0))
    return t * t * (3.0 - 2.0 * t)


def spow(v, e):
    return math.copysign(abs(v) ** e, v)


def hermite(p0, m0, p1, m1, u):
    u2, u3 = u * u, u * u * u
    return ((2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0
            + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1)


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
        """Quads between two loops; mat is one material or one per loop segment."""
        n = len(la)
        mats = mat if isinstance(mat, (list, tuple)) else [mat] * n
        for j in range(n):
            self.faces.append((la[j], la[(j + 1) % n], lb[(j + 1) % n], lb[j]))
            self.mats.append(mats[j])

    def bridge_all(self, loops, mat):
        for a, b in zip(loops, loops[1:]):
            self.bridge(a, b, mat)

    def fan(self, loop, apex_pt, mat):
        apex = self.add_loop([apex_pt])[0]
        n = len(loop)
        for j in range(n):
            self.faces.append((loop[j], loop[(j + 1) % n], apex))
            self.mats.append(mat)

    def cap(self, loop, mat):
        self.faces.append(tuple(loop))
        self.mats.append(mat)


# ---------------------------------------------------------------------------------------------
# Blade outline: each station is a line from the spine side (s) to the edge side (e) carrying a
# cross-section loop; the toe stations turn around the eased corners of the square point.
# ---------------------------------------------------------------------------------------------
def grind_blend(y):
    return 1.0 - smoothstep(GRIND_FADE[0], GRIND_FADE[1], y)


def blade_taper(y):
    return 1.0 - TOE_THIN * smoothstep(-0.25, TIP_Y, y)


def edge_line_x(y):
    """Cutting edge: straight at both ends, bowed toward +X in the middle (the smile)."""
    s = clamp01((BODY_TOP_Y - y) / (BODY_TOP_Y - TIP_Y))
    return EDGE_X + SMILE * math.sin(math.pi * s)


def underside_x(y):
    """Edge-side outline from the heel up: round heel, shoulder fillet, shank, thumb notch, tang."""
    s = clamp01((y - SHOULDER_SPAN[0]) / (SHOULDER_SPAN[1] - SHOULDER_SPAN[0]))
    shoulder = 1.0 - (1.0 - s) ** SHOULDER_SHAPE
    x = lerp(edge_line_x(y), SHANK_X, shoulder) + (TANG_X - SHANK_X) * smoothstep(0.0, TANG_JIMPS[0], y)
    a, b = THUMB_SPAN
    if a < y < b:
        x -= THUMB_DEPTH * math.sin(math.pi * (y - a) / (b - a)) ** 2
    return x


def jimps_end(jimps):
    return jimps[0] + jimps[1] * jimps[2]


def tail_circle():
    """Center and radius of the rounded tang tail."""
    r = (TANG_X - SPINE_X) / 2
    return Vector(((SPINE_X + TANG_X) / 2, jimps_end(TANG_JIMPS) + TAIL_GAP)), r


def station(s, e, beta, taper):
    return dict(s=Vector(s), e=Vector(e), beta=beta, taper=taper)


def toe_station(a):
    """a = 0 where the toe corners start, 1 on the flat end of the square point."""
    phi = math.radians(90.0 * a)
    s = (SPINE_X + TOE_R_SPINE * (1 - math.cos(phi)), TIP_Y + TOE_R_SPINE * (1 - math.sin(phi)))
    e = (EDGE_X - TOE_R_EDGE * (1 - math.cos(phi)), TIP_Y + TOE_R_EDGE * (1 - math.sin(phi)))
    return station(s, e, 1.0, blade_taper(s[1]))


def body_station(v):
    """v = 0 at the heel, 1 where the toe corners start."""
    y_s = lerp(BODY_TOP_Y, TIP_Y + TOE_R_SPINE, v)
    y_e = lerp(BODY_TOP_Y, TIP_Y + TOE_R_EDGE, v)
    return station((SPINE_X, y_s), (edge_line_x(y_e), y_e), 1.0, blade_taper(y_s))


def tang_station(y, notch):
    return station((SPINE_X + notch, y), (underside_x(y) - notch, y), grind_blend(y), blade_taper(y))


def jimp_stations(jimps):
    """V notches cut into both edges: a crest and a valley station per pitch."""
    y0, pitch, count = jimps
    return [tang_station(y0 + k * pitch / 2, JIMP_DEPTH * (k % 2)) for k in range(2 * count + 1)]


def tail_stations():
    c, r = tail_circle()
    out = []
    for deg in (0, 15, 30, 45, 60, 72, 82):
        a = math.radians(deg)
        y, hw = c.y + r * math.sin(a), r * math.cos(a)
        out.append(station((c.x - hw, y), (c.x + hw, y), 0.0, 1.0))
    return out


def blade_stations():
    """From the flat end of the toe up to the tang tail."""
    st = [toe_station(1.0 - k / TOE_STEPS) for k in range(TOE_STEPS)]
    st += [body_station(1.0 - k / BODY_STEPS) for k in range(BODY_STEPS)]
    st += [tang_station(lerp(BODY_TOP_Y, SHANK_JIMPS[0], k / 9), 0.0) for k in range(9)]
    st += jimp_stations(SHANK_JIMPS)
    st += [tang_station(y, 0.0) for y in (-0.036, -0.024, -0.012, 0.0)]
    st += [tang_station(lerp(THUMB_SPAN[0], THUMB_SPAN[1], k / 4), 0.0) for k in range(5)]
    st += jimp_stations(TANG_JIMPS)
    return st + tail_stations()


# ---------------------------------------------------------------------------------------------
# Blade cross-section and solid
# ---------------------------------------------------------------------------------------------
def ground_half_thickness(d, width, h_spine):
    """Hollow-ground face: flat spine land, concave hollow, then a short flat bevel."""
    bevel_at = width - BEVEL_W
    if d <= SPINE_W:
        return h_spine
    if d <= bevel_at:
        u = (d - SPINE_W) / (bevel_at - SPINE_W)
        return H_BEVEL + (h_spine - H_BEVEL) * (1.0 - u) ** HOLLOW_K
    return lerp(H_BEVEL, H_EDGE, (d - bevel_at) / BEVEL_W)


def wall(center_d, r, h, degrees):
    e = 2 / WALL_SHAPE
    return [(center_d + r * spow(math.cos(math.radians(a)), e), h * spow(math.sin(math.radians(a)), e))
            for a in degrees]


def blade_section(width, beta, taper):
    """Closed (d, z) loop across one station; d runs from the spine (0) to the edge side (width).
    Order: top row spine -> edge, edge wall, bottom row edge -> spine, spine back.
    beta = 1 gives the hollow-ground blade, 0 the flat shank and tang."""
    h_spine = H_SPINE * taper
    r_s = min(R_WALL, 0.3 * width)
    r_e = min(lerp(R_WALL, H_EDGE, beta), 0.3 * width)
    bevel_at = width - lerp(R_WALL + 0.003, BEVEL_W, beta)
    flat = [lerp(r_s, width - r_e, k / (N_TOP - 1)) for k in range(N_TOP)]
    ground = ([r_s, lerp(r_s, SPINE_W, 0.5), SPINE_W] + [lerp(SPINE_W, bevel_at, u) for u in HOLLOW_US]
              + [bevel_at, width - r_e])
    ds = [lerp(f, g, beta) for f, g in zip(flat, ground)]
    top = [(d, lerp(h_spine, ground_half_thickness(d, width, h_spine), beta)) for d in ds]
    bottom = [(d, -h) for d, h in reversed(top)]
    edge = wall(width - r_e, r_e, top[-1][1], EDGE_WALL_DEG)
    spine = wall(r_s, -r_s, top[0][1], SPINE_WALL_DEG)
    return top + edge + bottom + spine


def bottom_index(k):
    """Loop index of the bottom-row point mirroring top-row point k."""
    return N_TOP + N_EDGE + (N_TOP - 1 - k)


# Grind shoulder (spine land -> hollow) and bevel lines on both faces: always crisp.
BLADE_SHARP = (2, N_TOP - 2, bottom_index(2), bottom_index(N_TOP - 2))


def top_segment_threshold(j):
    """Spine land segments stay satin; hollow and bevel are mirror wherever the grind is."""
    return NEVER if j < 2 else GRIND_END


def segment_thresholds():
    """beta threshold per loop segment (point j -> j + 1) above which it is mirror Steel."""
    thr = []
    for j in range(2 * N_TOP + N_EDGE + N_SPINE):
        if j < N_TOP - 1:
            thr.append(top_segment_threshold(j))
        elif j < N_TOP + N_EDGE:
            thr.append(GRIND_END)  # around the edge
        elif j < 2 * N_TOP + N_EDGE - 1:
            thr.append(top_segment_threshold(N_TOP - 2 - (j - N_TOP - N_EDGE)))
        else:
            thr.append(NEVER)  # spine back
    return thr


def station_loop(st):
    width = (st["e"] - st["s"]).length
    axis = (st["e"] - st["s"]) / width
    return [(st["s"].x + axis.x * d, st["s"].y + axis.y * d, z)
            for d, z in blade_section(width, st["beta"], st["taper"])]


def build_blade():
    mb = MeshBuilder()
    stations = blade_stations()
    loops = [mb.add_loop(station_loop(st)) for st in stations]
    thr = segment_thresholds()
    for i in range(len(loops) - 1):
        beta = (stations[i]["beta"] + stations[i + 1]["beta"]) / 2
        mb.bridge(loops[i], loops[i + 1], [MAT_STEEL if beta >= t else MAT_SATIN for t in thr])
        if min(stations[i]["beta"], stations[i + 1]["beta"]) >= 0.5:
            mb.sharp += [(loops[i][k], loops[i + 1][k]) for k in BLADE_SHARP]
    mb.cap(list(reversed(loops[0])), MAT_SATIN)  # flat end of the square point
    c, r = tail_circle()
    mb.fan(loops[-1], (c.x, c.y + r, 0.0), MAT_SATIN)
    return mb


# ---------------------------------------------------------------------------------------------
# Handle: tapered, domed scales with soft edges, wedge, butt pin; the pivot pin on its own
# ---------------------------------------------------------------------------------------------
def flank_x(y, side):
    """Distance of one scale flank from the pin axis: the round pivot end, a Hermite run that
    leaves the circle tangentially and reaches `width` at `full_y`, then a gentle flare."""
    phi = math.radians(side["tangent_deg"])
    y_t = -SCALE_R_PIVOT * math.sin(phi)
    if y <= y_t:
        return math.sqrt(max(0.0, SCALE_R_PIVOT ** 2 - y * y))
    if y < side["full_y"]:
        span = side["full_y"] - y_t
        return hermite(SCALE_R_PIVOT * math.cos(phi), math.tan(phi) * span, side["width"], 0.0,
                       (y - y_t) / span)
    return side["width"] + SCALE_FLARE * smoothstep(side["full_y"], BUTT_CENTER_Y, y)


def butt_ellipse():
    """Center x and half-width of the elliptical butt end."""
    x_l, x_r = -flank_x(BUTT_CENTER_Y, SCALE_LEFT), flank_x(BUTT_CENTER_Y, SCALE_RIGHT)
    return (x_l + x_r) / 2, (x_r - x_l) / 2


def scale_bounds(y):
    """(x_left, x_right) of the scale outline at height y."""
    if y > BUTT_CENTER_Y:
        c, a = butt_ellipse()
        k = math.sqrt(max(0.0, 1.0 - ((y - BUTT_CENTER_Y) / BUTT_RY) ** 2))
        return c - a * k, c + a * k
    return -flank_x(y, SCALE_LEFT), flank_x(y, SCALE_RIGHT)


def scale_thickness(w):
    """Thinner toward the rounded ends, so they read soft from the side too."""
    return SCALE_T * (0.6 + 0.4 * smoothstep(0.0, 0.035, w))


def scale_outer(x, w):
    """Height of the domed outer face above the scale's inner face (x from the local center)."""
    return scale_thickness(w) * (1.0 - SCALE_CROWN * (x / w) ** 2)


def scale_section(w):
    """Closed (x, height) loop: domed top, rounded outer edges, flat inner face."""
    t = scale_thickness(w)
    r_o, r_i = min(0.55 * t, 0.3 * w), min(0.15 * t, 0.1 * w)
    xs = (lerp(-(w - r_o), w - r_o, k / SCALE_TOP_STEPS) for k in range(SCALE_TOP_STEPS + 1))
    top = [(x, scale_outer(x, w)) for x in xs]
    t_e = top[-1][1]
    right = [(w - r_o + r_o * math.cos(math.radians(a)), t_e - r_o + r_o * math.sin(math.radians(a)))
             for a in (60, 30, 0)]
    right += [(w - r_i + r_i * math.cos(math.radians(-45)), r_i + r_i * math.sin(math.radians(-45))),
              (w - r_i, 0.0)]
    return top + right + [(-x, z) for x, z in reversed(right)]


def scale_stations():
    ys = [-SCALE_R_PIVOT * math.sin(math.radians(a)) for a in (82, 70, 56, 42, 30, 20)]
    ys += [lerp(-0.012, 0.20, k / 14) for k in range(15)]
    ys += [lerp(0.20, BUTT_CENTER_Y, k / 9) for k in range(1, 10)]
    return ys + [BUTT_CENTER_Y + BUTT_RY * math.sin(math.radians(a)) for a in (12, 25, 38, 51, 64, 76, 85)]


def build_scale(mb, sign):
    loops = []
    for y in scale_stations():
        x_l, x_r = scale_bounds(y)
        c, w = (x_l + x_r) / 2, (x_r - x_l) / 2
        loops.append(mb.add_loop([(c + x, y, sign * (SCALE_Z + h)) for x, h in scale_section(w)]))
    mb.bridge_all(loops, MAT_HORN)
    mid = sign * (SCALE_Z + 0.45 * scale_thickness(0.0))
    mb.fan(loops[0], (0.0, -SCALE_R_PIVOT, mid), MAT_HORN)
    mb.fan(loops[-1], (butt_ellipse()[0], PIVOT_FROM_TOP, mid), MAT_HORN)


def build_wedge(mb):
    """Spacer filling the gap between the scales at the butt, nearly flush with their outline
    and outside the radius the blade sweeps."""
    c, a = butt_ellipse()
    a_in, ry_in = a - WEDGE_INSET, BUTT_RY - WEDGE_INSET
    phi0 = math.asin((WEDGE_MIN_Y - BUTT_CENTER_Y) / ry_in)
    outline = [(c + a_in * math.cos(p), BUTT_CENTER_Y + ry_in * math.sin(p))
               for p in (lerp(phi0, math.pi - phi0, k / 16) for k in range(17))]
    hz = SCALE_Z - 0.00005
    front = mb.add_loop([(x, y, hz) for x, y in outline])
    back = mb.add_loop([(x, y, -hz) for x, y in outline])
    mb.bridge(front, back, MAT_HORN)
    mb.cap(front, MAT_HORN)
    mb.cap(list(reversed(back)), MAT_HORN)


def pin_profile(size):
    """(radius, height) rings of a washer plus a domed pin head, revolved around the pin axis."""
    rings = [(0.0165, 0.0), (0.0165, 0.0015), (0.0159, 0.0022), (0.0118, 0.0022),
             (0.0118, 0.0028), (0.0112, 0.0034)]
    rings += [(0.0108 * math.cos(math.radians(a)), 0.0034 + 0.0040 * math.sin(math.radians(a)))
              for a in (20, 42, 62, 80)]
    return [(r * size, h * size) for r, h in rings], 0.0074 * size


def scale_seat(x, y):
    x_l, x_r = scale_bounds(y)
    return SCALE_Z + scale_outer(x - (x_l + x_r) / 2, (x_r - x_l) / 2) + PIN_LIFT


def build_pin(mb, center, sign, size, n_seg):
    """Washer seated on the domed scale (its bottom ring follows the dome) and a pin head."""
    profile, apex_h = pin_profile(size)
    cx, cy = center
    dirs = [(math.cos(2 * math.pi * k / n_seg), math.sin(2 * math.pi * k / n_seg)) for k in range(n_seg)]
    r0 = profile[0][0]
    top_seat = max([scale_seat(cx + r0 * c, cy + r0 * s) for c, s in dirs] + [scale_seat(cx, cy)])
    loops = []
    for i, (r, h) in enumerate(profile):
        ring = []
        for c, s in dirs:
            x, y = cx + r * c, cy + r * s
            ring.append((x, y, sign * ((scale_seat(x, y) if i == 0 else top_seat) + h)))
        loops.append(mb.add_loop(ring))
    mb.bridge_all(loops, MAT_BRASS)
    # Open at the bottom, like the scissors rivet: a flat cap would cut into the domed scale.
    mb.fan(loops[-1], (cx, cy, sign * (top_seat + apex_h)), MAT_BRASS)


def build_handle():
    mb = MeshBuilder()
    butt_pin = (butt_ellipse()[0], BUTT_PIN_Y)
    for sign in (1.0, -1.0):
        build_scale(mb, sign)
        build_pin(mb, butt_pin, sign, BUTT_PIN_SIZE, 32)
    build_wedge(mb)
    return mb


def build_pivot():
    mb = MeshBuilder()
    for sign in (1.0, -1.0):
        build_pin(mb, (0.0, 0.0), sign, 1.0, 40)
    return mb


# ---------------------------------------------------------------------------------------------
# Blender objects and materials
# ---------------------------------------------------------------------------------------------
def principled(mat):
    mat.use_nodes = True
    return next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def make_metal(name, hex_color, roughness):
    mat = bpy.data.materials.new(name)
    bsdf = principled(mat)
    bsdf.inputs["Base Color"].default_value = srgb_hex_to_linear(hex_color)
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = roughness
    mat.diffuse_color = srgb_hex_to_linear(hex_color)
    mat.use_backface_culling = True  # every part is a closed solid: export single-sided
    return mat


def apply_horn_tone(mat, tone):
    """Switches the handle tone (dark-horn, ebony, ivory) in place."""
    hex_color, roughness, coat, coat_roughness = HORN_TONES[tone]
    bsdf = principled(mat)
    bsdf.inputs["Base Color"].default_value = srgb_hex_to_linear(hex_color)
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Coat Weight"].default_value = coat  # exported as KHR_materials_clearcoat
    bsdf.inputs["Coat Roughness"].default_value = coat_roughness
    mat.diffuse_color = srgb_hex_to_linear(hex_color)


def make_materials(tone):
    horn = bpy.data.materials.new("Horn")
    horn.use_backface_culling = True
    apply_horn_tone(horn, tone)
    return [make_metal("Steel", STEEL_HEX, STEEL_ROUGHNESS), horn,
            make_metal("Brass", BRASS_HEX, BRASS_ROUGHNESS),
            make_metal("SteelSatin", SATIN_HEX, SATIN_ROUGHNESS)]


def builder_to_mesh(name, mb, materials, sharp_angle_deg=50.0):
    used = sorted(set(mb.mats))
    slot = {m: i for i, m in enumerate(used)}
    bm = bmesh.new()
    bverts = [bm.verts.new(to_blender(v)) for v in mb.verts]
    for face, mat in zip(mb.faces, mb.mats):
        f = bm.faces.new([bverts[i] for i in face])
        f.material_index = slot[mat]
        f.smooth = True
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    limit = math.radians(sharp_angle_deg)
    for e in bm.edges:  # crisp only where a real crease exists (toe end, washer steps)
        if len(e.link_faces) == 2 and e.calc_face_angle(0.0) > limit:
            e.smooth = False
    for a, b in mb.sharp:  # grind shoulder and bevel lines: always crisp facets
        e = bm.edges.get((bverts[a], bverts[b]))
        if e:
            e.smooth = False
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in used:
        me.materials.append(materials[m])
    return me


def build_scene_objects(builders, materials):
    col = bpy.data.collections.new("Razor")
    bpy.context.scene.collection.children.link(col)

    def empty(name, parent):
        ob = bpy.data.objects.new(name, None)
        ob.empty_display_type = "PLAIN_AXES"
        ob.empty_display_size = 0.05
        ob.parent = parent
        col.objects.link(ob)
        return ob

    root = empty("Razor", None)
    objs = {"Razor": root}
    for name in PARTS:
        pivot = empty(name, root)
        mesh_ob = bpy.data.objects.new(name + "_Mesh", builder_to_mesh(name + "_Mesh", builders[name], materials))
        mesh_ob.parent = pivot
        col.objects.link(mesh_ob)
        objs[name], objs[name + "_Mesh"] = pivot, mesh_ob
    return objs


def set_fold(objs, deg):
    """glTF +Z is Blender -Y: a positive fold turns Blade counter-clockwise seen from the camera."""
    objs["Blade"].rotation_euler = (0.0, -math.radians(deg), 0.0)
    bpy.context.view_layer.update()


# ---------------------------------------------------------------------------------------------
# Geometric checks
# ---------------------------------------------------------------------------------------------
def world_bvh(ob):
    mw = ob.matrix_world
    verts = [mw @ v.co for v in ob.data.vertices]
    return BVHTree.FromPolygons(verts, [tuple(p.vertices) for p in ob.data.polygons])


def gltf_points(ob):
    """World-space vertices of a mesh object in glTF axes."""
    return [Vector((p.x, p.z, -p.y)) for p in (ob.matrix_world @ v.co for v in ob.data.vertices)]


def fold_sweep(objs, max_deg, step=1.0):
    """Intersecting triangle pairs between the folding blade and the static handle / pivot."""
    handle, pivot = world_bvh(objs["Handle_Mesh"]), world_bvh(objs["Pivot_Mesh"])
    rows = []
    for k in range(int(round(max_deg / step)) + 1):
        set_fold(objs, k * step)
        blade = world_bvh(objs["Blade_Mesh"])
        rows.append(dict(deg=k * step, blade_vs_handle=len(blade.overlap(handle)),
                         blade_vs_pivot=len(blade.overlap(pivot))))
    set_fold(objs, 0.0)
    return rows


def sweep_summary(rows, max_deg):
    sel = [r for r in rows if r["deg"] <= max_deg + 1e-9]
    worst = max(sel, key=lambda r: r["blade_vs_handle"] + r["blade_vs_pivot"])
    return dict(range_deg=[0.0, max_deg], steps=len(sel),
                blade_vs_handle_max=max(r["blade_vs_handle"] for r in sel),
                blade_vs_pivot_max=max(r["blade_vs_pivot"] for r in sel), worst_deg=worst["deg"])


def closed_overhang(blade):
    """How far the closed (180 deg) blade pokes out of the scale outline, above the pivot end.
    Positive = visible past the scales; the tang protruding from the pivot end is by design."""
    worst = -1.0
    for p in blade:
        x, y = -p.x, -p.y
        if CLOSED_CHECK_FROM_Y <= y <= PIVOT_FROM_TOP:
            x_l, x_r = scale_bounds(y)
            worst = max(worst, x_l - x, x - x_r)
    return round(worst, 5)


def clearances(objs):
    blade = gltf_points(objs["Blade_Mesh"])
    handle = gltf_points(objs["Handle_Mesh"])
    wedge = [p for p in handle if abs(p.z) < SCALE_Z - 1e-6]
    swept = max(math.hypot(p.x, p.y) for p in blade)
    return dict(scale_gap=round(SCALE_Z - max(abs(p.z) for p in blade), 6),
                blade_swept_radius=round(swept, 5),
                wedge_clearance=round(min(math.hypot(p.x, p.y) for p in wedge) - swept, 5),
                closed_edge_overhang=closed_overhang(blade),
                handle_vs_pivot=len(world_bvh(objs["Handle_Mesh"]).overlap(world_bvh(objs["Pivot_Mesh"]))))


def triangle_count(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def mesh_bounds(objs):
    """Current-pose bounds in glTF space (x, y, z) over every part."""
    pts = [p for n in PARTS for p in gltf_points(objs[n + "_Mesh"])]
    return ((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)),
            (max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))


# ---------------------------------------------------------------------------------------------
# Studio: identical to the scissors studio (assets/3d/scissors/build-scissors.py), so both
# stills look like they come from the same case. Soft key upper-left, dim front box, two strip
# rims, gradient world; no shadow maps (the web scene casts none either).
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
    mid.color = (0.150, 0.135, 0.120, 1.0)
    links.new(coord.outputs["Generated"], sep.inputs[0])
    links.new(sep.outputs["Z"], remap.inputs["Value"])
    links.new(remap.outputs["Result"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bg.inputs["Color"])
    links.new(bg.outputs["Background"], out.inputs["Surface"])


def setup_lights(scene, light_scale):
    col = bpy.data.collections.new("Studio")
    scene.collection.children.link(col)
    for name, loc, size, watts, color in STUDIO_LIGHTS:
        ld = bpy.data.lights.new(name, "AREA")
        ld.shape, ld.size, ld.size_y = "RECTANGLE", size[0], size[1]
        ld.energy, ld.color = watts * light_scale, color
        ld.use_shadow = False
        ob = bpy.data.objects.new(name, ld)
        ob.location = loc
        ob.rotation_euler = (Vector(LIGHT_TARGET) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        col.objects.link(ob)
    for name, kind in (("StillCamera", "ORTHO"), ("ReviewCamera", "PERSP")):
        cam = bpy.data.objects.new(name, bpy.data.cameras.new(name))
        cam.data.type = kind
        cam.data.lens = 100.0
        cam.data.clip_start, cam.data.clip_end = 0.05, 50.0
        cam.rotation_euler = (math.radians(90.0), 0.0, 0.0)  # look along +Y (glTF -Z)
        col.objects.link(cam)


def setup_studio(scene, samples, view_transform, light_scale):
    setup_lights(scene, light_scale)
    setup_world(scene)
    scene.render.engine = "BLENDER_EEVEE"
    eevee = scene.eevee
    eevee.taa_render_samples = samples
    if hasattr(eevee, "use_raytracing"):
        eevee.use_raytracing = True
    scene.render.film_transparent = True
    scene.render.resolution_percentage = 100
    img = scene.render.image_settings
    img.file_format, img.color_mode, img.color_depth, img.compression = "PNG", "RGBA", "8", 100
    # Khronos PBR Neutral, as on the scissors: three.js has the same curve
    # (THREE.NeutralToneMapping), so the still and the live model can match.
    scene.view_settings.view_transform = view_transform
    scene.view_settings.look = "None"


def render_to(scene, path, width, height):
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def aim_ortho(scene, center_x, center_z, width, height, px_per_unit):
    cam = bpy.data.objects["StillCamera"]
    cam.data.ortho_scale = max(width, height) / px_per_unit
    cam.location = (center_x, -6.0, center_z)
    scene.camera = cam


def render_still(scene, objs, path):
    """Orthographic front view of the open razor, pin on the vertical center line."""
    (x0, y0, _), (x1, y1, _) = mesh_bounds(objs)
    width = 2 * math.ceil(max(abs(x0), abs(x1)) * STILL_PX_PER_UNIT + STILL_MARGIN_PX)
    height = math.ceil((y1 - y0) * STILL_PX_PER_UNIT + 2 * STILL_MARGIN_PX)
    # Shift so the top margin is exactly STILL_MARGIN_PX above the butt.
    center_y = y1 + STILL_MARGIN_PX / STILL_PX_PER_UNIT - height / 2 / STILL_PX_PER_UNIT
    aim_ortho(scene, 0.0, center_y, width, height, STILL_PX_PER_UNIT)
    render_to(scene, path, width, height)
    pivot_px = (width / 2, STILL_MARGIN_PX + y1 * STILL_PX_PER_UNIT)
    return dict(path=str(path), width=width, height=height, px_per_unit=STILL_PX_PER_UNIT,
                pivot_px=pivot_px, bounds=[[round(x0, 5), round(y0, 5)], [round(x1, 5), round(y1, 5)]])


# ---------------------------------------------------------------------------------------------
# Review renders (not shipped), composited on the page background
# ---------------------------------------------------------------------------------------------
def load_rgba(path):
    """8-bit straight-alpha RGBA as a (rows, cols, 4) uint8 array, top row first."""
    img = bpy.data.images.load(str(path), check_existing=False)
    w, h = img.size
    buf = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(buf)
    bpy.data.images.remove(img)
    return (buf.reshape(h, w, 4)[::-1] * 255.0 + 0.5).astype(np.uint8)


def on_background(rgba, hex_color):
    bg = np.array([int(hex_color[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)
    a = rgba[..., 3:4].astype(np.float32) / 255.0
    out = np.full(rgba.shape, 255, dtype=np.uint8)
    out[..., :3] = np.clip(rgba[..., :3].astype(np.float32) * a + bg * (1.0 - a) + 0.5, 0, 255)
    return out


def write_png(path, rgba):
    h, w, _ = rgba.shape
    raw = b"".join(b"\x00" + rgba[row].tobytes() for row in range(h))

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))
    Path(path).write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
                           + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))
    return str(path)


def flatten_on_page(path):
    """Replaces a transparent render with the same image over the page background."""
    return write_png(path, on_background(load_rgba(path), PAGE_BG_HEX))


def mesh_objects(objs):
    return [objs[n + "_Mesh"] for n in PARTS]


def aim_review_camera(cam, obs, width, height, margin=1.12):
    pts = [ob.matrix_world @ v.co for ob in obs for v in ob.data.vertices]
    xs, ys, zs = [p.x for p in pts], [p.y for p in pts], [p.z for p in pts]
    tan_major = 18.0 / cam.data.lens  # sensor fit AUTO: 36 mm spans the larger image side
    tan_w = tan_major * width / max(width, height)
    tan_h = tan_major * height / max(width, height)
    dist = max((max(xs) - min(xs)) / 2 * margin / tan_w, (max(zs) - min(zs)) / 2 * margin / tan_h)
    cam.location = ((min(xs) + max(xs)) / 2, min(ys) - dist, (min(zs) + max(zs)) / 2)


def pose(objs, root_matrix, fold):
    objs["Razor"].matrix_basis = root_matrix
    set_fold(objs, fold)


def review_shot(scene, objs, path, spin, fold, size):
    """Perspective shot; the object turns about its long axis while camera and lights stay put."""
    pose(objs, Matrix.Rotation(math.radians(spin), 4, "Z"), fold)
    cam = bpy.data.objects["ReviewCamera"]
    aim_review_camera(cam, mesh_objects(objs), *size)
    scene.camera = cam
    render_to(scene, path, *size)
    pose(objs, Matrix.Identity(4), 0.0)
    return flatten_on_page(path)


def horizontal_matrix():
    """Blade lying horizontal, tip to the right, edge down (the back scale faces the camera):
    glTF Ry(180) then Rz(+90), i.e. three.js rotation.set(0, Math.PI, -Math.PI / 2)."""
    return Matrix.Rotation(-math.pi / 2, 4, "Y") @ Matrix.Rotation(math.pi, 4, "Z")


def horizontal_shot(scene, objs, path, fold, margin_px=40):
    """Orthographic, at the on-page scale (HORIZONTAL_PX_PER_UNIT)."""
    pose(objs, horizontal_matrix(), fold)
    pts = [ob.matrix_world @ v.co for ob in mesh_objects(objs) for v in ob.data.vertices]
    xs, zs = [p.x for p in pts], [p.z for p in pts]
    ppu = HORIZONTAL_PX_PER_UNIT
    width = math.ceil((max(xs) - min(xs)) * ppu + 2 * margin_px)
    height = math.ceil((max(zs) - min(zs)) * ppu + 2 * margin_px)
    aim_ortho(scene, (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2, width, height, ppu)
    render_to(scene, path, width, height)
    pose(objs, Matrix.Identity(4), 0.0)
    return flatten_on_page(path)


def render_tone_reviews(scene, objs, out_dir, horn):
    """Open razor in each handle tone (review only; the GLB keeps the default tone)."""
    frames, paths = [], []
    for tone in HORN_TONES:
        apply_horn_tone(horn, tone)
        paths.append(review_shot(scene, objs, out_dir / ("review-tone-%s.png" % tone), 30.0, 0.0, (480, 1100)))
        frames.append(load_rgba(paths[-1]))
    apply_horn_tone(horn, DEFAULT_TONE)
    paths.append(write_png(out_dir / "review-tones.png", np.concatenate(frames, axis=1)))
    return paths


def render_reviews(scene, objs, out_dir, horn):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    shots = [("open-front", 0.0, 0.0, (720, 1280)), ("open-three-quarter", 35.0, 0.0, (720, 1280)),
             ("fold-90-three-quarter", 35.0, 90.0, (1100, 1100)),
             ("fold-150-three-quarter", 35.0, 150.0, (900, 1100))]
    paths = [review_shot(scene, objs, out_dir / ("review-%s.png" % name), spin, fold, size)
             for name, spin, fold, size in shots]
    for name, fold in (("open", 0.0), ("closed", 180.0)):
        paths.append(horizontal_shot(scene, objs, out_dir / ("review-horizontal-%s-280px-2x.png" % name), fold))
    return paths + render_tone_reviews(scene, objs, out_dir, horn)


# ---------------------------------------------------------------------------------------------
# Export, compression and verification of the GLB contract
# ---------------------------------------------------------------------------------------------
def export_glb(objs, path):
    bpy.ops.object.select_all(action="DESELECT")
    for ob in objs.values():
        ob.select_set(True)
    bpy.context.view_layer.objects.active = objs["Razor"]
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
    root = nodes.get("Razor")
    if not root or root[2] is not None:
        issues.append("Razor is not a root node")
    for name in PARTS:
        entry = nodes.get(name)
        if not entry or entry[2] != "Razor":
            issues.append("%s missing or not a child of Razor" % name)
            continue
        if any(k in entry[0] for k in ("translation", "rotation", "scale", "matrix", "mesh")):
            issues.append("%s pivot is not an identity transform-only node: %s" % (name, entry[0]))
        if (name + "_Mesh") not in nodes or nodes[name + "_Mesh"][2] != name:
            issues.append("%s_Mesh missing under %s" % (name, name))
    mats = sorted(m.get("name") for m in doc.get("materials", []))
    if mats != MATERIAL_NAMES:
        issues.append("unexpected materials %s" % mats)
    return issues, mats


def raw_mesh_points(doc, binary, nodes, name):
    node, world, _ = nodes[name + "_Mesh"]
    return [world @ p for prim in doc["meshes"][node["mesh"]]["primitives"]
            for p in accessor_floats(doc, binary, prim["attributes"]["POSITION"])]


def edge_side_check(blade):
    """The cutting edge (thin side) must face +X and the spine (thick side) -X."""
    body = [p for p in blade if p.y < -0.2]
    x_lo, x_hi = min(p.x for p in body), max(p.x for p in body)
    thin = max(abs(p.z) for p in body if p.x > x_hi - 0.002)
    thick = max(abs(p.z) for p in body if p.x < x_lo + 0.002)
    ok = thin < 0.0015 < 0.006 < thick
    return ok, dict(edge_x=round(x_hi, 4), spine_x=round(x_lo, 4), edge_half_thickness=round(thin, 5),
                    spine_half_thickness=round(thick, 5))


def fold_check(blade, fold_deg, butt_y):
    tip = min(blade, key=lambda p: p.y)
    out = {}
    for deg in (fold_deg, 180.0):
        rot = Matrix.Rotation(math.radians(deg), 3, "Z")
        moved = [rot @ p for p in blade]
        out["%g" % deg] = dict(tip=[round((rot @ tip).x, 4), round((rot @ tip).y, 4)],
                               y_max=round(max(p.y for p in moved), 4))
    issues = []
    if not out["%g" % fold_deg]["tip"][0] > tip.x + 0.1:
        issues.append("Blade tip does not move toward +X when rotated about +Z")
    if not out["180"]["y_max"] < butt_y:
        issues.append("closed blade reaches past the butt")
    return issues, dict(rest_tip=[round(tip.x, 4), round(tip.y, 4)], **out)


def between_scales_check(handle, blade):
    mid = [p for p in handle if 0.2 < p.y < 0.4]  # scales only: no pins or wedge here
    front, back = min(p.z for p in mid if p.z > 0), max(p.z for p in mid if p.z < 0)
    blade_z = max(abs(p.z) for p in blade)
    ok = front > blade_z and -back > blade_z
    return ok, dict(front_scale_inner_z=round(front, 5), back_scale_inner_z=round(back, 5),
                    blade_half_thickness=round(blade_z, 5))


def verify_raw_glb(path, fold_deg):
    """Reads float positions back from the uncompressed export and checks the contract."""
    doc, binary = read_glb(path)
    nodes = walk_nodes(doc)
    issues, mats = check_hierarchy(doc, nodes)
    pts = {n: raw_mesh_points(doc, binary, nodes, n) for n in PARTS}
    allp = [p for n in PARTS for p in pts[n]]
    y_min, y_max = min(p.y for p in allp), max(p.y for p in allp)
    if abs(y_max - y_min - 1.0) > 1e-4 or abs(y_max - PIVOT_FROM_TOP) > 1e-4:
        issues.append("length/butt off: y %.5f..%.5f" % (y_min, y_max))
    edge_ok, edge = edge_side_check(pts["Blade"])
    if not edge_ok:
        issues.append("cutting edge does not face +X: %s" % edge)
    fold_issues, fold = fold_check(pts["Blade"], fold_deg, y_max)
    between_ok, between = between_scales_check(pts["Handle"], pts["Blade"])
    if not between_ok:
        issues.append("blade is not between the scales: %s" % between)
    pivot_c = sum(pts["Pivot"], Vector()) / len(pts["Pivot"])
    if abs(pivot_c.x) > 1e-4 or abs(pivot_c.y) > 1e-4:
        issues.append("pivot pin is not centered on the origin: %s" % pivot_c)
    return dict(issues=issues + fold_issues, materials=mats, length=round(y_max - y_min, 6),
                y_range=[round(y_min, 5), round(y_max, 5)], edge=edge, fold=fold,
                between_scales=between, pivot_center=[round(pivot_c.x, 6), round(pivot_c.y, 6)])


def verify_compressed_glb(path, max_bytes):
    doc, _ = read_glb(path)
    nodes = walk_nodes(doc)
    issues, mats = check_hierarchy(doc, nodes)
    lo, hi = Vector((1e9, 1e9, 1e9)), Vector((-1e9, -1e9, -1e9))
    norm = {5120: 127.0, 5121: 255.0, 5122: 32767.0, 5123: 65535.0}
    for name in PARTS:
        node, world, _ = nodes[name + "_Mesh"]
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
    size = Path(path).stat().st_size
    if size > max_bytes:
        issues.append("GLB is %d bytes, over the %d budget" % (size, max_bytes))
    return dict(issues=issues, materials=mats, extensions_required=required,
                extensions_used=doc.get("extensionsUsed", []),
                bbox_min=[round(v, 4) for v in lo], bbox_max=[round(v, 4) for v in hi],
                length=round(hi.y - lo.y, 4), size_bytes=size)


# ---------------------------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------------------------
def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(prog="build-razor.py")
    ap.add_argument("--blend", type=Path, default=REPO_ROOT / "assets/3d/razor/razor.blend")
    ap.add_argument("--glb", type=Path, default=REPO_ROOT / "public/models/razor.glb")
    ap.add_argument("--still", type=Path, default=REPO_ROOT / "assets/3d/razor/razor-still.png")
    ap.add_argument("--review-dir", type=Path, default=None,
                    help="also render pose, horizontal and handle-tone review images here")
    ap.add_argument("--tone", choices=sorted(HORN_TONES), default=DEFAULT_TONE,
                    help="handle tone baked into the GLB and the still")
    ap.add_argument("--fold-deg", type=float, default=55.0, help="fold checked for the tip direction")
    ap.add_argument("--sweep-max-deg", type=float, default=180.0, help="fully closed")
    ap.add_argument("--samples", type=int, default=64)
    ap.add_argument("--view-transform", default="Khronos PBR Neutral")
    ap.add_argument("--light-scale", type=float, default=1.0)
    ap.add_argument("--meshopt-level", choices=("medium", "high"), default="medium")
    ap.add_argument("--max-triangles", type=int, default=16000)
    ap.add_argument("--max-bytes", type=int, default=120000)
    ap.add_argument("--no-compress", action="store_true", help="write the raw export as the GLB")
    return ap.parse_args(argv)


def build_and_check(args):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    materials = make_materials(args.tone)
    builders = dict(Handle=build_handle(), Blade=build_blade(), Pivot=build_pivot())
    objs = build_scene_objects(builders, materials)
    rows = fold_sweep(objs, args.sweep_max_deg)
    lo, hi = mesh_bounds(objs)
    report = dict(
        triangles={n: triangle_count(objs[n + "_Mesh"]) for n in PARTS},
        bounds_gltf=dict(min=[round(v, 4) for v in lo], max=[round(v, 4) for v in hi]),
        pivots_at_origin=all(objs[n].matrix_world.translation.length == 0.0 for n in PARTS),
        clearances=clearances(objs),
        sweep_fold=sweep_summary(rows, args.fold_deg),
        sweep_closed=sweep_summary(rows, args.sweep_max_deg))
    report["triangles"]["total"] = sum(report["triangles"].values())
    return objs, materials, report


def export_and_verify(objs, args, report):
    args.glb.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="razor-glb-"))
    raw = tmp / "razor-raw.glb"
    export_glb(objs, raw)
    report["raw_glb"] = verify_raw_glb(raw, args.fold_deg)
    report["raw_glb"]["size_bytes"] = raw.stat().st_size
    if args.no_compress:
        shutil.copyfile(raw, args.glb)
    else:
        compress_glb(raw, args.glb, args.meshopt_level)
        report["glb"] = verify_compressed_glb(args.glb, args.max_bytes)
    shutil.rmtree(tmp, ignore_errors=True)


def contract_failures(report, args):
    fails = list(report["raw_glb"]["issues"]) + list(report.get("glb", {}).get("issues", []))
    for key in ("sweep_fold", "sweep_closed"):
        s = report[key]
        if s["blade_vs_handle_max"] or s["blade_vs_pivot_max"]:
            fails.append("blade touches the handle or pin in %s: %s" % (key, s))
    if report["clearances"]["handle_vs_pivot"]:
        fails.append("pivot pin intersects the scales")
    if not report["pivots_at_origin"]:
        fails.append("pivots are not at the origin")
    if report["triangles"]["total"] > args.max_triangles:
        fails.append("%d triangles > %d" % (report["triangles"]["total"], args.max_triangles))
    return fails


def main():
    args = parse_args()
    objs, materials, report = build_and_check(args)
    scene = bpy.context.scene
    setup_studio(scene, args.samples, args.view_transform, args.light_scale)
    args.blend.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0  # no stray .blend1 backups in the repo
    bpy.ops.wm.save_as_mainfile(filepath=str(args.blend), compress=True)
    export_and_verify(objs, args, report)
    args.still.parent.mkdir(parents=True, exist_ok=True)
    report["still"] = render_still(scene, objs, args.still)
    if args.review_dir:
        report["reviews"] = render_reviews(scene, objs, args.review_dir, materials[MAT_HORN])
    print("RAZOR_REPORT " + json.dumps(report, indent=2, default=str))
    fails = contract_failures(report, args)
    if fails:
        print("RAZOR_FAILED", fails)
        sys.exit(1)


if __name__ == "__main__":
    main()
