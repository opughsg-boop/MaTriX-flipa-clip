declare module 'gifenc' {
  export interface GifPaletteOptions {
    format?: 'rgb565' | 'rgb444' | 'rgba4444';
    clearAlpha?: boolean;
    clearAlphaThreshold?: number;
    oneBitAlpha?: boolean | number;
  }

  export interface GifFrameOptions {
    palette?: number[][];
    delay?: number;
    transparent?: boolean;
    transparentIndex?: number;
    repeat?: number;
    dispose?: number;
  }

  export interface GifEncoderInstance {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: GifFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
  }

  export function GIFEncoder(opts?: { auto?: boolean }): GifEncoderInstance;
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, opts?: GifPaletteOptions): number[][];
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: number[][], format?: 'rgb565' | 'rgb444' | 'rgba4444'): Uint8Array;

  const gifencDefault: {
    GIFEncoder: typeof GIFEncoder;
    quantize: typeof quantize;
    applyPalette: typeof applyPalette;
  };
  export default gifencDefault;
}
