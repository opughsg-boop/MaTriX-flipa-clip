import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { renderProjectFrameToCanvas } from '../engine/canvasRenderer';
import { Translations } from '../i18n/translations';
import {
  AnimationProject,
  DrawElement,
  OnionSkinConfig,
  ShapeElement,
  StrokeElement,
  StrokePoint,
  StudioGuidesConfig,
  ToolKind,
} from '../shared/types';

interface CanvasStageProps {
  t: Translations;
  project: AnimationProject;
  currentFrameIndex: number;
  activeLayerId: string;
  activeTool: ToolKind;
  strokeColor: string;
  fillColor: string;
  brushSize: number;
  roughness: number;
  onionSkin: OnionSkinConfig;
  guides: StudioGuidesConfig;
  isPlaying: boolean;
  onAddElements: (elements: DrawElement[]) => void;
  onReplaceFrameLayerElements: (layerId: string, elements: DrawElement[]) => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  t,
  project,
  currentFrameIndex,
  activeLayerId,
  activeTool,
  strokeColor,
  fillColor,
  brushSize,
  roughness,
  onionSkin,
  guides,
  isPlaying,
  onAddElements,
  onReplaceFrameLayerElements,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);

  // Active drawing state
  const [draftPoints, setDraftPoints] = useState<StrokePoint[]>([]);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [shapeCurrent, setShapeCurrent] = useState<{ x: number; y: number } | null>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number; origX: number; origY: number } | null>(null);

  // Text prompt overlay
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [textDraft, setTextDraft] = useState('');

  // Lasso move state
  const [lassoDragStart, setLassoDragStart] = useState<{ x: number; y: number } | null>(null);
  const [lassoOffset, setLassoOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Fit canvas to viewport on mount / resolution change
  const fitCanvas = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const pad = 48;
    const scaleX = (el.clientWidth - pad) / project.width;
    const scaleY = (el.clientHeight - pad) / project.height;
    const fitted = Math.max(0.2, Math.min(1.5, Math.min(scaleX, scaleY)));
    setZoom(Number(fitted.toFixed(2)));
    setPan({ x: 0, y: 0 });
  }, [project.width, project.height]);

  useEffect(() => {
    fitCanvas();
  }, [fitCanvas]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setSpacePressed(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePressed(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const buildPreviewElement = (): DrawElement | null => {
    if (draftPoints.length > 0 && (activeTool === 'pencil' || activeTool === 'ink' || activeTool === 'marker' || activeTool === 'eraser')) {
      return {
        id: 'preview_stroke',
        type: 'stroke',
        brush: activeTool,
        points: draftPoints,
        color: strokeColor,
        width: brushSize,
        roughness,
        seed: currentFrameIndex + 1,
      };
    }
    if (shapeStart && shapeCurrent && (activeTool === 'line' || activeTool === 'circle' || activeTool === 'rect' || activeTool === 'arrow')) {
      const dx = shapeCurrent.x - shapeStart.x;
      const dy = shapeCurrent.y - shapeStart.y;
      if (activeTool === 'line' || activeTool === 'arrow') {
        return {
          id: 'preview_shape',
          type: 'shape',
          shape: activeTool,
          x: shapeStart.x,
          y: shapeStart.y,
          x2: shapeCurrent.x,
          y2: shapeCurrent.y,
          color: strokeColor,
          width: brushSize,
          roughness,
          seed: 77,
        };
      }
      if (activeTool === 'circle') {
        const cx = (shapeStart.x + shapeCurrent.x) / 2;
        const cy = (shapeStart.y + shapeCurrent.y) / 2;
        return {
          id: 'preview_shape',
          type: 'shape',
          shape: 'ellipse',
          x: cx,
          y: cy,
          w: Math.max(8, Math.abs(dx)),
          h: Math.max(8, Math.abs(dy)),
          color: strokeColor,
          fill: fillColor || undefined,
          fillStyle: 'hachure',
          width: brushSize,
          roughness,
          seed: 77,
        };
      }
      return {
        id: 'preview_shape',
        type: 'shape',
        shape: 'rect',
        x: Math.min(shapeStart.x, shapeCurrent.x),
        y: Math.min(shapeStart.y, shapeCurrent.y),
        w: Math.max(8, Math.abs(dx)),
        h: Math.max(8, Math.abs(dy)),
        color: strokeColor,
        fill: fillColor || undefined,
        fillStyle: 'hachure',
        width: brushSize,
        roughness,
        seed: 77,
      };
    }
    return null;
  };

  // Render canvas whenever project, frame, tools, or previews update
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const previewEl = buildPreviewElement();
    renderProjectFrameToCanvas(canvas, project, currentFrameIndex, {
      onionSkin: isPlaying ? undefined : onionSkin,
      guides: isPlaying ? undefined : guides,
      includePaper: true,
      activePreviewElement: previewEl,
      activePreviewLayerId: activeLayerId,
      onImageLoad: () => {
        if (canvasRef.current) {
          renderProjectFrameToCanvas(canvasRef.current, project, currentFrameIndex, {
            onionSkin: isPlaying ? undefined : onionSkin,
            guides: isPlaying ? undefined : guides,
            includePaper: true,
          });
        }
      },
    });
  });

  const clientToCanvas = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * project.width;
    const y = ((clientY - rect.top) / rect.height) * project.height;
    return { x, y };
  };

  const activeLayer = project.layers.find((l) => l.id === activeLayerId);

  const mirrorElement = (el: DrawElement): DrawElement[] => {
    const out: DrawElement[] = [el];
    const cloneWithMirror = (source: DrawElement, mx: boolean, my: boolean, suffix: string): DrawElement => {
      const fx = (x: number) => (mx ? project.width - x : x);
      const fy = (y: number) => (my ? project.height - y : y);
      if (source.type === 'stroke') {
        return {
          ...source,
          id: `${source.id}_${suffix}`,
          points: source.points.map((p) => ({ ...p, x: fx(p.x), y: fy(p.y) })),
        };
      }
      if (source.type === 'shape') {
        if (source.shape === 'line' || source.shape === 'arrow') {
          return {
            ...source,
            id: `${source.id}_${suffix}`,
            x: fx(source.x),
            y: fy(source.y),
            x2: fx(source.x2 ?? source.x),
            y2: fy(source.y2 ?? source.y),
          };
        }
        if (source.shape === 'rect') {
          const nw = source.w ?? 0;
          const nh = source.h ?? 0;
          return {
            ...source,
            id: `${source.id}_${suffix}`,
            x: mx ? project.width - source.x - nw : source.x,
            y: my ? project.height - source.y - nh : source.y,
          };
        }
        return {
          ...source,
          id: `${source.id}_${suffix}`,
          x: fx(source.x),
          y: fy(source.y),
        };
      }
      return { ...source, id: `${source.id}_${suffix}` };
    };

    if (guides.mirrorX) out.push(cloneWithMirror(el, true, false, 'mx'));
    if (guides.mirrorY) out.push(cloneWithMirror(el, false, true, 'my'));
    if (guides.mirrorX && guides.mirrorY) out.push(cloneWithMirror(el, true, true, 'mxy'));
    return out;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    if (activeTool === 'pan' || spacePressed || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, origX: pan.x, origY: pan.y });
      return;
    }

    if (activeLayer?.locked) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = clientToCanvas(e.clientX, e.clientY);

    if (activeTool === 'fill') {
      onAddElements([
        {
          id: `fill_${Date.now().toString(36)}`,
          type: 'fill',
          x: pt.x,
          y: pt.y,
          color: strokeColor,
          tolerance: 40,
        },
      ]);
      return;
    }

    if (activeTool === 'text') {
      setTextPos(pt);
      setTextDraft('');
      return;
    }

    if (activeTool === 'lasso') {
      setLassoDragStart(pt);
      setLassoOffset({ dx: 0, dy: 0 });
      return;
    }

    if (activeTool === 'pencil' || activeTool === 'ink' || activeTool === 'marker' || activeTool === 'eraser') {
      setDraftPoints([{ x: pt.x, y: pt.y, pressure: e.pressure || 0.75 }]);
      return;
    }

    if (activeTool === 'line' || activeTool === 'circle' || activeTool === 'rect' || activeTool === 'arrow') {
      setShapeStart(pt);
      setShapeCurrent(pt);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning && panStart) {
      setPan({
        x: panStart.origX + (e.clientX - panStart.x),
        y: panStart.origY + (e.clientY - panStart.y),
      });
      return;
    }

    const pt = clientToCanvas(e.clientX, e.clientY);

    if (activeTool === 'lasso' && lassoDragStart) {
      setLassoOffset({ dx: pt.x - lassoDragStart.x, dy: pt.y - lassoDragStart.y });
      return;
    }

    if (draftPoints.length > 0) {
      setDraftPoints((prev) => [...prev, { x: pt.x, y: pt.y, pressure: e.pressure || 0.75 }]);
      return;
    }

    if (shapeStart) {
      setShapeCurrent(pt);
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (activeTool === 'lasso' && lassoDragStart) {
      const frame = project.frames[currentFrameIndex];
      const existing = frame?.elementsByLayer[activeLayerId] ?? [];
      if (existing.length > 0 && (Math.abs(lassoOffset.dx) > 2 || Math.abs(lassoOffset.dy) > 2)) {
        const shifted = existing.map((el) => {
          if (el.type === 'stroke') {
            return {
              ...el,
              points: el.points.map((p) => ({
                ...p,
                x: p.x + lassoOffset.dx,
                y: p.y + lassoOffset.dy,
              })),
            };
          }
          if (el.type === 'shape') {
            return {
              ...el,
              x: el.x + lassoOffset.dx,
              y: el.y + lassoOffset.dy,
              x2: el.x2 !== undefined ? el.x2 + lassoOffset.dx : undefined,
              y2: el.y2 !== undefined ? el.y2 + lassoOffset.dy : undefined,
            };
          }
          if (el.type === 'text' || el.type === 'image' || el.type === 'fill') {
            return { ...el, x: el.x + lassoOffset.dx, y: el.y + lassoOffset.dy };
          }
          return el;
        });
        onReplaceFrameLayerElements(activeLayerId, shifted);
      }
      setLassoDragStart(null);
      setLassoOffset({ dx: 0, dy: 0 });
      return;
    }

    if (draftPoints.length > 0 && (activeTool === 'pencil' || activeTool === 'ink' || activeTool === 'marker' || activeTool === 'eraser')) {
      const strokeEl: StrokeElement = {
        id: `stk_${Date.now().toString(36)}`,
        type: 'stroke',
        brush: activeTool,
        points: draftPoints,
        color: strokeColor,
        width: brushSize,
        roughness,
        seed: Math.floor(Math.random() * 10000),
      };
      onAddElements(mirrorElement(strokeEl));
      setDraftPoints([]);
      return;
    }

    if (shapeStart && shapeCurrent && (activeTool === 'line' || activeTool === 'circle' || activeTool === 'rect' || activeTool === 'arrow')) {
      const preview = buildPreviewElement() as ShapeElement | null;
      if (preview) {
        onAddElements(
          mirrorElement({
            ...preview,
            id: `shp_${Date.now().toString(36)}`,
            seed: Math.floor(Math.random() * 10000),
          })
        );
      }
      setShapeStart(null);
      setShapeCurrent(null);
    }
  };

  const commitText = () => {
    if (textPos && textDraft.trim()) {
      onAddElements([
        {
          id: `txt_${Date.now().toString(36)}`,
          type: 'text',
          x: textPos.x,
          y: textPos.y,
          text: textDraft.trim(),
          color: strokeColor,
          fontSize: Math.max(18, brushSize * 4),
          align: 'center',
          fontWeight: 'bold',
        },
      ]);
    }
    setTextPos(null);
    setTextDraft('');
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-[#0D0F14] overflow-hidden flex items-center justify-center select-none"
      onWheel={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.08 : 0.08;
          setZoom((z) => Number(Math.max(0.2, Math.min(2.5, z + delta)).toFixed(2)));
        }
      }}
    >
      {/* Subtle Light-table Grid Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Drawing Stage Frame */}
      <div
        className="relative shadow-2xl border border-white/15 transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <canvas
          ref={canvasRef}
          width={project.width}
          height={project.height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`block touch-none ${
            activeTool === 'pan' || spacePressed
              ? 'cursor-grab active:cursor-grabbing'
              : activeTool === 'lasso'
              ? 'cursor-move'
              : 'cursor-crosshair'
          }`}
          style={{ width: project.width, height: project.height }}
        />

        {/* Inline Text Input Modal over Canvas */}
        {textPos && (
          <div
            className="absolute z-20 bg-[#151821] border border-[#FF5A36] rounded-lg p-2.5 shadow-xl flex items-center gap-2"
            style={{
              left: Math.min(project.width - 260, Math.max(12, textPos.x - 120)),
              top: Math.min(project.height - 60, Math.max(12, textPos.y - 24)),
            }}
          >
            <input
              autoFocus
              type="text"
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitText();
                if (e.key === 'Escape') setTextPos(null);
              }}
              placeholder={t.textPrompt}
              className="bg-[#0D0F14] text-white text-sm px-2.5 py-1.5 rounded border border-white/15 outline-none w-44"
            />
            <button
              type="button"
              onClick={commitText}
              className="px-2.5 py-1.5 bg-[#FF5A36] text-white text-xs font-medium rounded cursor-pointer"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Bottom-right Stage Zoom & Info Controls */}
      <div className="absolute bottom-3 end-3 flex items-center gap-1 bg-[#151821]/95 border border-white/10 rounded-md px-2 py-1 text-xs text-slate-300">
        <button
          type="button"
          onClick={() => setZoom((z) => Number(Math.max(0.2, z - 0.1).toFixed(2)))}
          className="p-1 hover:text-white cursor-pointer"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono tabular-nums w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={() => setZoom((z) => Number(Math.min(2.5, z + 0.1).toFixed(2)))}
          className="p-1 hover:text-white cursor-pointer"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={fitCanvas}
          className="p-1 hover:text-white border-s border-white/10 ps-1.5 ms-0.5 cursor-pointer"
          aria-label="Fit canvas"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
