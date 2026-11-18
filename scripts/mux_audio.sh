#!/usr/bin/env bash
# Mux a silent FlipaForge MP4 with an SFX WAV and two-pass loudnorm to -14 LUFS.
# Usage: scripts/mux_audio.sh <silent.mp4> <sfx.wav> <out.mp4>
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
video="$1"; sfx="$2"; out="$3"

# Pass 1: measure the mix
stats=$(ffmpeg -hide_banner -nostats -i "$video" -i "$sfx" -map 1:a \
  -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 \
  | python3 "$here/loudnorm_params.py")

# Pass 2: apply and mux (48 kHz AAC, faststart for web playback)
ffmpeg -v error -y -i "$video" -i "$sfx" -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 256k -ar 48000 \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:${stats}:linear=true" \
  -movflags +faststart -shortest "$out"
echo "wrote $out"
