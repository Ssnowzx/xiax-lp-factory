#!/bin/bash
# Generate (or edit) one image with the AGY CLI image-generator subagent, non-interactively.
# ============================================================================
# Usage (from anywhere; run it outside the repo's working tree if you prefer — it only reads
# the prompt file and writes <out.png>):
#   scripts/v3-assets/agy-image.sh <image_name> <aspect> <out.png> <prompt.txt> [reference.png ...]
#
#   image_name  unique snake_case prefix (AGY saves <image_name>_<timestamp>.jpg; keep names
#               unique per run — the script finds the result by this prefix)
#   aspect      one of 1:1 2:3 3:2 3:4 4:3 9:16 16:9 (AGY's generate_image enum)
#   prompt.txt  the prompt, verbatim; avoid double quotes inside it
#   reference   optional absolute paths passed as ImagePaths (editing / reference images)
#
# How AGY works here (AGY 1.4.6): `agy -p` runs the main agent, which delegates to its
# `image-generator` subagent; that subagent calls `generate_image(Prompt, ImageName,
# AspectRatio, ImagePaths?)` and saves a JPEG into ~/.gemini/antigravity-cli/brain/<conv>/.
# Print mode may return before the subagent finishes, so this script polls the brain dir for
# the new file and converts it to PNG with sharp. No --dangerously-skip-permissions needed.
# Outputs: 1:1 → 1024×1024, 16:9 → 1376×768 (JPEG from the model, re-saved as PNG).
# Quota: the backing model (gemini-3.1-flash-image) returned 429 RESOURCE_EXHAUSTED after
# ~8 images in one session, with a ~5 h reset — batch generations accordingly.
set -u
NAME="$1"; ASPECT="$2"; OUT="$3"; PROMPT_FILE="$4"; shift 4
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
BRAIN="$HOME/.gemini/antigravity-cli/brain"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/agy-image.XXXXXX")"
PROMPT="$(cat "$PROMPT_FILE")"
REFS=""
ADD_DIRS=(--add-dir "$WORK")
for r in "$@"; do
  REFS="$REFS\"$r\", "
  ADD_DIRS+=(--add-dir "$(dirname "$r")")
done
if [ -z "$REFS" ]; then REF_LINE="ImagePaths: (omit)"; else REF_LINE="ImagePaths: [${REFS%, }]"; fi
MARK="$WORK/.marker"
touch "$MARK"

MSG="Invoke the image-generator subagent exactly once and instruct it to call generate_image exactly once with these exact parameters (copy the Prompt verbatim, do not rewrite, shorten or embellish it):
ImageName: \"$NAME\"
AspectRatio: \"$ASPECT\"
$REF_LINE
Prompt: \"$PROMPT\"
Do not generate any other image. Wait until the subagent reports the saved file path back to you before ending your turn, then print that path."

(cd "$WORK" && agy -p "$MSG" --print-timeout 300s --mode accept-edits "${ADD_DIRS[@]}" > "$WORK/agy.log" 2>&1)
for _ in $(seq 1 120); do
  FOUND=$(find "$BRAIN" -newer "$MARK" \( -name "${NAME}_*.jpg" -o -name "${NAME}_*.png" \) 2>/dev/null | head -1)
  if [ -n "$FOUND" ]; then
    sleep 2
    mkdir -p "$(dirname "$OUT")"
    (cd "$REPO" && node -e "require('sharp')(process.argv[1]).png().toFile(process.argv[2]).then(i=>console.log('OK',process.argv[2],i.width+'x'+i.height))" "$FOUND" "$OUT")
    exit 0
  fi
  sleep 3
done
echo "FAIL: no image named ${NAME}_* appeared; AGY log: $WORK/agy.log" >&2
exit 1
