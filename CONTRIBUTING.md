# Contributing to FlipaForge

Thank you for helping make **FlipaForge** an open-source, agent-friendly 2D animation studio!

## Development Setup

```bash
git clone https://github.com/<your-username>/flipaforge.git
cd flipaforge
npm install
cp .env.example .env
npm run dev
```

## Testing Your Changes

```bash
# Typecheck
npm run lint

# Build frontend
npm run build

# Verify headless CLI renderer
npm run render -- --input examples/stick-character-jump.ts --format gif --out exports/test.gif
```

## Architecture Overview

- `src/shared/` — Shared `.flipa.json` types and `HandDrawnBuilder` SDK used by browser, CLI, and MCP.
- `src/engine/` — Canvas2D rough renderer, browser MP4/WebM/GIF/PNG exporters, and live script runner.
- `src/components/` — FlipaClip-inspired Web Studio UI (ToolRail, CanvasStage, RightPanel, TimelineDock).
- `cli/` — Zero-native-dependency Node.js software pixel rasterizer and CLI exporter.
- `mcp/` — Stdio Model Context Protocol (MCP) server for Claude Code and OpenAI Codex.
- `server.ts` — Express server syncing `projects/*.flipa.json` and proxying Gemini AI generation.

## Pull Request Checklist

1. Run `npm run lint` and `npm run build` with zero errors.
2. Verify any changes to `HandDrawnBuilder` or `DrawElement` work in both `src/engine/canvasRenderer.ts` and `cli/rasterizer.ts`.
3. Keep `AGENTS.md` and `CLAUDE.md` updated if you add new drawing primitives.
