import rough from 'roughjs';
import zlib from 'node:zlib';
import {
  AnimationProject,
  DrawElement,
  PaperStyle,
  ShapeElement,
  StrokeElement,
  TextElement,
} from '../src/shared/types';

const FONT_5X7: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10011', '10101', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '11110', '10001', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00010', '00100', '00100', '00000', '00100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00000', '00100'],
  ',': ['00000', '00000', '00000', '00000', '00000', '00100', '01000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

function drawBitmapText(canvas: SoftwarePixelCanvas, el: TextElement, layerOpacity: number): void {
  const text = (el.text || '').toUpperCase();
  if (!text) return;
  const scale = Math.max(2, Math.round((el.fontSize || 24) / 7));
  const charAdvance = 6 * scale;
  const totalW = text.length * charAdvance - scale;
  let startX = el.x;
  if (el.align === 'center') startX = el.x - totalW / 2;
  else if (el.align === 'right') startX = el.x - totalW;
  const startY = el.y - (7 * scale) / 2;
  const rgba = hexToRgba(el.color, (el.opacity ?? 1) * layerOpacity);

  for (let i = 0; i < text.length; i++) {
    const glyph = FONT_5X7[text[i]] ?? FONT_5X7[' '];
    const gx = startX + i * charAdvance;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] === '1') {
          canvas.fillRect(gx + col * scale, startY + row * scale, scale, scale, rgba);
        }
      }
    }
  }
}

function hexToRgba(hex: string | undefined, alpha = 1): [number, number, number, number] {
  if (!hex || hex === 'none' || hex === 'transparent') return [0, 0, 0, 0];
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [20, 23, 31, Math.round(alpha * 255)];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, Math.round(alpha * 255)];
}

function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export class SoftwarePixelCanvas {
  readonly data: Uint8ClampedArray;

  constructor(readonly width: number, readonly height: number) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  fillRect(x: number, y: number, w: number, h: number, rgba: [number, number, number, number]): void {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.width, Math.ceil(x + w));
    const y1 = Math.min(this.height, Math.ceil(y + h));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        this.blendPixel(px, py, rgba[0], rgba[1], rgba[2], rgba[3]);
      }
    }
  }

  blendPixel(x: number, y: number, r: number, g: number, b: number, a: number): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height || a <= 0) return;
    const idx = (y * this.width + x) * 4;
    if (a >= 255) {
      this.data[idx] = r;
      this.data[idx + 1] = g;
      this.data[idx + 2] = b;
      this.data[idx + 3] = 255;
      return;
    }
    const srcA = a / 255;
    const invA = 1 - srcA;
    const dstA = this.data[idx + 3] / 255;
    const outA = srcA + dstA * invA;
    if (outA <= 0) return;
    this.data[idx] = Math.round((r * srcA + this.data[idx] * dstA * invA) / outA);
    this.data[idx + 1] = Math.round((g * srcA + this.data[idx + 1] * dstA * invA) / outA);
    this.data[idx + 2] = Math.round((b * srcA + this.data[idx + 2] * dstA * invA) / outA);
    this.data[idx + 3] = Math.round(outA * 255);
  }

  drawDisk(cx: number, cy: number, radius: number, rgba: [number, number, number, number]): void {
    const r = Math.max(0.5, radius);
    const minX = Math.max(0, Math.floor(cx - r - 1));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + r + 1));
    const minY = Math.max(0, Math.floor(cy - r - 1));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + r + 1));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dist = Math.hypot(x - cx, y - cy);
        if (dist <= r + 0.6) {
          const cov = Math.max(0, Math.min(1, r + 0.6 - dist));
          this.blendPixel(x, y, rgba[0], rgba[1], rgba[2], Math.round(rgba[3] * cov));
        }
      }
    }
  }

  drawThickLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    width: number,
    rgba: [number, number, number, number]
  ): void {
    const radius = Math.max(0.6, width * 0.5);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) {
      this.drawDisk(x0, y0, radius, rgba);
      return;
    }
    const minX = Math.max(0, Math.floor(Math.min(x0, x1) - radius - 1));
    const maxX = Math.min(this.width - 1, Math.ceil(Math.max(x0, x1) + radius + 1));
    const minY = Math.max(0, Math.floor(Math.min(y0, y1) - radius - 1));
    const maxY = Math.min(this.height - 1, Math.ceil(Math.max(y0, y1) + radius + 1));
    const lenSq = dx * dx + dy * dy;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / lenSq));
        const px = x0 + t * dx;
        const py = y0 + t * dy;
        const d = Math.hypot(x - px, y - py);
        if (d <= radius + 0.65) {
          const cov = Math.max(0, Math.min(1, radius + 0.65 - d));
          this.blendPixel(x, y, rgba[0], rgba[1], rgba[2], Math.round(rgba[3] * cov));
        }
      }
    }
  }

  drawPaper(paperStyle: PaperStyle): void {
    if (paperStyle === 'transparent') return;
    const bgHex =
      paperStyle === 'dark' ? '#14171F' : paperStyle === 'white' ? '#FFFFFF' : '#FAF8F3';
    this.fillRect(0, 0, this.width, this.height, hexToRgba(bgHex, 1));
    if (paperStyle === 'grid') {
      const gridColor = hexToRgba('#64748B', 0.16);
      for (let x = 40; x < this.width; x += 40) {
        this.fillRect(x, 0, 1, this.height, gridColor);
      }
      for (let y = 40; y < this.height; y += 40) {
        this.fillRect(0, y, this.width, 1, gridColor);
      }
    }
  }
}

function flattenOps(
  ops: Array<{ op: string; data: number[] }>,
  canvas: SoftwarePixelCanvas,
  width: number,
  rgba: [number, number, number, number]
): void {
  let cx = 0;
  let cy = 0;
  for (const item of ops) {
    const d = item.data;
    if (item.op === 'move') {
      cx = d[0];
      cy = d[1];
    } else if (item.op === 'lineTo') {
      canvas.drawThickLine(cx, cy, d[0], d[1], width, rgba);
      cx = d[0];
      cy = d[1];
    } else if (item.op === 'bcurveTo') {
      const steps = 10;
      let px = cx;
      let py = cy;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const mt = 1 - t;
        const nx =
          mt * mt * mt * cx +
          3 * mt * mt * t * d[0] +
          3 * mt * t * t * d[2] +
          t * t * t * d[4];
        const ny =
          mt * mt * mt * cy +
          3 * mt * mt * t * d[1] +
          3 * mt * t * t * d[3] +
          t * t * t * d[5];
        canvas.drawThickLine(px, py, nx, ny, width, rgba);
        px = nx;
        py = ny;
      }
      cx = d[4];
      cy = d[5];
    }
  }
}

function drawElementSoftware(
  canvas: SoftwarePixelCanvas,
  el: DrawElement,
  boilOffset: number,
  layerOpacity: number
): void {
  if (el.type === 'stroke') {
    const sEl = el as StrokeElement;
    if (sEl.brush === 'eraser') return;
    const alphaMult =
      (sEl.opacity ?? 1) *
      layerOpacity *
      (sEl.brush === 'marker' ? 0.42 : sEl.brush === 'pencil' ? 0.85 : 1);
    const rgba = hexToRgba(sEl.color, alphaMult);
    const jitter = (sEl.roughness ?? 1) * (boilOffset !== 0 ? 0.85 : 0);
    const pts = sEl.points.map((p, idx) => {
      if (jitter === 0) return p;
      const dx = (seededNoise((sEl.seed ?? 1) + idx * 7 + boilOffset) - 0.5) * jitter * 2.2;
      const dy = (seededNoise((sEl.seed ?? 1) + idx * 13 + boilOffset) - 0.5) * jitter * 2.2;
      return { x: p.x + dx, y: p.y + dy, pressure: p.pressure };
    });
    if (pts.length === 1) {
      canvas.drawDisk(pts[0].x, pts[0].y, sEl.width * 0.5, rgba);
      return;
    }
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const pAvg = ((p0.pressure ?? 0.75) + (p1.pressure ?? 0.75)) * 0.5;
      canvas.drawThickLine(
        p0.x,
        p0.y,
        p1.x,
        p1.y,
        Math.max(1, sEl.width * (0.45 + pAvg * 0.75)),
        rgba
      );
    }
    return;
  }

  if (el.type === 'shape') {
    const sh = el as ShapeElement;
    const gen = rough.generator();
    const opts = {
      stroke: sh.color,
      strokeWidth: sh.width,
      fill: sh.fill,
      fillStyle: sh.fillStyle ?? 'hachure',
      fillWeight: Math.max(1, sh.width * 0.55),
      hachureGap: Math.max(4, sh.width * 1.8),
      roughness: sh.roughness ?? 1.5,
      seed: (sh.seed ?? 42) + boilOffset,
    };

    const drawables = [];
    if (sh.shape === 'line') {
      drawables.push(gen.line(sh.x, sh.y, sh.x2 ?? sh.x, sh.y2 ?? sh.y, opts));
    } else if (sh.shape === 'arrow') {
      const x2 = sh.x2 ?? sh.x;
      const y2 = sh.y2 ?? sh.y;
      drawables.push(gen.line(sh.x, sh.y, x2, y2, opts));
      const angle = Math.atan2(y2 - sh.y, x2 - sh.x);
      const headLen = Math.max(14, sh.width * 4.5);
      drawables.push(
        gen.line(
          x2,
          y2,
          x2 - Math.cos(angle - Math.PI / 6) * headLen,
          y2 - Math.sin(angle - Math.PI / 6) * headLen,
          opts
        )
      );
      drawables.push(
        gen.line(
          x2,
          y2,
          x2 - Math.cos(angle + Math.PI / 6) * headLen,
          y2 - Math.sin(angle + Math.PI / 6) * headLen,
          opts
        )
      );
    } else if (sh.shape === 'circle' || sh.shape === 'ellipse') {
      drawables.push(gen.ellipse(sh.x, sh.y, sh.w ?? 60, sh.h ?? sh.w ?? 60, opts));
    } else if (sh.shape === 'rect') {
      drawables.push(gen.rectangle(sh.x, sh.y, sh.w ?? 80, sh.h ?? 60, opts));
    } else if (sh.shape === 'polygon' && sh.points && sh.points.length >= 2) {
      drawables.push(
        gen.polygon(
          sh.points.map((p) => [p.x, p.y] as [number, number]),
          opts
        )
      );
    }

    const strokeRgba = hexToRgba(sh.color, (sh.opacity ?? 1) * layerOpacity);
    const fillRgba = hexToRgba(sh.fill, (sh.opacity ?? 1) * layerOpacity);

    for (const drawable of drawables) {
      for (const set of drawable.sets) {
        if (set.type === 'fillPath' || set.type === 'fillSketch') {
          if (sh.fill) {
            flattenOps(
              set.ops,
              canvas,
              set.type === 'fillPath' ? Math.max(2, sh.width) : Math.max(1, sh.width * 0.6),
              fillRgba
            );
          }
        } else {
          flattenOps(set.ops, canvas, sh.width, strokeRgba);
        }
      }
    }
    return;
  }

  if (el.type === 'text') {
    drawBitmapText(canvas, el as TextElement, layerOpacity);
  }
}

export function rasterizeFrameRGBA(
  project: AnimationProject,
  frameIndex: number
): Uint8ClampedArray {
  const canvas = new SoftwarePixelCanvas(project.width, project.height);
  canvas.drawPaper(project.paperStyle);

  const frame = project.frames[frameIndex];
  if (!frame) return canvas.data;

  const boilOffset = Math.round(frameIndex * project.lineBoilIntensity * 17);
  for (const layer of project.layers) {
    if (!layer.visible) continue;
    const elements = frame.elementsByLayer[layer.id] ?? [];
    for (const el of elements) {
      drawElementSoftware(canvas, el, boilOffset, layer.opacity);
    }
  }
  return canvas.data;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 4, 'ascii');
  Buffer.from(data).copy(out, 8);
  const crc = crc32(out.subarray(4, 8 + data.length));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

export function encodeRGBAasPNG(
  rgba: Uint8ClampedArray,
  width: number,
  height: number
): Buffer {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter type 0
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, rowStart + 1);
  }
  const compressed = zlib.deflateSync(raw, { level: 6 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}
