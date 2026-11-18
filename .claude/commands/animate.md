Create a hand-drawn 2D flipbook animation with FlipaForge based on: $ARGUMENTS

Follow these steps:
1. Read `src/shared/builder.ts` and `src/shared/types.ts` (or call `get_sdk_reference` via MCP) to use `HandDrawnBuilder` helpers (`stickFigure`, `speechBubble`, `arrow`, `ellipse`, `rect`, `line`, `stroke`, `lerp`, `easeOutBounce`, `easeInOutQuad`, `oscillate`).
2. Author a multi-layer TypeScript animation script in `examples/<slug>.ts` exporting `default scene.toProject()` at 12 FPS with organic `roughness` (`1.3`–`2.0`), `lineBoilIntensity: 1.1`, squash & stretch, and anticipation/follow-through.
3. Materialize the editable FlipaClip-style project into `projects/<slug>.flipa.json` AND render an animated GIF (or MP4 if ffmpeg is installed) into `exports/`:
   `npm run render -- --input examples/<slug>.ts --save-project projects/<slug>.flipa.json --format gif --out exports/<slug>.gif`
4. Tell the user the generated file paths and remind them they can open `projects/<slug>.flipa.json` in the FlipaForge Web Studio (`npm run dev`) to inspect onion skins, tweak layers, or record voiceover.
