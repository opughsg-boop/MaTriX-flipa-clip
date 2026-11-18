import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { createDefaultBounceProject } from './src/shared/samples';
import { AnimationProject, DrawElement } from './src/shared/types';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const PROJECTS_DIR = path.resolve(process.cwd(), 'projects');

function ensureProjectsSeeded(): void {
  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }
  const existing = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.flipa.json'));
  if (existing.length === 0) {
    const sample = createDefaultBounceProject();
    fs.writeFileSync(
      path.join(PROJECTS_DIR, `${sample.id}.flipa.json`),
      JSON.stringify(sample, null, 2),
      'utf-8'
    );
  }
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || `proj_${Date.now()}`;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  ensureProjectsSeeded();
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // List projects saved on disk (shared with Codex & Claude Code)
  app.get('/api/projects', (_req, res) => {
    try {
      ensureProjectsSeeded();
      const files = fs
        .readdirSync(PROJECTS_DIR)
        .filter((f) => f.endsWith('.flipa.json'));
      const list = files.map((file) => {
        const raw = fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf-8');
        const p = JSON.parse(raw) as AnimationProject;
        return {
          id: p.id,
          title: p.title,
          width: p.width,
          height: p.height,
          fps: p.fps,
          frameCount: p.frames.length,
          layerCount: p.layers.length,
          updatedAt: p.updatedAt,
          fileName: file,
        };
      });
      list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      res.json({ projects: list });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list projects' });
    }
  });

  function findProjectFile(idOrSlug: string): string | null {
    const safe = sanitizeId(idOrSlug);
    const direct = path.join(PROJECTS_DIR, `${safe}.flipa.json`);
    if (fs.existsSync(direct)) return direct;
    const files = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.flipa.json'));
    for (const f of files) {
      try {
        const parsed = JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf-8')) as AnimationProject;
        if (parsed.id === idOrSlug || sanitizeId(parsed.id) === safe) {
          return path.join(PROJECTS_DIR, f);
        }
      } catch {
        // skip invalid json
      }
    }
    return null;
  }

  app.get('/api/projects/:id', (req, res) => {
    try {
      const filePath = findProjectFile(req.params.id);
      if (!filePath) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as AnimationProject;
      res.json({ project: data });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load project' });
    }
  });

  app.post('/api/projects', (req, res) => {
    try {
      const project = req.body?.project as AnimationProject | undefined;
      if (!project || !project.id || !Array.isArray(project.frames)) {
        res.status(400).json({ error: 'Invalid project payload' });
        return;
      }
      const safe = sanitizeId(project.id);
      const updated: AnimationProject = {
        ...project,
        id: safe,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(
        path.join(PROJECTS_DIR, `${safe}.flipa.json`),
        JSON.stringify(updated, null, 2),
        'utf-8'
      );
      res.json({ project: updated, fileName: `${safe}.flipa.json` });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to save project' });
    }
  });

  app.delete('/api/projects/:id', (req, res) => {
    try {
      const filePath = findProjectFile(req.params.id);
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete project' });
    }
  });

  // Server-side Gemini AI Hand-Drawn Frame Sequence Generator
  app.post('/api/ai/generate-animation', async (req, res) => {
    try {
      const prompt = String(req.body?.prompt ?? '').trim();
      const frameCount = Math.max(4, Math.min(24, Number(req.body?.frameCount ?? 12)));
      const width = Number(req.body?.width ?? 1280);
      const height = Number(req.body?.height ?? 720);
      const style = String(req.body?.style ?? 'ink');

      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required.' });
        return;
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are a master 2D flipbook animator creating hand-drawn frame-by-frame sequences for a ${width}x${height} canvas.
Generate EXACTLY ${frameCount} sequential animation frames depicting: "${prompt}".
Style: ${style} (pencil = sketchy #334155 graphite strokes, ink = bold #111827 ink with vibrant #FF5A36/#0284C7/#FDE047 accents, chalkboard = bright chalk strokes #F8FAFC/#FDE047/#38BDF8 on dark).
Animate smoothly with clear anticipation, arcs, squash-and-stretch, and expressive motion across all ${frameCount} frames.
Each frame contains 2 layers:
- "bgElements": environment/horizon/props elements that stay grounded with subtle hand-drawn roughness.
- "charElements": foreground animated subject elements moving frame-by-frame.
Use coordinates strictly within 0..${width} (x) and 0..${height} (y).
For "stroke" elements, provide at least 3-8 points in "points".
For "shape" elements, specify "shapeType" ('ellipse' | 'rect' | 'line' | 'arrow'), x, y, and (w, h for ellipse/rect; x2, y2 for line/arrow).
For "text" elements, provide short labels or sound effects like "POW!" or "مرحباً".`;

      const elementSchema = {
        type: Type.OBJECT,
        properties: {
          kind: {
            type: Type.STRING,
            description: 'One of: stroke, shape, text',
          },
          shapeType: {
            type: Type.STRING,
            description: 'When kind=shape: ellipse, rect, line, or arrow',
          },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          w: { type: Type.NUMBER },
          h: { type: Type.NUMBER },
          x2: { type: Type.NUMBER },
          y2: { type: Type.NUMBER },
          color: { type: Type.STRING },
          fill: { type: Type.STRING },
          width: { type: Type.NUMBER },
          roughness: { type: Type.NUMBER },
          text: { type: Type.STRING },
          fontSize: { type: Type.NUMBER },
          points: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
              },
              required: ['x', 'y'],
            },
          },
        },
        required: ['kind', 'color'],
      };

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Generate ${frameCount} hand-drawn animation frames for: ${prompt}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              frames: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    duration: { type: Type.INTEGER },
                    bgElements: { type: Type.ARRAY, items: elementSchema },
                    charElements: { type: Type.ARRAY, items: elementSchema },
                  },
                  required: ['bgElements', 'charElements'],
                },
              },
            },
            required: ['frames'],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Gemini returned an empty response.' });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        title?: string;
        frames: Array<{
          label?: string;
          duration?: number;
          bgElements?: Array<Record<string, unknown>>;
          charElements?: Array<Record<string, unknown>>;
        }>;
      };

      const toDrawElement = (raw: Record<string, unknown>, idx: number, frameIdx: number): DrawElement => {
        const seed = (frameIdx + 1) * 97 + idx * 13;
        const kind = String(raw.kind ?? 'shape');
        const color = String(raw.color ?? (style === 'chalkboard' ? '#F8FAFC' : '#111827'));
        const strokeWidth = Number(raw.width ?? 3.5);
        const roughness = Number(raw.roughness ?? 1.6);

        if (kind === 'stroke' && Array.isArray(raw.points) && raw.points.length > 0) {
          return {
            id: `ai_stk_${frameIdx}_${idx}`,
            type: 'stroke',
            brush: style === 'pencil' ? 'pencil' : 'ink',
            points: (raw.points as Array<{ x: number; y: number }>).map((p) => ({
              x: Number(p.x ?? 0),
              y: Number(p.y ?? 0),
              pressure: 0.75,
            })),
            color,
            width: strokeWidth,
            roughness,
            seed,
          };
        }

        if (kind === 'text') {
          return {
            id: `ai_txt_${frameIdx}_${idx}`,
            type: 'text',
            x: Number(raw.x ?? width / 2),
            y: Number(raw.y ?? 100),
            text: String(raw.text ?? ''),
            color,
            fontSize: Number(raw.fontSize ?? 30),
            align: 'center',
            fontWeight: 'bold',
          };
        }

        const shapeType = String(raw.shapeType ?? 'ellipse') as 'line' | 'ellipse' | 'rect' | 'arrow';
        return {
          id: `ai_shp_${frameIdx}_${idx}`,
          type: 'shape',
          shape: ['line', 'ellipse', 'rect', 'arrow'].includes(shapeType) ? shapeType : 'ellipse',
          x: Number(raw.x ?? width / 2),
          y: Number(raw.y ?? height / 2),
          w: Number(raw.w ?? 60),
          h: Number(raw.h ?? 60),
          x2: Number(raw.x2 ?? Number(raw.x ?? 100) + 80),
          y2: Number(raw.y2 ?? Number(raw.y ?? 100)),
          color,
          fill: raw.fill ? String(raw.fill) : undefined,
          fillStyle: 'hachure',
          width: strokeWidth,
          roughness,
          seed,
        };
      };

      const frames = parsed.frames.map((f, fIdx) => ({
        id: `ai_frame_${Date.now().toString(36)}_${fIdx}`,
        duration: Math.max(1, Number(f.duration ?? 1)),
        label: f.label,
        bgElements: (f.bgElements ?? []).map((e, i) => toDrawElement(e, i, fIdx)),
        charElements: (f.charElements ?? []).map((e, i) => toDrawElement(e, i + 100, fIdx)),
      }));

      res.json({
        title: parsed.title || prompt.slice(0, 40),
        frames,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI generation failed';
      res.status(500).json({ error: msg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FlipaForge server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
