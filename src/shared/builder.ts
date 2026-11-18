import {
  AnimationFrame,
  AnimationProject,
  BlendMode,
  BrushKind,
  DrawElement,
  FillStyle,
  LayerDef,
  PaperStyle,
  ShapeElement,
  StrokeElement,
  StrokePoint,
  TextElement,
} from './types';

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) {
    const u = t - 1.5 / d1;
    return n1 * u * u + 0.75;
  }
  if (t < 2.5 / d1) {
    const u = t - 2.25 / d1;
    return n1 * u * u + 0.9375;
  }
  const u = t - 2.625 / d1;
  return n1 * u * u + 0.984375;
}

export function oscillate(t: number, cycles = 1): number {
  return Math.sin(t * Math.PI * 2 * cycles);
}

export interface DrawStyle {
  color?: string;
  fill?: string;
  fillStyle?: FillStyle;
  width?: number;
  roughness?: number;
  opacity?: number;
  brush?: BrushKind;
  seed?: number;
}

export interface StickFigurePose {
  scale?: number;
  headTilt?: number;
  torsoLean?: number;
  leftArmAngle?: number; // degrees relative to down
  rightArmAngle?: number;
  leftElbowBend?: number;
  rightElbowBend?: number;
  leftLegAngle?: number;
  rightLegAngle?: number;
  leftKneeBend?: number;
  rightKneeBend?: number;
  expression?: 'happy' | 'surprised' | 'determined' | 'neutral';
}

function makeId(prefix: string, counter: number): string {
  return `${prefix}_${counter.toString(36)}`;
}

export class LayerCanvasContext {
  private elements: DrawElement[] = [];
  private counter = 1;
  private frameSeedBase: number;

  constructor(frameIndex: number) {
    this.frameSeedBase = (frameIndex + 1) * 1000;
  }

  getElements(): DrawElement[] {
    return this.elements;
  }

  stroke(points: Array<StrokePoint | [number, number]>, style: DrawStyle = {}): this {
    const normalized: StrokePoint[] = points.map((p) =>
      Array.isArray(p) ? { x: p[0], y: p[1], pressure: 0.75 } : p
    );
    const el: StrokeElement = {
      id: makeId('stk', this.counter++),
      type: 'stroke',
      brush: style.brush ?? 'ink',
      points: normalized,
      color: style.color ?? '#14171F',
      width: style.width ?? 4,
      opacity: style.opacity ?? 1,
      roughness: style.roughness ?? 1.4,
      seed: style.seed ?? this.frameSeedBase + this.counter,
    };
    this.elements.push(el);
    return this;
  }

  line(x1: number, y1: number, x2: number, y2: number, style: DrawStyle = {}): this {
    const el: ShapeElement = {
      id: makeId('shp', this.counter++),
      type: 'shape',
      shape: 'line',
      x: x1,
      y: y1,
      x2,
      y2,
      color: style.color ?? '#14171F',
      width: style.width ?? 3.5,
      opacity: style.opacity ?? 1,
      roughness: style.roughness ?? 1.5,
      seed: style.seed ?? this.frameSeedBase + this.counter,
    };
    this.elements.push(el);
    return this;
  }

  arrow(x1: number, y1: number, x2: number, y2: number, style: DrawStyle = {}): this {
    const el: ShapeElement = {
      id: makeId('shp', this.counter++),
      type: 'shape',
      shape: 'arrow',
      x: x1,
      y: y1,
      x2,
      y2,
      color: style.color ?? '#FF5A36',
      width: style.width ?? 4,
      opacity: style.opacity ?? 1,
      roughness: style.roughness ?? 1.4,
      seed: style.seed ?? this.frameSeedBase + this.counter,
    };
    this.elements.push(el);
    return this;
  }

  circle(cx: number, cy: number, diameter: number, style: DrawStyle = {}): this {
    return this.ellipse(cx, cy, diameter, diameter, style);
  }

  ellipse(cx: number, cy: number, w: number, h: number, style: DrawStyle = {}): this {
    const el: ShapeElement = {
      id: makeId('shp', this.counter++),
      type: 'shape',
      shape: 'ellipse',
      x: cx,
      y: cy,
      w,
      h,
      color: style.color ?? '#14171F',
      fill: style.fill,
      fillStyle: style.fillStyle ?? 'hachure',
      width: style.width ?? 3.5,
      opacity: style.opacity ?? 1,
      roughness: style.roughness ?? 1.6,
      seed: style.seed ?? this.frameSeedBase + this.counter,
    };
    this.elements.push(el);
    return this;
  }

  rect(x: number, y: number, w: number, h: number, style: DrawStyle = {}): this {
    const el: ShapeElement = {
      id: makeId('shp', this.counter++),
      type: 'shape',
      shape: 'rect',
      x,
      y,
      w,
      h,
      color: style.color ?? '#14171F',
      fill: style.fill,
      fillStyle: style.fillStyle ?? 'hachure',
      width: style.width ?? 3.5,
      opacity: style.opacity ?? 1,
      roughness: style.roughness ?? 1.5,
      seed: style.seed ?? this.frameSeedBase + this.counter,
    };
    this.elements.push(el);
    return this;
  }

  polygon(points: Array<[number, number]>, style: DrawStyle = {}): this {
    const el: ShapeElement = {
      id: makeId('shp', this.counter++),
      type: 'shape',
      shape: 'polygon',
      x: points[0]?.[0] ?? 0,
      y: points[0]?.[1] ?? 0,
      points: points.map(([x, y]) => ({ x, y })),
      color: style.color ?? '#14171F',
      fill: style.fill,
      fillStyle: style.fillStyle ?? 'hachure',
      width: style.width ?? 3.5,
      opacity: style.opacity ?? 1,
      roughness: style.roughness ?? 1.5,
      seed: style.seed ?? this.frameSeedBase + this.counter,
    };
    this.elements.push(el);
    return this;
  }

  text(
    x: number,
    y: number,
    content: string,
    opts: { color?: string; fontSize?: number; align?: 'left' | 'center' | 'right'; bold?: boolean; opacity?: number } = {}
  ): this {
    const el: TextElement = {
      id: makeId('txt', this.counter++),
      type: 'text',
      x,
      y,
      text: content,
      color: opts.color ?? '#14171F',
      fontSize: opts.fontSize ?? 28,
      align: opts.align ?? 'center',
      fontWeight: opts.bold ? 'bold' : 'normal',
      opacity: opts.opacity ?? 1,
    };
    this.elements.push(el);
    return this;
  }

  speechBubble(
    x: number,
    y: number,
    w: number,
    h: number,
    content: string,
    tailSide: 'left' | 'right' | 'bottom' = 'left',
    style: DrawStyle = {}
  ): this {
    this.rect(x, y, w, h, {
      color: style.color ?? '#14171F',
      fill: style.fill ?? '#FFFFFF',
      fillStyle: 'solid',
      width: style.width ?? 3,
      roughness: style.roughness ?? 1.5,
    });
    const tailX = tailSide === 'left' ? x + w * 0.25 : tailSide === 'right' ? x + w * 0.75 : x + w * 0.5;
    this.line(tailX, y + h, tailX - 18, y + h + 28, {
      color: style.color ?? '#14171F',
      width: style.width ?? 3,
      roughness: 1.4,
    });
    this.line(tailX + 20, y + h, tailX - 18, y + h + 28, {
      color: style.color ?? '#14171F',
      width: style.width ?? 3,
      roughness: 1.4,
    });
    this.text(x + w / 2, y + h / 2 + 8, content, {
      color: style.color ?? '#14171F',
      fontSize: Math.max(16, Math.min(26, h * 0.34)),
      align: 'center',
      bold: true,
    });
    return this;
  }

  stickFigure(x: number, y: number, pose: StickFigurePose = {}, style: DrawStyle = {}): this {
    const s = pose.scale ?? 1;
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const lean = rad(pose.torsoLean ?? 0);
    const hipX = x;
    const hipY = y;
    const torsoLen = 68 * s;
    const shoulderX = hipX + Math.sin(lean) * torsoLen;
    const shoulderY = hipY - Math.cos(lean) * torsoLen;
    const headRadius = 22 * s;
    const headX = shoulderX + Math.sin(lean + rad(pose.headTilt ?? 0)) * (headRadius + 10 * s);
    const headY = shoulderY - Math.cos(lean + rad(pose.headTilt ?? 0)) * (headRadius + 10 * s);

    const strokeStyle: DrawStyle = {
      color: style.color ?? '#14171F',
      width: style.width ?? 4.5 * s,
      roughness: style.roughness ?? 1.5,
      opacity: style.opacity ?? 1,
    };

    // Torso
    this.line(hipX, hipY, shoulderX, shoulderY, strokeStyle);

    // Head
    this.circle(headX, headY, headRadius * 2, {
      ...strokeStyle,
      fill: style.fill ?? '#FAF8F3',
      fillStyle: 'solid',
    });

    // Eyes & Mouth expression
    const eyeY = headY - 3 * s;
    this.circle(headX - 6 * s, eyeY, 3.5 * s, { color: strokeStyle.color, fill: strokeStyle.color, fillStyle: 'solid', width: 1.5 });
    this.circle(headX + 6 * s, eyeY, 3.5 * s, { color: strokeStyle.color, fill: strokeStyle.color, fillStyle: 'solid', width: 1.5 });

    const exp = pose.expression ?? 'happy';
    if (exp === 'happy') {
      this.stroke(
        [
          [headX - 7 * s, headY + 6 * s],
          [headX, headY + 11 * s],
          [headX + 7 * s, headY + 6 * s],
        ],
        { brush: 'ink', color: strokeStyle.color, width: 2.2 * s, roughness: 0.6 }
      );
    } else if (exp === 'surprised') {
      this.circle(headX, headY + 8 * s, 7 * s, { color: strokeStyle.color, width: 2 * s, roughness: 0.9 });
    } else if (exp === 'determined') {
      this.line(headX - 6 * s, headY + 8 * s, headX + 6 * s, headY + 6 * s, { color: strokeStyle.color, width: 2.2 * s });
    }

    // Arms
    const upperArm = 36 * s;
    const foreArm = 32 * s;
    const drawLimb = (ox: number, oy: number, angleDeg: number, bendDeg: number, len1: number, len2: number) => {
      const a1 = rad(angleDeg);
      const jx = ox + Math.sin(a1) * len1;
      const jy = oy + Math.cos(a1) * len1;
      const a2 = a1 + rad(bendDeg);
      const ex = jx + Math.sin(a2) * len2;
      const ey = jy + Math.cos(a2) * len2;
      this.line(ox, oy, jx, jy, strokeStyle);
      this.line(jx, jy, ex, ey, strokeStyle);
    };

    drawLimb(shoulderX, shoulderY + 6 * s, pose.leftArmAngle ?? -38, pose.leftElbowBend ?? -20, upperArm, foreArm);
    drawLimb(shoulderX, shoulderY + 6 * s, pose.rightArmAngle ?? 42, pose.rightElbowBend ?? 22, upperArm, foreArm);

    // Legs
    const thigh = 42 * s;
    const shin = 40 * s;
    drawLimb(hipX, hipY, pose.leftLegAngle ?? -22, pose.leftKneeBend ?? 12, thigh, shin);
    drawLimb(hipX, hipY, pose.rightLegAngle ?? 24, pose.rightKneeBend ?? 12, thigh, shin);

    return this;
  }
}

export class FrameBuilder {
  constructor(private frame: AnimationFrame, private frameIndex: number) {}

  draw(layerId: string, fn: (g: LayerCanvasContext) => void): this {
    const ctx = new LayerCanvasContext(this.frameIndex);
    fn(ctx);
    const existing = this.frame.elementsByLayer[layerId] ?? [];
    this.frame.elementsByLayer[layerId] = [...existing, ...ctx.getElements()];
    return this;
  }

  setLabel(label: string): this {
    this.frame.label = label;
    return this;
  }

  setDuration(duration: number): this {
    this.frame.duration = Math.max(1, Math.round(duration));
    return this;
  }
}

export interface ProjectBuilderOptions {
  id?: string;
  title?: string;
  width?: number;
  height?: number;
  fps?: number;
  paperStyle?: PaperStyle;
  lineBoilIntensity?: number;
}

export class HandDrawnBuilder {
  private project: AnimationProject;

  constructor(options: ProjectBuilderOptions = {}) {
    this.project = {
      version: 1,
      id: options.id ?? `proj_${Date.now().toString(36)}`,
      title: options.title ?? 'Untitled Flipbook',
      width: options.width ?? 1280,
      height: options.height ?? 720,
      fps: options.fps ?? 12,
      paperStyle: options.paperStyle ?? 'cream',
      lineBoilIntensity: options.lineBoilIntensity ?? 1.0,
      layers: [],
      frames: [],
      audioTracks: [],
      updatedAt: new Date().toISOString(),
    };
  }

  addLayer(name: string, opts: { opacity?: number; blendMode?: BlendMode; id?: string } = {}): string {
    const id = opts.id ?? `layer_${this.project.layers.length + 1}`;
    const layer: LayerDef = {
      id,
      name,
      visible: true,
      locked: false,
      opacity: opts.opacity ?? 1,
      blendMode: opts.blendMode ?? 'source-over',
    };
    this.project.layers.push(layer);
    return id;
  }

  addFrame(duration = 1, label?: string): FrameBuilder {
    const idx = this.project.frames.length;
    const frame: AnimationFrame = {
      id: `frame_${idx + 1}_${Math.random().toString(36).slice(2, 6)}`,
      duration: Math.max(1, Math.round(duration)),
      label,
      elementsByLayer: {},
    };
    for (const layer of this.project.layers) {
      frame.elementsByLayer[layer.id] = [];
    }
    this.project.frames.push(frame);
    return new FrameBuilder(frame, idx);
  }

  toProject(): AnimationProject {
    if (this.project.layers.length === 0) {
      this.addLayer('Ink');
    }
    if (this.project.frames.length === 0) {
      this.addFrame(1);
    }
    this.project.updatedAt = new Date().toISOString();
    return this.project;
  }
}
