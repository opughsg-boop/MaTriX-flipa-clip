import React from 'react';
import {
  ArrowUpRight,
  Circle,
  Eraser,
  Hand,
  Highlighter,
  ImagePlus,
  Lasso,
  Minus,
  PaintBucket,
  PenTool,
  Pencil,
  Redo2,
  Square,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import { Translations } from '../i18n/translations';
import { ToolKind } from '../shared/types';

interface ToolRailProps {
  t: Translations;
  activeTool: ToolKind;
  onSelectTool: (tool: ToolKind) => void;
  strokeColor: string;
  onChangeStrokeColor: (c: string) => void;
  fillColor: string;
  onChangeFillColor: (c: string) => void;
  brushSize: number;
  onChangeBrushSize: (s: number) => void;
  roughness: number;
  onChangeRoughness: (r: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearFrame: () => void;
  onImportTraceImage: (file: File) => void;
}

const SWATCHES = ['#111827', '#FF5A36', '#0284C7', '#16A34A', '#D97706', '#FFFFFF'];

export const ToolRail: React.FC<ToolRailProps> = ({
  t,
  activeTool,
  onSelectTool,
  strokeColor,
  onChangeStrokeColor,
  fillColor,
  onChangeFillColor,
  brushSize,
  onChangeBrushSize,
  roughness,
  onChangeRoughness,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearFrame,
  onImportTraceImage,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const tools: Array<{ id: ToolKind; label: string; icon: React.ReactNode }> = [
    { id: 'pencil', label: t.tools.pencil, icon: <Pencil className="w-4 h-4" /> },
    { id: 'ink', label: t.tools.ink, icon: <PenTool className="w-4 h-4" /> },
    { id: 'marker', label: t.tools.marker, icon: <Highlighter className="w-4 h-4" /> },
    { id: 'fill', label: t.tools.fill, icon: <PaintBucket className="w-4 h-4" /> },
    { id: 'eraser', label: t.tools.eraser, icon: <Eraser className="w-4 h-4" /> },
    { id: 'lasso', label: t.tools.lasso, icon: <Lasso className="w-4 h-4" /> },
    { id: 'line', label: t.tools.line, icon: <Minus className="w-4 h-4" /> },
    { id: 'circle', label: t.tools.circle, icon: <Circle className="w-4 h-4" /> },
    { id: 'rect', label: t.tools.rect, icon: <Square className="w-4 h-4" /> },
    { id: 'arrow', label: t.tools.arrow, icon: <ArrowUpRight className="w-4 h-4" /> },
    { id: 'text', label: t.tools.text, icon: <Type className="w-4 h-4" /> },
    { id: 'pan', label: t.tools.pan, icon: <Hand className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-60 shrink-0 bg-[#151821] border-e border-white/8 flex flex-col justify-between overflow-y-auto select-none">
      <div className="p-3 space-y-4">
        {/* Drawing Tool Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {tools.map((tool) => {
            const active = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTool(tool.id)}
                title={tool.label}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#FF5A36] text-white'
                    : 'bg-[#1C202B] text-slate-300 hover:bg-[#252A38] hover:text-white'
                }`}
              >
                {tool.icon}
                <span className="truncate max-w-full px-0.5 whitespace-nowrap">{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* Stroke & Fill Colors */}
        <div className="pt-3 border-t border-white/8 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>{t.color}</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">{strokeColor}</span>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => onChangeStrokeColor(e.target.value)}
                className="w-6 h-6 rounded border border-white/15 bg-transparent cursor-pointer"
              />
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => onChangeStrokeColor(swatch)}
                aria-label={`Select color ${swatch}`}
                className={`w-6 h-6 rounded border transition-transform cursor-pointer ${
                  strokeColor.toLowerCase() === swatch.toLowerCase()
                    ? 'border-[#FF5A36] scale-110'
                    : 'border-white/20 hover:scale-105'
                }`}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
            <span>{t.fillColor}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChangeFillColor('')}
                className={`px-2 py-0.5 text-[11px] rounded border cursor-pointer ${
                  !fillColor
                    ? 'border-[#FF5A36] text-[#FF5A36] bg-[#FF5A36]/10'
                    : 'border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                None
              </button>
              <input
                type="color"
                value={fillColor || '#FDE047'}
                onChange={(e) => onChangeFillColor(e.target.value)}
                className="w-6 h-6 rounded border border-white/15 bg-transparent cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Size & Sketchiness */}
        <div className="pt-3 border-t border-white/8 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{t.brushSize}</span>
              <span className="font-mono tabular-nums text-slate-400">{brushSize}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={48}
              value={brushSize}
              onChange={(e) => onChangeBrushSize(Number(e.target.value))}
              className="w-full accent-[#FF5A36] cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{t.roughness}</span>
              <span className="font-mono tabular-nums text-slate-400">{roughness.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={3.5}
              step={0.1}
              value={roughness}
              onChange={(e) => onChangeRoughness(Number(e.target.value))}
              className="w-full accent-[#FF5A36] cursor-pointer"
            />
          </div>
        </div>

        {/* Rotoscope Trace Image */}
        <div className="pt-3 border-t border-white/8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportTraceImage(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-[#1C202B] hover:bg-[#252A38] text-xs font-medium text-slate-200 border border-white/8 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ImagePlus className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>{t.importImage}</span>
          </button>
        </div>
      </div>

      {/* Undo / Redo / Clear Frame */}
      <div className="p-3 border-t border-white/8 grid grid-cols-3 gap-1.5 bg-[#12151C]">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title={t.undo}
          className="flex items-center justify-center gap-1 py-2 px-2 rounded-md bg-[#1C202B] text-xs text-slate-200 hover:bg-[#252A38] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className="truncate">{t.undo}</span>
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title={t.redo}
          className="flex items-center justify-center gap-1 py-2 px-2 rounded-md bg-[#1C202B] text-xs text-slate-200 hover:bg-[#252A38] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
        >
          <Redo2 className="w-3.5 h-3.5" />
          <span className="truncate">{t.redo}</span>
        </button>
        <button
          type="button"
          onClick={onClearFrame}
          title={t.clearFrame}
          className="flex items-center justify-center gap-1 py-2 px-2 rounded-md bg-[#1C202B] text-xs text-rose-300 hover:bg-rose-500/15 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="truncate">{t.clearFrame}</span>
        </button>
      </div>
    </aside>
  );
};
