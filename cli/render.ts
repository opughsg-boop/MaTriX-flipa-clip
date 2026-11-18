import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import gifenc from 'gifenc';
import { AnimationProject } from '../src/shared/types';
import { encodeRGBAasPNG, rasterizeFrameRGBA } from './rasterizer';

const { GIFEncoder, applyPalette, quantize } = gifenc;

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      args[key] = val;
    }
  }
  return args;
}

async function loadProject(inputPath: string): Promise<AnimationProject> {
  const abs = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Input file not found: ${abs}`);
  }
  if (abs.endsWith('.json')) {
    return JSON.parse(fs.readFileSync(abs, 'utf-8')) as AnimationProject;
  }
  const mod = await import(pathToFileURL(abs).href);
  const project = mod.default ?? mod.project;
  if (!project || !Array.isArray(project.frames)) {
    throw new Error(`Script ${inputPath} must export default AnimationProject (scene.toProject())`);
  }
  return project as AnimationProject;
}

function expandSchedule(project: AnimationProject): number[] {
  const schedule: number[] = [];
  project.frames.forEach((f, idx) => {
    const ticks = Math.max(1, f.duration || 1);
    for (let t = 0; t < ticks; t++) schedule.push(idx);
  });
  return schedule;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = args.input;
  const format = (args.format ?? 'gif').toLowerCase();
  const out = args.out ?? `exports/output.${format === 'png' ? 'frames' : format}`;
  const saveProject = args['save-project'];

  if (!input) {
    console.log(`FlipaForge Headless CLI Renderer
Usage:
  npm run render -- --input <project.flipa.json | script.ts> --format <gif|png|mp4|webm> --out <outputPath>
  npm run render -- --input <script.ts> --save-project projects/my-anim.flipa.json`);
    process.exit(0);
  }

  const project = await loadProject(input);

  if (saveProject) {
    const outJson = path.resolve(process.cwd(), saveProject);
    fs.mkdirSync(path.dirname(outJson), { recursive: true });
    fs.writeFileSync(outJson, JSON.stringify(project, null, 2), 'utf-8');
    console.log(`Saved FlipaForge project to ${outJson}`);
    if (!args.out && !args.format) return;
  }

  const schedule = expandSchedule(project);
  console.log(
    `Rendering "${project.title}" (${project.width}x${project.height} @ ${project.fps} FPS, ${schedule.length} total ticks)...`
  );

  if (format === 'gif') {
    const absOut = path.resolve(process.cwd(), out);
    fs.mkdirSync(path.dirname(absOut), { recursive: true });
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
    console.log(`Exported Animated GIF -> ${absOut}`);
    return;
  }

  if (format === 'png') {
    const absDir = path.resolve(process.cwd(), out);
    fs.mkdirSync(absDir, { recursive: true });
    for (let i = 0; i < schedule.length; i++) {
      const rgba = rasterizeFrameRGBA(project, schedule[i]);
      const png = encodeRGBAasPNG(rgba, project.width, project.height);
      const file = path.join(absDir, `frame_${String(i + 1).padStart(4, '0')}.png`);
      fs.writeFileSync(file, png);
    }
    console.log(`Exported ${schedule.length} PNG frames -> ${absDir}`);
    return;
  }

  if (format === 'mp4' || format === 'webm') {
    const ffmpegCheck = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    if (ffmpegCheck.status !== 0) {
      throw new Error(
        `ffmpeg was not found on PATH. Install ffmpeg for CLI MP4/WebM export, or use --format gif / --format png (zero dependencies), or export MP4/WebM directly in the FlipaForge browser UI.`
      );
    }
    const absOut = path.resolve(process.cwd(), out);
    fs.mkdirSync(path.dirname(absOut), { recursive: true });
    const tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.tmp-render-'));
    try {
      for (let i = 0; i < schedule.length; i++) {
        const rgba = rasterizeFrameRGBA(project, schedule[i]);
        const png = encodeRGBAasPNG(rgba, project.width, project.height);
        fs.writeFileSync(path.join(tmpDir, `frame_${String(i + 1).padStart(4, '0')}.png`), png);
      }
      const ffmpegArgs = [
        '-y',
        '-framerate',
        String(project.fps),
        '-i',
        path.join(tmpDir, 'frame_%04d.png'),
        ...(format === 'mp4'
          ? ['-c:v', 'libx264', '-pix_fmt', 'yuv420p']
          : ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p']),
        absOut,
      ];
      execFileSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });
      console.log(`Exported ${format.toUpperCase()} video -> ${absOut}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    return;
  }

  throw new Error(`Unsupported format "${format}". Use gif, png, mp4, or webm.`);
}

main().catch((err) => {
  console.error('Render failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
