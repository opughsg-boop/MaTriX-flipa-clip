# CLAUDE.md — Claude Code Guide for FlipaForge

This repository is **FlipaForge**, an open-source FlipaClip-style 2D hand-drawn animation studio designed for both human artists and AI coding agents.

## Workflow for Creating Animation Videos with Claude Code

1. **Authoring Animations**:
   - Write procedural TypeScript animations using `HandDrawnBuilder` (`src/shared/builder.ts`) in `examples/<name>.ts`, OR write `.flipa.json` files directly into `projects/<name>.flipa.json`.
   - Use `frame.draw(layer, (g) => ...)` to build multi-layer scenes (`Background`, `Sketch`, `Ink`, `Color`) so users can edit individual layers later in the Web Studio UI.
2. **Saving to Studio**:
   - Run `npx tsx cli/render.ts --input examples/<name>.ts --save-project projects/<name>.flipa.json` to materialize any script into an editable FlipaClip-style project visible immediately in the Web UI.
3. **Exporting Videos**:
   - GIF (pure Node.js, zero external tools): `npm run render -- --input projects/<name>.flipa.json --format gif --out exports/<name>.gif`
   - PNG sequence: `npm run render -- --input projects/<name>.flipa.json --format png --out exports/<name>-frames`
   - MP4 / WebM (uses system `ffmpeg` automatically if installed): `npm run render -- --input projects/<name>.flipa.json --format mp4 --out exports/<name>.mp4`

## Comedy Reels (US wordless style)

- Skill: `.claude/skills/us-stickman-comedy-reels/SKILL.md` (9:16, 18–60 s, hard cuts, US-English captions and publish pack). Reference build: `examples/red-cap-bathroom.ts`.
- Audio + mux helpers: `scripts/make_sfx.py` (stdlib-only 48 kHz stereo WAV foley) and `scripts/mux_audio.sh` (two-pass loudnorm to −14 LUFS).

## Design Rules for Hand-Drawn Realism

- Avoid perfectly straight lines or rigid timing. Prefer `roughness: 1.4–2.0`, `brush: "ink"` or `"pencil"`, and `lineBoilIntensity: 1.0`.
- Use `stickFigure`, `speechBubble`, `arrow`, and `ellipse` with `fill` + `hachure` styles for expressive explainer and character animations.
- Always check `src/shared/types.ts` for the exact `AnimationProject` schema before writing raw JSON.

## Claude Code Native Tools

- **MCP Auto-Discovery**: `.mcp.json` registers the `flipaforge` stdio MCP server (`npm run mcp`) with tools: `get_sdk_reference`, `list_animations`, `create_animation_from_script`, `create_animation_from_storyboard`, and `render_animation`.
- **Slash Command**: Users can invoke `/animate <prompt>` (defined in `.claude/commands/animate.md`) to author, save, and render a hand-drawn animation in one step.

