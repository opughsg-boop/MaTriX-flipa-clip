# AGENTS.md — OpenAI Codex Guide for FlipaForge

You are working inside **FlipaForge**, an open-source FlipaClip-inspired 2D hand-drawn animation studio.
When the user asks you to create, edit, or render an animation video, follow these instructions so every frame looks **hand-drawn** and works seamlessly in both the Web Studio and the Headless CLI Renderer.

## 1. Project Output Locations

- **JSON Projects**: Save declarative projects to `projects/<slug>.flipa.json`. The Web Studio automatically loads files from `projects/` via `/api/projects`.
- **TypeScript Animation Scripts**: Save procedural scripts to `examples/<slug>.ts` exporting `default scene.toProject()`.
- **Rendered Exports**: Output rendered GIF, PNG sequences, or MP4 videos to `exports/`.

## 2. How to Author Hand-Drawn Animations with Code

Always use `HandDrawnBuilder` from `src/shared/builder.ts` rather than emitting sterile geometric coordinates:

```ts
import { HandDrawnBuilder, easeOutBounce, lerp } from "../src/shared/builder";

const scene = new HandDrawnBuilder({
  title: "My Hand-Drawn Story",
  width: 1280,
  height: 720,
  fps: 12,
  paperStyle: "cream", // "cream" | "white" | "grid" | "dark"
  lineBoilIntensity: 1.2, // Adds organic frame-to-frame pencil jitter
});

const bg = scene.addLayer("Background");
const ink = scene.addLayer("Character");
```

### Available Hand-Drawn Primitives (`g` context inside `frame.draw(layerId, g => ...)`)

- `g.stroke(points, { brush: "pencil" | "ink" | "marker", color, width, roughness })`
- `g.circle(cx, cy, diameter, style)` / `g.ellipse(cx, cy, w, h, style)`
- `g.rect(x, y, w, h, style)`
- `g.line(x1, y1, x2, y2, style)`
- `g.arrow(x1, y1, x2, y2, style)`
- `g.polygon(points, style)`
- `g.stickFigure(x, y, pose, style)` — Procedural articulated hand-drawn character (`headTilt`, `leftArmAngle`, `rightArmAngle`, `leftLegAngle`, `rightLegAngle`, `torsoLean`, `scale`, `expression`)
- `g.speechBubble(x, y, w, h, text, tailSide, style)`
- `g.text(x, y, content, { fontSize, color, align })`

### Animation Principles to Apply

1. **12 FPS Classic Timing**: Use `fps: 12` (or `24` with `duration: 2` holds on key poses) for authentic flipbook cadence.
2. **Squash & Stretch**: Deform widths/heights slightly on impact frames.
3. **Anticipation & Follow-Through**: Add 2–3 frames of wind-up before rapid motion and settle frames after.
4. **Line Boil**: Keep `roughness` between `1.2` and `2.2` and `lineBoilIntensity > 0` so held frames still breathe organically.

## 3. Rendering & Verification Commands

```bash
# Validate and render GIF
npm run render -- --input projects/my-anim.flipa.json --format gif --out exports/my-anim.gif

# Render TypeScript animation script directly to MP4 (requires ffmpeg) or PNG sequence
npm run render -- --input examples/my-anim.ts --format mp4 --out exports/my-anim.mp4
npm run render -- --input examples/my-anim.ts --format png --out exports/frames
```

## 4. MCP Server & Skill Integration

- **Agent Skill**: `.agents/skills/flipaforge-animator/SKILL.md`
- **MCP Server**: Run `npm run mcp` (or register `codex mcp add flipaforge -- npx tsx mcp/server.ts`) to expose `get_sdk_reference`, `list_animations`, `create_animation_from_script`, `create_animation_from_storyboard`, and `render_animation`.

