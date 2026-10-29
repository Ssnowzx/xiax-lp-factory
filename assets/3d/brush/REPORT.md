# Brush GLB report

Source: `assets/3d/brush/build-brush.py` (Blender 5.2.2, headless, deterministic). Output: `public/models/brush.glb`.

## Nodes (glTF space, Y up; long axis = Y as the razor)
| Node | Origin | Triangles | Notes |
|---|---|---|---|
| `Brush` (root) | (0,0,0) = barrel centre | - | children below |
| `Handle` | identity, (0,0,0) | 1440 | child `Handle_Mesh`; lacquer + champagne ferrule/end cap, y -0.27..-0.73 |
| `Barrel` | identity, (0,0,0) | 3360 | child `Barrel_Mesh`; 48-sided, 16 rows, vent pockets; spin axis = local Y |
| `Bristles` | identity, (0,0,0) | 4608 | child `Bristles_Mesh`; 24 columns x 32 rows of 6-sided cones |

Total 9408 triangles (budget 12000). Pivots are transform-only; meshopt offsets live on the `*_Mesh` children (same reason as the razor).

## Bounding box and size
- min (-0.1368, -0.7300, -0.1361), max (0.1357, 0.2700, 0.1368): length exactly 1.0 along Y (barrel top +0.27, end cap -0.73), diameter ~0.27 with bristles.
- Barrel y -0.27..+0.27, radius 0.075; bristle tips ~0.135.
- GLB: 101772 bytes (99.4 KB, limit 120 KB). md5 `9fb1aa78e8f87b3e31289996a893fef3` (identical across two runs).
- Materials: Champagne (#D8BE98, metallic 0.9, rough 0.3), Lacquer (#7B4A3C, metallic 0, rough 0.25), Bristle (#4A4039, metallic 0, rough 0.85).
- validate: 0 errors, 0 warnings (info only: EXT_meshopt_compression not known to the validator, unused buffer).

## Commands
```
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python assets/3d/brush/build-brush.py -- --review-dir <dir>
# internally: npx -y @gltf-transform/cli meshopt <raw> public/models/brush.glb --level medium --quantize-normal 12
npx @gltf-transform/cli validate public/models/brush.glb
md5 -q public/models/brush.glb
```
Review renders (ivory #F6F1EA): `brush-side.png`, `brush-three-quarter.png`, `brush-bristles-closeup.png` in the scratchpad `brush-review/`.
