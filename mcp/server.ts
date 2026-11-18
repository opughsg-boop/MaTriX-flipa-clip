import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { execFileSync, spawnSync } from 'node:child_process';
import gifenc from 'gifenc';
import {
  HandDrawnBuilder,
  clamp,
  easeInOutQuad,
  easeOutBounce,
  lerp,
  oscillate,
} from '../src/shared/builder';
import { AnimationProject, PaperStyle } from '../src/shared/types';
import { encodeRGBAasPNG, rasterizeFrameRGBA } from '../cli/rasterizer';

const { GIFEncoder, applyPalette, quantize } = gifenc;

const ROOT_DIR = process.cwd();
const PROJECTS_DIR = path.join(ROOT_DIR, 'projects');
const EXAMPLES_DIR = path.join(ROOT_DIR, 'examples');
const EXPORTS_DIR = path.join(ROOT_DIR, 'exports');

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function send(msg: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

function sendResult(id: string | number | null | undefined, result: unknown): void {
  if (id === undefined) return;
  send({ jsonrpc: '2.0', id, result });
}

function sendError(id: string | number | null | undefined, code: number, message: string): void {
  if (id === undefined) return;
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

function sanitizeSlug(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || `anim-${Date.now()}`;
}

function evaluateBuilderScript(scriptCode: string): AnimationProject {
  const cleaned = scriptCode
    .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, 'return ');

  const fn = new Function(
    'HandDrawnBuilder',
    'lerp',
    'clamp',
    'easeInOutQuad',
    'easeOutBounce',
    'oscillate',
    `"use strict";\n${cleaned}`
  );

  const result = fn(HandDrawnBuilder, lerp, clamp, easeInOutQuad, easeOutBounce, oscillate);
  if (!result || typeof result !== 'object' || !Array.isArray((result as AnimationProject).frames)) {
    throw new Error('Script must return an AnimationProject (e.g. `return scene.toProject();`).');
  }
  return result as AnimationProject;
}

function expandSchedule(project: AnimationProject): number[] {
  const schedule: number[] = [];
  project.frames.forEach((f, idx) => {
    const ticks = Math.max(1, f.duration || 1);
    for (let t = 0; t < ticks; t++) schedule.push(idx);
  });
  return schedule;
}

function renderProjectToFile(project: AnimationProject, format: 'gif' | 'png' | 'mp4' | 'webm', outPath: string): string {
  const schedule = expandSchedule(project);
  const absOut = path.resolve(ROOT_DIR, outPath);
  fs.mkdirSync(path.dirname(absOut), { recursive: true });

  if (format === 'gif') {
    const gif = GIFEncoder();
    const delayMs = Math.max(20, Math.round(1000 / project.fps));
    for (let i = 0; i < schedule.length; i++) {
      const rgba = rasterizeFrameRGBA(project, schedule[i]);
      const palette = quantize(rgba, 256);
      const index = applyPalette(rgba, palette);
      gif.writeFrame(index, project.width, project.height, {
        palette,
        delay: delayMs,
        repeat: i === 0 ? 0 : undefined,
      });
    }
    gif.finish();
    fs.writeFileSync(absOut, Buffer.from(gif.bytes()));
    return absOut;
  }

  if (format === 'png') {
    fs.mkdirSync(absOut, { recursive: true });
    for (let i = 0; i < schedule.length; i++) {
      const rgba = rasterizeFrameRGBA(project, schedule[i]);
      const png = encodeRGBAasPNG(rgba, project.width, project.height);
      fs.writeFileSync(path.join(absOut, `frame_${String(i + 1).padStart(4, '0')}.png`), png);
    }
    return absOut;
  }

  const ffmpegCheck = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (ffmpegCheck.status !== 0) {
    throw new Error('ffmpeg is not installed on PATH. Use format="gif" or format="png" (zero native dependencies).');
  }

  const tmpDir = fs.mkdtempSync(path.join(ROOT_DIR, '.tmp-mcp-render-'));
  try {
    for (let i = 0; i < schedule.length; i++) {
      const rgba = rasterizeFrameRGBA(project, schedule[i]);
      const png = encodeRGBAasPNG(rgba, project.width, project.height);
      fs.writeFileSync(path.join(tmpDir, `frame_${String(i + 1).padStart(4, '0')}.png`), png);
    }
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-framerate',
        String(project.fps),
        '-i',
        path.join(tmpDir, 'frame_%04d.png'),
        ...(format === 'mp4' ? ['-c:v', 'libx264', '-pix_fmt', 'yuv420p'] : ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p']),
        absOut,
      ],
      { stdio: 'ignore' }
    );
    return absOut;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

const TOOLS = [
  {
    name: 'get_sdk_reference',
    description:
      'Returns the FlipaForge HandDrawnBuilder TypeScript SDK documentation, available hand-drawn primitives, and animation timing guidelines for Codex & Claude Code.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_animations',
    description: 'Lists all saved .flipa.json projects in projects/ and example scripts in examples/.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_animation_from_script',
    description:
      'Compiles a HandDrawnBuilder JavaScript/TypeScript script into a FlipaForge .flipa.json project in projects/<slug>.flipa.json and optionally renders it to GIF/PNG/MP4.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'URL-safe project slug (e.g. "bouncing-hero")' },
        script: {
          type: 'string',
          description:
            'Body of script using HandDrawnBuilder, lerp, easeOutBounce, easeInOutQuad, oscillate, ending with `return scene.toProject();`',
        },
        renderFormat: {
          type: 'string',
          enum: ['none', 'gif', 'png', 'mp4', 'webm'],
          description: 'Optional output format to render immediately into exports/',
        },
      },
      required: ['slug', 'script'],
    },
  },
  {
    name: 'create_animation_from_storyboard',
    description:
      'Creates a hand-drawn .flipa.json project from a structured JSON storyboard of frames containing shapes, strokes, stick figures, speech bubbles, and text.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        title: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' },
        fps: { type: 'number' },
        paperStyle: { type: 'string', enum: ['cream', 'white', 'grid', 'dark'] },
        frames: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              duration: { type: 'number' },
              label: { type: 'string' },
              commands: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    op: {
                      type: 'string',
                      enum: ['line', 'arrow', 'circle', 'ellipse', 'rect', 'stickFigure', 'speechBubble', 'text', 'stroke'],
                    },
                    args: { type: 'object' },
                  },
                  required: ['op', 'args'],
                },
              },
            },
            required: ['commands'],
          },
        },
      },
      required: ['slug', 'frames'],
    },
  },
  {
    name: 'render_animation',
    description: 'Renders an existing projects/<slug>.flipa.json or examples/<name>.ts file into GIF, PNG sequence, MP4, or WebM.',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: { type: 'string', description: 'Relative path like projects/codex-story.flipa.json' },
        format: { type: 'string', enum: ['gif', 'png', 'mp4', 'webm'] },
        outPath: { type: 'string', description: 'Optional output path inside exports/' },
      },
      required: ['inputPath', 'format'],
    },
  },
];

async function handleToolCall(name: string, args: Record<string, unknown>) {
  if (name === 'get_sdk_reference') {
    const agentsPath = path.join(ROOT_DIR, 'AGENTS.md');
    const content = fs.existsSync(agentsPath) ? fs.readFileSync(agentsPath, 'utf-8') : 'See src/shared/builder.ts';
    return { content: [{ type: 'text', text: content }] };
  }

  if (name === 'list_animations') {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
    const projects = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.flipa.json'));
    const examples = fs.readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith('.ts'));
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ projects, examples }, null, 2),
        },
      ],
    };
  }

  if (name === 'create_animation_from_script') {
    const slug = sanitizeSlug(String(args.slug || 'animation'));
    const script = String(args.script || '');
    const project = evaluateBuilderScript(script);
    project.id = slug;

    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    const projectPath = path.join(PROJECTS_DIR, `${slug}.flipa.json`);
    fs.writeFileSync(projectPath, JSON.stringify(project, null, 2), 'utf-8');

    const renderFormat = String(args.renderFormat || 'none');
    let renderedPath: string | null = null;
    if (renderFormat !== 'none' && ['gif', 'png', 'mp4', 'webm'].includes(renderFormat)) {
      const out = path.join('exports', renderFormat === 'png' ? `${slug}-frames` : `${slug}.${renderFormat}`);
      renderedPath = renderProjectToFile(project, renderFormat as 'gif' | 'png' | 'mp4' | 'webm', out);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ok: true,
              projectPath: `projects/${slug}.flipa.json`,
              frames: project.frames.length,
              fps: project.fps,
              dimensions: `${project.width}x${project.height}`,
              renderedPath,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === 'create_animation_from_storyboard') {
    const slug = sanitizeSlug(String(args.slug || 'storyboard'));
    const scene = new HandDrawnBuilder({
      id: slug,
      title: String(args.title || slug),
      width: Number(args.width || 1280),
      height: Number(args.height || 720),
      fps: Number(args.fps || 12),
      paperStyle: (args.paperStyle as PaperStyle) || 'cream',
      lineBoilIntensity: 1.1,
    });
    const ink = scene.addLayer('Ink');
    const frames = (args.frames as Array<{ duration?: number; label?: string; commands: Array<{ op: string; args: Record<string, any> }> }>) || [];

    for (const f of frames) {
      const fb = scene.addFrame(f.duration ?? 1, f.label);
      fb.draw(ink, (g) => {
        for (const cmd of f.commands || []) {
          const a = cmd.args || {};
          if (cmd.op === 'line') g.line(a.x1, a.y1, a.x2, a.y2, a.style);
          else if (cmd.op === 'arrow') g.arrow(a.x1, a.y1, a.x2, a.y2, a.style);
          else if (cmd.op === 'circle') g.circle(a.cx, a.cy, a.diameter, a.style);
          else if (cmd.op === 'ellipse') g.ellipse(a.cx, a.cy, a.w, a.h, a.style);
          else if (cmd.op === 'rect') g.rect(a.x, a.y, a.w, a.h, a.style);
          else if (cmd.op === 'stickFigure') g.stickFigure(a.x, a.y, a.pose, a.style);
          else if (cmd.op === 'speechBubble') g.speechBubble(a.x, a.y, a.w, a.h, a.text, a.tailSide, a.style);
          else if (cmd.op === 'text') g.text(a.x, a.y, a.text, a.opts);
          else if (cmd.op === 'stroke' && Array.isArray(a.points)) g.stroke(a.points, a.style);
        }
      });
    }

    const project = scene.toProject();
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(PROJECTS_DIR, `${slug}.flipa.json`), JSON.stringify(project, null, 2), 'utf-8');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ ok: true, projectPath: `projects/${slug}.flipa.json`, frames: project.frames.length }, null, 2),
        },
      ],
    };
  }

  if (name === 'render_animation') {
    const inputPath = String(args.inputPath || '');
    const format = String(args.format || 'gif') as 'gif' | 'png' | 'mp4' | 'webm';
    const absInput = path.resolve(ROOT_DIR, inputPath);
    if (!fs.existsSync(absInput)) {
      throw new Error(`Input not found: ${inputPath}`);
    }
    let project: AnimationProject;
    if (absInput.endsWith('.json')) {
      project = JSON.parse(fs.readFileSync(absInput, 'utf-8')) as AnimationProject;
    } else {
      const mod = await import(absInput);
      project = mod.default;
    }
    const baseName = path.basename(inputPath).replace(/\.(flipa\.json|json|ts)$/, '');
    const outPath = String(
      args.outPath || path.join('exports', format === 'png' ? `${baseName}-frames` : `${baseName}.${format}`)
    );
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    const resultPath = renderProjectToFile(project, format, outPath);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ ok: true, format, output: resultPath }, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let req: JsonRpcRequest;
  try {
    req = JSON.parse(trimmed) as JsonRpcRequest;
  } catch {
    return;
  }

  try {
    if (req.method === 'initialize') {
      sendResult(req.id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'flipaforge-mcp', version: '1.0.0' },
      });
    } else if (req.method === 'notifications/initialized') {
      // No response required for notification
    } else if (req.method === 'tools/list') {
      sendResult(req.id, { tools: TOOLS });
    } else if (req.method === 'tools/call') {
      const params = req.params || {};
      const toolName = String(params.name || '');
      const toolArgs = (params.arguments as Record<string, unknown>) || {};
      const result = await handleToolCall(toolName, toolArgs);
      sendResult(req.id, result);
    } else if (req.method === 'ping') {
      sendResult(req.id, {});
    } else {
      sendError(req.id, -32601, `Method not found: ${req.method}`);
    }
  } catch (err) {
    sendError(req.id, -32000, err instanceof Error ? err.message : 'Internal server error');
  }
});
