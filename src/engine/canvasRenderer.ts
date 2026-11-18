import rough from 'roughjs';
import {
  AnimationFrame,
  AnimationProject,
  DrawElement,
  FillElement,
  ImageElement,
  OnionSkinConfig,
  PaperStyle,
  ShapeElement,
  StrokeElement,
  StudioGuidesConfig,
  TextElement,
} from '../shared/types';

const imageCache = new Map<string, HTMLImageElement>();

function getCachedImage(dataUrl: string, onLoad?: () => void): HTMLImageElement | null {
  const existing = imageCache.get(dataUrl);
  if (existing) {
    return existing.complete ? existing : null;
  }
  const img = new Image();
  img.onload = () => onLoad?.();
  img.src = dataUrl;
  imageCache.set(dataUrl, img);
  return img.complete ? img : null;
}

export function drawPaperBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  paperStyle: PaperStyle
): void {
  if (paperStyle === 'transparent') {
    ctx.clearRect(0, 0, width, height);
    const size = 24;
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? '#E5E7EB' : '#F3F4F6';
        ctx.fillRect(x, y, size, size);
      }
    }
    return;
  }

  const bgColors: Record<Exclude<PaperStyle, 'transparent'>, string> = {
    cream: '#FAF8F3',
    white: '#FFFFFF',
    grid: '#FAF8F3',
    dark: '#14171F',
  };
  ctx.fillStyle = bgColors[paperStyle];
  ctx.fillRect(0, 0, width, height);

  if (paperStyle === 'grid') {
    ctx.save();
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.16)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = step; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = step; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function drawFreehandStroke(
  ctx: CanvasRenderingContext2D,
  el: StrokeElement,
  boilOffset: number,
  tintColor?: string
): void {
  if (el.points.length === 0) return;

  ctx.save();
  const color = tintColor ?? el.color;
  const opacity = el.opacity ?? 1;

  if (el.brush === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.fillStyle = 'rgba(0,0,0,1)';
  } else if (el.brush === 'marker') {
    ctx.globalAlpha = opacity * 0.42;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
  } else if (el.brush === 'pencil') {
    ctx.globalAlpha = opacity * 0.85;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
  } else {
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const jitter = (el.roughness ?? 1) * (boilOffset !== 0 ? 0.85 : 0);
  const pts = el.points.map((p, idx) => {
    if (jitter === 0) return p;
    const dx = (seededNoise((el.seed ?? 1) + idx * 7 + boilOffset) - 0.5) * jitter * 2.2;
    const dy = (seededNoise((el.seed ?? 1) + idx * 13 + boilOffset) - 0.5) * jitter * 2.2;
    return { x: p.x + dx, y: p.y + dy, pressure: p.pressure };
  });

  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, Math.max(1, el.width * 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Variable-width organic ink segments
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const pAvg = ((p0.pressure ?? 0.75) + (p1.pressure ?? 0.75)) * 0.5;
    ctx.lineWidth = Math.max(1, el.width * (0.45 + pAvg * 0.75));
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  // Pencil double-pass graphite texture
  if (el.brush === 'pencil') {
    ctx.globalAlpha = opacity * 0.32;
    ctx.lineWidth = Math.max(1, el.width * 0.6);
    ctx.beginPath();
    ctx.moveTo(pts[0].x + 1.2, pts[0].y - 1.0);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x + 1.2, pts[i].y - 1.0);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawRoughShape(
  ctx: CanvasRenderingContext2D,
  rc: ReturnType<typeof rough.canvas>,
  el: ShapeElement,
  boilSeedOffset: number,
  tintColor?: string
): void {
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  const stroke = tintColor ?? el.color;
  const fill = tintColor ? undefined : el.fill;
  const seed = (el.seed ?? 42) + boilSeedOffset;
  const roughness = el.roughness ?? 1.5;

  const opts = {
    stroke,
    strokeWidth: el.width,
    fill,
    fillStyle: el.fillStyle ?? 'hachure',
    fillWeight: Math.max(1, el.width * 0.55),
    hachureGap: Math.max(4, el.width * 1.8),
    roughness,
    seed,
  };

  if (el.shape === 'line') {
    rc.line(el.x, el.y, el.x2 ?? el.x, el.y2 ?? el.y, opts);
  } else if (el.shape === 'arrow') {
    const x2 = el.x2 ?? el.x;
    const y2 = el.y2 ?? el.y;
    rc.line(el.x, el.y, x2, y2, opts);
    const angle = Math.atan2(y2 - el.y, x2 - el.x);
    const headLen = Math.max(14, el.width * 4.5);
    const a1 = angle - Math.PI / 6;
    const a2 = angle + Math.PI / 6;
    rc.line(x2, y2, x2 - Math.cos(a1) * headLen, y2 - Math.sin(a1) * headLen, opts);
    rc.line(x2, y2, x2 - Math.cos(a2) * headLen, y2 - Math.sin(a2) * headLen, opts);
  } else if (el.shape === 'circle' || el.shape === 'ellipse') {
    rc.ellipse(el.x, el.y, el.w ?? 60, el.h ?? el.w ?? 60, opts);
  } else if (el.shape === 'rect') {
    rc.rectangle(el.x, el.y, el.w ?? 80, el.h ?? 60, opts);
  } else if (el.shape === 'polygon' && el.points && el.points.length >= 2) {
    rc.polygon(
      el.points.map((p) => [p.x, p.y]),
      opts
    );
  }
  ctx.restore();
}

function drawTextElement(ctx: CanvasRenderingContext2D, el: TextElement, tintColor?: string): void {
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  ctx.fillStyle = tintColor ?? el.color;
  const weight = el.fontWeight === 'bold' ? '700' : '500';
  ctx.font = `${weight} ${el.fontSize}px "Outfit", "IBM Plex Sans Arabic", sans-serif`;
  ctx.textAlign = el.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(el.text, el.x, el.y);
  ctx.restore();
}

function drawImageElement(
  ctx: CanvasRenderingContext2D,
  el: ImageElement,
  onImageLoad?: () => void
): void {
  const img = getCachedImage(el.dataUrl, onImageLoad);
  if (!img) return;
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  ctx.drawImage(img, el.x, el.y, el.w, el.h);
  ctx.restore();
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [255, 90, 54];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function applyFloodFill(ctx: CanvasRenderingContext2D, el: FillElement): void {
  const { width, height } = ctx.canvas;
  const sx = Math.round(el.x);
  const sy = Math.round(el.y);
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const startIdx = (sy * width + sx) * 4;
  const sr = data[startIdx];
  const sg = data[startIdx + 1];
  const sb = data[startIdx + 2];
  const sa = data[startIdx + 3];

  const [fr, fg, fb] = hexToRgb(el.color);
  if (Math.abs(sr - fr) < 4 && Math.abs(sg - fg) < 4 && Math.abs(sb - fb) < 4 && sa > 245) {
    return;
  }

  const tol = el.tolerance ?? 36;
  const visited = new Uint8Array(width * height);
  const stack = new Int32Array(width * height);
  let sp = 0;
  stack[sp++] = sy * width + sx;
  visited[sy * width + sx] = 1;

  while (sp > 0) {
    const pos = stack[--sp];
    const p4 = pos * 4;
    data[p4] = fr;
    data[p4 + 1] = fg;
    data[p4 + 2] = fb;
    data[p4 + 3] = 255;

    const px = pos % width;
    const py = (pos - px) / width;

    const neighbors = [
      px > 0 ? pos - 1 : -1,
      px + 1 < width ? pos + 1 : -1,
      py > 0 ? pos - width : -1,
      py + 1 < height ? pos + width : -1,
    ];

    for (let k = 0; k < 4; k++) {
      const nPos = neighbors[k];
      if (nPos < 0 || visited[nPos]) continue;
      const n4 = nPos * 4;
      const dr = Math.abs(data[n4] - sr);
      const dg = Math.abs(data[n4 + 1] - sg);
      const db = Math.abs(data[n4 + 2] - sb);
      const da = Math.abs(data[n4 + 3] - sa);
      if (dr <= tol && dg <= tol && db <= tol && da <= tol) {
        visited[nPos] = 1;
        stack[sp++] = nPos;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export function renderLayerElements(
  ctx: CanvasRenderingContext2D,
  elements: DrawElement[],
  boilOffset: number,
  tintColor?: string,
  onImageLoad?: () => void
): void {
  const rc = rough.canvas(ctx.canvas);
  for (const el of elements) {
    if (el.type === 'stroke') {
      drawFreehandStroke(ctx, el, boilOffset, tintColor);
    } else if (el.type === 'shape') {
      drawRoughShape(ctx, rc, el, boilOffset, tintColor);
    } else if (el.type === 'text') {
      drawTextElement(ctx, el, tintColor);
    } else if (el.type === 'image') {
      drawImageElement(ctx, el, onImageLoad);
    } else if (el.type === 'fill' && !tintColor) {
      applyFloodFill(ctx, el);
    }
  }
}

export function renderProjectFrameToCanvas(
  targetCanvas: HTMLCanvasElement,
  project: AnimationProject,
  frameIndex: number,
  options: {
    onionSkin?: OnionSkinConfig;
    guides?: StudioGuidesConfig;
    includePaper?: boolean;
    onImageLoad?: () => void;
    activePreviewElement?: DrawElement | null;
    activePreviewLayerId?: string;
  } = {}
): void {
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  const { width, height, layers, frames, lineBoilIntensity } = project;
  if (targetCanvas.width !== width || targetCanvas.height !== height) {
    targetCanvas.width = width;
    targetCanvas.height = height;
  }

  ctx.clearRect(0, 0, width, height);
  if (options.includePaper !== false) {
    drawPaperBackground(ctx, width, height, project.paperStyle);
  }

  const boilOffset = Math.round(frameIndex * lineBoilIntensity * 17);

  // Offscreen canvas for per-layer compositing (needed for eraser & blend modes)
  const layerCanvas = document.createElement('canvas');
  layerCanvas.width = width;
  layerCanvas.height = height;
  const layerCtx = layerCanvas.getContext('2d');
  if (!layerCtx) return;

  const drawFrameLayers = (
    frame: AnimationFrame,
    fIdx: number,
    alphaMultiplier: number,
    tintColor?: string
  ) => {
    const fBoil = Math.round(fIdx * lineBoilIntensity * 17);
    for (const layer of layers) {
      if (!layer.visible) continue;
      const elements = [...(frame.elementsByLayer[layer.id] ?? [])];
      if (!tintColor && options.activePreviewElement && options.activePreviewLayerId === layer.id) {
        elements.push(options.activePreviewElement);
      }
      if (elements.length === 0) continue;

      layerCtx.clearRect(0, 0, width, height);
      renderLayerElements(layerCtx, elements, fBoil, tintColor, options.onImageLoad);

      ctx.save();
      ctx.globalAlpha = layer.opacity * alphaMultiplier;
      ctx.globalCompositeOperation = tintColor ? 'source-over' : layer.blendMode;
      ctx.drawImage(layerCanvas, 0, 0);
      ctx.restore();
    }
  };

  // Onion skin frames (before & after)
  if (options.onionSkin?.enabled) {
    const { framesBefore, framesAfter, opacity, tintBefore, tintAfter } = options.onionSkin;
    for (let d = framesBefore; d >= 1; d--) {
      const idx = frameIndex - d;
      if (idx >= 0 && frames[idx]) {
        const falloff = opacity * (1 - (d - 1) / Math.max(1, framesBefore));
        drawFrameLayers(frames[idx], idx, falloff, tintBefore);
      }
    }
    for (let d = framesAfter; d >= 1; d--) {
      const idx = frameIndex + d;
      if (idx < frames.length && frames[idx]) {
        const falloff = opacity * (1 - (d - 1) / Math.max(1, framesAfter));
        drawFrameLayers(frames[idx], idx, falloff, tintAfter);
      }
    }
  }

  // Active frame
  const activeFrame = frames[frameIndex];
  if (activeFrame) {
    drawFrameLayers(activeFrame, frameIndex, 1, undefined);
  }

  // Studio Guides Overlay (never baked into exports when guides omitted)
  if (options.guides) {
    ctx.save();
    if (options.guides.gridOverlay) {
      ctx.strokeStyle = 'rgba(255, 90, 54, 0.14)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(width / 3, 0);
      ctx.lineTo(width / 3, height);
      ctx.moveTo((width * 2) / 3, 0);
      ctx.lineTo((width * 2) / 3, height);
      ctx.moveTo(0, height / 3);
      ctx.lineTo(width, height / 3);
      ctx.moveTo(0, (height * 2) / 3);
      ctx.lineTo(width, (height * 2) / 3);
      ctx.stroke();
    }
    if (options.guides.mirrorX) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
    }
    if (options.guides.mirrorY) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }
    if (options.guides.ruler) {
      ctx.strokeStyle = 'rgba(255, 90, 54, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, height * 0.78);
      ctx.lineTo(width, height * 0.78);
      ctx.stroke();
    }
    ctx.restore();
  }

  void boilOffset;
}
