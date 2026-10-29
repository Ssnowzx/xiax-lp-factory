"""Render the round brush's still (change xiax-lp-v5-salon · design D7), headless.

The still is what the salon page shows in place of the 3D brush under reduced motion or
without WebGL: the brush resting at the end of the drawn line. Same framing contract as the
razor's still (lib/motion/still-frame.ts): orthographic front view, model upright with its -Y
end (the handle) down, pivot (the barrel centre) on the vertical centre line, transparent
background. The model is the one in public/models/brush.glb, built by the same code
(assets/3d/brush/build-brush.py, whose functions are reused without running its export), and
it is lit by that script's review studio, which was judged on the ivory page.

The page turns the still a quarter turn clockwise to lay it on the line (brushRestPose,
rotZ 90), so the studio is turned a quarter turn the other way first: once on the page, the
key light falls from the upper left, as on the live 3D brush.

Run from the repo root:

    /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
        --python scripts/v3-assets/brush-still.py

Writes assets/3d/brush/brush-still.png; `npm run assets:v3` turns it into
public/models/brush-still.webp. Prints a BRUSH_STILL JSON with the framing for still-frame.ts.
"""

import json
import math
from pathlib import Path

import bpy

REPO_ROOT = Path(__file__).resolve().parents[2]
BUILD = REPO_ROOT / "assets" / "3d" / "brush" / "build-brush.py"
OUT = REPO_ROOT / "assets" / "3d" / "brush" / "brush-still.png"
PX_PER_UNIT = 640        # sharp at 2x for the 260 px brush (BRUSH.maxLengthPx)
MARGIN_PX = 32
SAMPLES = 64
# Seen from the camera (which looks along +Y), a turn about -Y is counter-clockwise on screen.
STUDIO_TURN_RAD = -math.pi / 2


def load_builder():
    """The build script's functions, without its module-level `main()` (no GLB export)."""
    body, tail = BUILD.read_text().rsplit("\nmain()", 1)
    if tail.strip():
        raise RuntimeError("build-brush.py no longer ends with main()")
    namespace = {"__file__": str(BUILD), "__name__": "build_brush"}
    exec(compile(body, str(BUILD), "exec"), namespace)
    return namespace


def turn_studio(scene):
    """Turns the review studio's lights and its world gradient about the camera axis."""
    pivot = bpy.data.objects.new("StudioTurn", None)
    scene.collection.objects.link(pivot)
    for ob in bpy.data.collections["Studio"].objects:
        if ob.type == "LIGHT":
            ob.parent = pivot
    pivot.rotation_euler = (0.0, STUDIO_TURN_RAD, 0.0)
    nodes, links = scene.world.node_tree.nodes, scene.world.node_tree.links
    coord = next(n for n in nodes if n.type == "TEX_COORD")
    sep = next(n for n in nodes if n.type == "SEPXYZ" or n.bl_idname == "ShaderNodeSeparateXYZ")
    turn = nodes.new("ShaderNodeVectorRotate")
    turn.rotation_type = "Y_AXIS"
    turn.invert = True
    turn.inputs["Angle"].default_value = STUDIO_TURN_RAD
    links.new(coord.outputs["Generated"], turn.inputs["Vector"])
    links.new(turn.outputs["Vector"], sep.inputs[0])


def still_camera(scene, bounds):
    """Orthographic front camera framing the brush; returns the still's size and pivot."""
    (x0, y0, _), (x1, y1, _) = bounds
    width = 2 * math.ceil(max(abs(x0), abs(x1)) * PX_PER_UNIT + MARGIN_PX)
    height = math.ceil((y1 - y0) * PX_PER_UNIT + 2 * MARGIN_PX)
    center_z = y1 + MARGIN_PX / PX_PER_UNIT - height / 2 / PX_PER_UNIT
    cam = bpy.data.objects.new("StillCamera", bpy.data.cameras.new("StillCamera"))
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = max(width, height) / PX_PER_UNIT
    cam.data.clip_start, cam.data.clip_end = 0.05, 50.0
    cam.location = (0.0, -6.0, center_z)
    cam.rotation_euler = (math.radians(90.0), 0.0, 0.0)  # look along +Y (glTF -Z)
    scene.collection.objects.link(cam)
    scene.camera = cam
    return width, height, MARGIN_PX + y1 * PX_PER_UNIT


def main():
    builder = load_builder()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    objs, _ = builder["build_scene"]()
    scene = bpy.context.scene
    builder["setup_studio"](scene)
    turn_studio(scene)
    scene.eevee.taa_render_samples = SAMPLES
    scene.render.film_transparent = True
    image = scene.render.image_settings
    image.file_format, image.color_mode, image.color_depth, image.compression = "PNG", "RGBA", "8", 100
    bounds = builder["world_bounds"](objs)
    width, height, pivot_y = still_camera(scene, bounds)
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(OUT)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.render.render(write_still=True)
    frame = {"unitPx": PX_PER_UNIT, "widthPx": width, "heightPx": height, "pivotYPx": round(pivot_y, 2)}
    print("BRUSH_STILL " + json.dumps({"path": str(OUT), "frame": frame}))


main()
