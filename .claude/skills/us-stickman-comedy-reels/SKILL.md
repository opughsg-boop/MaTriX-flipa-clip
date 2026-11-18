---
name: us-stickman-comedy-reels
description: Make wordless full-body cartoon comedy reels for a US audience, with English labels, prop grips, free-library SFX, a licensed music bed, and a scored review after each video.
---
# US Wordless Comedy Reels (FlipaClip-Pro Edition)

Make 18–60 second wordless comedy reels (9:16 `1080x1920` @ 30 fps) with full-bodied cartoon characters, aimed at American viewers. Hard cuts only. Every video ends with a US-English publish pack and a scored review (out of 100), and verified lessons carry into the next build.

## Language & Audience Split

- **Chat & Explanations:** Match the user's language (e.g., Arabic for Arabic prompts).
- **On-Screen Captions, In-Scene Labels & Publish Pack:** Always **American English** (`Inter Display` / `DejaVu Sans Bold` + `Noto Color Emoji`), original cast/brands only.

## Workflow

1. **Confirm Length & Concept:** Use 18 s for tight punchy loops (e.g., bathroom crises) or 30–60 s for multi-beat stories. Pitch 10 numbered ideas when asked, then build the chosen number.
2. **Plan the Shot Table:** `# | time | label | framing | action | sound`. Leave a 0.3–1.6 s silent anticipation beat before the punchline.
3. **Build (`scene.html` + `render.js`):**
   - Expose `window.canvas = canvas;` and `window.DUR = <seconds>;` inside `scene.html`.
   - Use offline CDP bundling in `render.js` (`--no-proxy-server`, inline scripts) and keep paper grain static (`ox = 0, oy = 0`) for clean H.264 compression and seamless loops.
4. **Audio (`sfx.py`) — Satisfying Cinema & Bathroom-Reverb Foley:**
   - Write 48 kHz true-stereo 16-bit PCM WAV using Python's built-in `wave` module (do not depend on `soundfile`).
   - Layer real user-supplied WAV/MP3 SFX (`file:sfx/name.wav`) when provided, or synthesize warm organic foley (no harsh buzzy tones): sub-bass drops, hollow wood knocks, ceramic toilet-bowl water *PLOP + SPLASH*, and tiled-bathroom early-reflection reverb (`180 ms`), plus quiet room tone (`-35 dB`) and soft kalimba/bass bed (`-20.5 dB`, paused during the silent anticipation beat).
5. **Render & Mux:**
   - `node render.js scene.html frames 30 6`
   - `ffmpeg -v error -y -framerate 30 -i frames/%05d.jpg -i sfx.wav -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 256k -af loudnorm=I=-14:TP=-1.5 -movflags +faststart -shortest out.mp4`
   - Verify `Loop Seam RMSE = 0.000/255` (last frame matches frame 0).
6. **Mandatory Visual & Audio Audit:**
   - Tile key frames into a 3×3 contact sheet JPG and inspect **both** the contact sheet AND the final MP4 with `view_file` before delivering.

## FlipaClip-Pro Visual Style (Locked Red-Cap Blueprint)

- **Seamless Hand-Drawn Body (`Path2D`):** Draw the entire white body (head, puffed cheeks, broad sloping shoulders, bowed arms, 4-fingered toilet-seat grip hands, and thighs) as **one continuous `Path2D` silhouette** with zero neck, shoulder, elbow, hip, or knee seams, plus subtle inner armpit curves and thigh creases.
- **Iconic Face & Cap:** Big round white eyes touching near the bridge with pinpoint pupils; signature puffed-cheek `)(` strain mouth with chin ticks; tall boxy-rounded red snapback cap (`#E8221A`) with center seam, black top button, and flat left visor.
- **Cel-Shading, Lighting & Physics:** Clip soft cool cel-shadows and cap highlights inside `Path2D`; add overhead bathroom ceiling light + subtle corner vignette; apply **Squash & Stretch** on strain/shock and **On-Twos (`15 fps`)** subtle line boil (`0` at `t=0` and end for `0.000` loop).
- **Natural Bathroom & Bowl Splashdown:** Dark slate-teal side pillars, medium-slate tiled wall, speckled blue towel on chrome bar, natural cream porcelain toilet (pedestal, contoured bowl, blue water pool, tank & flush lever), terracotta concentric-ring gut tunnel with 5-pointed star exit, and a **close-up toilet-bowl splashdown shot** with water crown, droplets, and ripples.
- **Trending Caption:** Floating bold white `Inter Display` (`800 50px`) + `Noto Color Emoji` at `y = 215 / 282` with thick `#14151A` `strokeText` outline.

## Final Review & Publish Pack (Every Video)

1. **US-English Publish Pack:** Short SEO title (< 60 chars) + 2–3 emojis, 1–2 line description + audio attribution, 6–8 hashtags, tags list.
2. **Score Out of 100 (5 × 20 pts):** Hook, Motion & Physics, Effects & Sound, Realism at 1x, Clarity & Loop.
3. **Fix Log:** Record any visual/audio fixes caught during the contact-sheet and MP4 audit.
## FlipaForge Integration (this repo) — use these steps instead of `scene.html` / `render.js` / `sfx.py`

The original pipeline files named above are not in this repository. The same reel is produced with the repo's own tools:

1. **Author:** write `examples/<slug>.ts` with `HandDrawnBuilder` (1080×1920, `fps: 30`, a `Background`/`Set`/`Sketch`/`Ink`/`Color`/`Caption` layer stack). Reference build: `examples/red-cap-bathroom.ts` (18 s).
2. **Save & render silent video:**
   `npm run render -- --input examples/<slug>.ts --save-project projects/<slug>.flipa.json --format mp4 --out exports/<slug>-silent.mp4`
   (about 90 s for 18 s of video; needs `ffmpeg` on PATH).
3. **Audio (object foley, e.g. pops, crunches, fizz):** `python3 scripts/foley.py --story popcorn --out exports/<slug>-sfx.wav` (add a story sheet to `STORIES` for new reels). Atmospheric beds: `python3 scripts/make_sfx.py --out exports/<slug>-sfx.wav --duration 18` (48 kHz stereo 16-bit, standard library only; edit the knock/splash/whoosh cue times to match the shot table, and pass `--silent-from/--silent-to` to match the anticipation beat).
4. **Mux + loudness:** `scripts/mux_audio.sh exports/<slug>-silent.mp4 exports/<slug>-sfx.wav exports/<slug>.mp4` (two-pass loudnorm to −14 LUFS, AAC 48 kHz, faststart).
5. **Audit:** build a 3×3 contact sheet with `ffmpeg -i exports/<slug>.mp4 -vf "fps=1,scale=270:-1,tile=6x3" -frames:v 1 sheet.jpg` and inspect it, plus `ffprobe` for 1080×1920, 30 fps, 18.0 s, and an audio stream.
6. **Known limits of the built-in renderer:** text uses a 5×7 uppercase bitmap font (keep captions ≤ ~34 characters at `fontSize: 30`), no emoji, and no Path2D; compose bodies from `polygon`/`ellipse` primitives. Solid fills (`fillStyle: 'solid'`) are scanline-filled by `cli/rasterizer.ts`.
