export type Language = 'en' | 'ar';

export type PaperStyle = 'cream' | 'white' | 'grid' | 'dark' | 'transparent';

export type BrushKind = 'pencil' | 'ink' | 'marker' | 'eraser';

export type ToolKind =
  | 'pencil'
  | 'ink'
  | 'marker'
  | 'fill'
  | 'eraser'
  | 'lasso'
  | 'line'
  | 'circle'
  | 'rect'
  | 'arrow'
  | 'text'
  | 'pan';

export type BlendMode = 'source-over' | 'multiply' | 'screen' | 'overlay';

export type FillStyle = 'solid' | 'hachure' | 'cross-hatch' | 'zigzag' | 'dots';

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface StrokeElement {
  id: string;
  type: 'stroke';
  brush: BrushKind;
  points: StrokePoint[];
  color: string;
  width: number;
  opacity?: number;
  roughness?: number;
  seed?: number;
}

export interface ShapeElement {
  id: string;
  type: 'shape';
  shape: 'line' | 'circle' | 'ellipse' | 'rect' | 'arrow' | 'polygon';
  x: number;
  y: number;
  w?: number;
  h?: number;
  x2?: number;
  y2?: number;
  points?: StrokePoint[];
  color: string;
  fill?: string;
  fillStyle?: FillStyle;
  width: number;
  opacity?: number;
  roughness?: number;
  seed?: number;
}

export interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  align?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  opacity?: number;
}

export interface ImageElement {
  id: string;
  type: 'image';
  x: number;
  y: number;
  w: number;
  h: number;
  dataUrl: string;
  opacity?: number;
}

export interface FillElement {
  id: string;
  type: 'fill';
  x: number;
  y: number;
  color: string;
  tolerance?: number;
  seed?: number;
}

export type DrawElement =
  | StrokeElement
  | ShapeElement
  | TextElement
  | ImageElement
  | FillElement;

export interface LayerDef {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
}

export interface AnimationFrame {
  id: string;
  duration: number; // hold ticks (1 = standard single frame)
  label?: string;
  elementsByLayer: Record<string, DrawElement[]>;
}

export interface AudioClip {
  id: string;
  name: string;
  dataUrl: string;
  startFrame: number;
  durationSeconds: number;
  volume: number;
  muted: boolean;
  waveformPeaks: number[];
}

export interface OnionSkinConfig {
  enabled: boolean;
  framesBefore: number;
  framesAfter: number;
  opacity: number;
  tintBefore: string;
  tintAfter: string;
}

export interface StudioGuidesConfig {
  ruler: boolean;
  mirrorX: boolean;
  mirrorY: boolean;
  gridOverlay: boolean;
}

export interface AnimationProject {
  version: 1;
  id: string;
  title: string;
  width: number;
  height: number;
  fps: number;
  paperStyle: PaperStyle;
  lineBoilIntensity: number; // 0 = clean static seeds, 1 = classic 12fps hand-drawn boil
  layers: LayerDef[];
  frames: AnimationFrame[];
  audioTracks: AudioClip[];
  updatedAt: string;
}
