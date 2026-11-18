---
name: flipaforge-animator
description: Create, edit, and render hand-drawn 2D flipbook animations (GIF, PNG sequences, MP4/WebM) using FlipaForge's HandDrawnBuilder SDK and CLI/MCP pipeline.
---

# FlipaForge Hand-Drawn Animator Skill

Use this skill whenever asked to create an animation, explainer video, stick-figure story, whiteboard sketch, or flipbook in FlipaForge.

## Rules for Hand-Drawn Quality

1. **Always use `HandDrawnBuilder`** from `src/shared/builder.ts` (or the `create_animation_from_script` MCP tool).
2. **Classic Flipbook Timing**: Default to `fps: 12` with `lineBoilIntensity: 1.0–1.3` and `roughness: 1.4–2.0`. Use `duration: 2` or `duration: 3` on held key poses.
3. **Separate Layers**: Put static props in a `Background` layer, moving characters in `Character`, and dust/impacts/speech bubbles in `FX`.
4. **Always Materialize & Render**:
   - Save script in `examples/<slug>.ts`
   - Materialize `projects/<slug>.flipa.json` so the human can refine it in the Web Studio
   - Render GIF via `npm run render -- --input examples/<slug>.ts --save-project projects/<slug>.flipa.json --format gif --out exports/<slug>.gif`
