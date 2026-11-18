# FlipaForge

**Open-source FlipaClip-inspired 2D hand-drawn animation studio built for AI, OpenAI Codex, and Claude Code.**

FlipaForge lets you create authentic, hand-drawn frame-by-frame animations via **code**, **AI prompts**, or **manual flipbook drawing**, edit every layer and onion-skinned frame in a bilingual (Arabic / English) Web Studio, and export directly to **MP4 / WebM**, **Animated GIF**, or **PNG Sequences**.

---

## Why FlipaForge?

- **Built for Coding Agents (`Codex` & `Claude Code`)**:
  - Ships with a native **MCP Server** (`mcp/server.ts` + `.mcp.json`), **Agent Skill** (`.agents/skills/flipaforge-animator/SKILL.md`), **Claude `/animate` command** (`.claude/commands/animate.md`), `AGENTS.md`, and `CLAUDE.md`.
  - Programmatic `HandDrawnBuilder` SDK renders shapes, stick figures, speech bubbles, arrows, and paths with sketchy wobble (`roughjs`) and frame-to-frame *line boil*.
- **FlipaClip-Style Frame Assembly**:
  - Classic & Studio layouts, multi-layer stack (opacity, blend modes, lock, merge), crimson/emerald onion skinning, hold frames (`duration`), ruler/mirror guides, and multi-track audio + microphone voiceover.
- **Zero-Native-Dependency CLI + Browser Export**:
  - Headless Node.js CLI (`npm run render`) exports **GIF** and **PNG sequences** out of the box (and **MP4/WebM** automatically when `ffmpeg` is installed).
  - Browser Studio exports **MP4/WebM (with muxed audio)**, **GIF**, **PNG Sequence (ZIP)**, and `.flipa.json`.
- **Bilingual Arabic (`RTL`) & English (`LTR`) Interface**.

---

## Quick Start

```bash
git clone https://github.com/<your-username>/flipaforge.git
cd flipaforge
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000` to launch the Web Studio.

> Optional: Add `GEMINI_API_KEY` to `.env` to enable the in-studio AI Hand-Drawn Frame Generator (`gemini-4-hydrogen`).

---

## Using with Claude Code & OpenAI Codex

### 1. Claude Code (Auto-Configured)

Claude Code automatically discovers `.mcp.json`, `CLAUDE.md`, and `.claude/commands/animate.md` when opened in this repository:

- Run `/animate a character riding a bicycle past mountains at sunset`
- Or ask Claude Code naturally: *"Create a 24-frame hand-drawn explainer animation about API caching and render it as a GIF."*

### 2. OpenAI Codex CLI

Codex automatically reads `AGENTS.md` and `.agents/skills/flipaforge-animator/SKILL.md`. You can also register the MCP server in Codex:

```bash
codex mcp add flipaforge -- npx tsx mcp/server.ts
```

Then prompt Codex:

```text
Create a 24-frame hand-drawn animation in examples/rocket-launch.ts, save projects/rocket-launch.flipa.json, and render exports/rocket-launch.gif
```

### 3. Available MCP Tools (`npm run mcp`)

| Tool | Description |
| :--- | :--- |
| `get_sdk_reference` | Returns `HandDrawnBuilder` API & hand-drawn timing guide |
| `list_animations` | Lists `.flipa.json` projects and `examples/*.ts` scripts |
| `create_animation_from_script` | Compiles a `HandDrawnBuilder` script into `.flipa.json` + optional GIF/PNG/MP4 |
| `create_animation_from_storyboard` | Compiles structured JSON frames into an editable `.flipa.json` |
| `render_animation` | Renders any `.flipa.json` or `.ts` script to `gif`, `png`, `mp4`, or `webm` |

---

## Headless CLI Rendering

```bash
# Render an example script to Animated GIF (zero native dependencies)
npm run render -- --input examples/stick-character-jump.ts --format gif --out exports/jump.gif

# Compile a script into an editable Web Studio project + export PNG frames
npm run render -- --input examples/whiteboard-explainer.ts --save-project projects/explainer.flipa.json --format png --out exports/explainer-frames

# Render MP4 video (requires ffmpeg on PATH)
npm run render -- --input projects/explainer.flipa.json --format mp4 --out exports/explainer.mp4
```

---

## Publishing to GitHub

```bash
git init
git add .
git commit -m "Initial commit: FlipaForge open-source hand-drawn animation studio"
git branch -M main
git remote add origin https://github.com/<your-username>/flipaforge.git
git push -u origin main
```

---

## License

MIT — See [LICENSE](LICENSE).
