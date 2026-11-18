import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Code2,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Unlock,
  Wand2,
} from 'lucide-react';
import { executeAnimationScript } from '../engine/codeRunner';
import { Translations } from '../i18n/translations';
import { CODE_TEMPLATES } from '../shared/samples';
import {
  AnimationFrame,
  AnimationProject,
  BlendMode,
  LayerDef,
  OnionSkinConfig,
  PaperStyle,
  StudioGuidesConfig,
} from '../shared/types';

export type RightTab = 'layers' | 'stage' | 'ai' | 'code';

interface RightPanelProps {
  t: Translations;
  activeTab: RightTab;
  onTabChange: (tab: RightTab) => void;
  project: AnimationProject;
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onUpdateLayer: (id: string, patch: Partial<LayerDef>) => void;
  onMoveLayer: (id: string, dir: -1 | 1) => void;
  onMergeLayerDown: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onionSkin: OnionSkinConfig;
  onChangeOnionSkin: (cfg: OnionSkinConfig) => void;
  guides: StudioGuidesConfig;
  onChangeGuides: (cfg: StudioGuidesConfig) => void;
  onChangePaperStyle: (paper: PaperStyle) => void;
  onChangeLineBoil: (boil: number) => void;
  onApplyAiFrames: (frames: AnimationFrame[], mode: 'append' | 'replace', title?: string) => void;
  onCompileCodeProject: (proj: AnimationProject) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  t,
  activeTab,
  onTabChange,
  project,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onUpdateLayer,
  onMoveLayer,
  onMergeLayerDown,
  onDeleteLayer,
  onionSkin,
  onChangeOnionSkin,
  guides,
  onChangeGuides,
  onChangePaperStyle,
  onChangeLineBoil,
  onApplyAiFrames,
  onCompileCodeProject,
}) => {
  // AI Animator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiFramesCount, setAiFramesCount] = useState(12);
  const [aiStyle, setAiStyle] = useState<'ink' | 'pencil' | 'chalkboard'>('ink');
  const [aiMode, setAiMode] = useState<'append' | 'replace'>('replace');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Code Animator state
  const [codeText, setCodeText] = useState(CODE_TEMPLATES[0].code);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [copiedCli, setCopiedCli] = useState(false);

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/generate-animation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          frameCount: aiFramesCount,
          width: project.width,
          height: project.height,
          style: aiStyle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const bgLayerId = project.layers[0]?.id ?? 'layer_1';
      const charLayerId = project.layers[1]?.id ?? project.layers[0]?.id ?? 'layer_1';

      const mappedFrames: AnimationFrame[] = data.frames.map((f: any) => ({
        id: f.id,
        duration: f.duration || 1,
        label: f.label,
        elementsByLayer: {
          [bgLayerId]: f.bgElements || [],
          ...(charLayerId !== bgLayerId ? { [charLayerId]: f.charElements || [] } : {}),
        },
      }));

      if (charLayerId === bgLayerId) {
        mappedFrames.forEach((f, idx) => {
          f.elementsByLayer[bgLayerId] = [
            ...(data.frames[idx].bgElements || []),
            ...(data.frames[idx].charElements || []),
          ];
        });
      }

      onApplyAiFrames(mappedFrames, aiMode, data.title);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate AI frames');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunCode = () => {
    setCodeError(null);
    try {
      const generated = executeAnimationScript(codeText);
      onCompileCodeProject(generated);
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Script error');
    }
  };

  const copyCliCmd = () => {
    const cmd = `npm run render -- --input projects/${project.id}.flipa.json --format gif --out exports/${project.id}.gif`;
    navigator.clipboard.writeText(cmd);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 1800);
  };

  return (
    <aside className="w-80 shrink-0 bg-[#151821] border-s border-white/8 flex flex-col overflow-hidden">
      {/* Tab Selector */}
      <div className="grid grid-cols-4 border-b border-white/8 bg-[#12151C]">
        {(
          [
            { id: 'layers', label: t.layers, icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'stage', label: t.onionSkin, icon: <Eye className="w-3.5 h-3.5" /> },
            { id: 'ai', label: t.aiAnimator, icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'code', label: t.codeAnimator, icon: <Code2 className="w-3.5 h-3.5" /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 text-[11px] font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#FF5A36] text-white bg-[#151821]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span className="truncate max-w-full whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {activeTab === 'layers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">{t.layers}</span>
              <button
                type="button"
                onClick={onAddLayer}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-xs font-medium cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addLayer}</span>
              </button>
            </div>

            <div className="space-y-2">
              {[...project.layers].reverse().map((layer) => {
                const isSelected = layer.id === activeLayerId;
                return (
                  <div
                    key={layer.id}
                    onClick={() => onSelectLayer(layer.id)}
                    className={`rounded-lg border p-2.5 space-y-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1C202B] border-[#FF5A36]/70'
                        : 'bg-[#12151C] border-white/8 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={layer.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateLayer(layer.id, { name: e.target.value })}
                        className="bg-transparent text-xs font-medium text-white outline-none w-full truncate border-b border-transparent focus:border-white/20"
                      />
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onUpdateLayer(layer.id, { visible: !layer.visible })}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          aria-label="Toggle visibility"
                        >
                          {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          aria-label="Toggle lock"
                        >
                          {layer.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="pt-2 border-t border-white/8 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                          <span>{t.opacity}</span>
                          <input
                            type="range"
                            min={0.05}
                            max={1}
                            step={0.05}
                            value={layer.opacity}
                            onChange={(e) => onUpdateLayer(layer.id, { opacity: Number(e.target.value) })}
                            className="w-28 accent-[#FF5A36]"
                          />
                          <span className="font-mono tabular-nums w-8 text-end">
                            {Math.round(layer.opacity * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1.5 text-[11px]">
                          <select
                            value={layer.blendMode}
                            onChange={(e) => onUpdateLayer(layer.id, { blendMode: e.target.value as BlendMode })}
                            className="bg-[#0D0F14] border border-white/10 rounded px-2 py-1 text-slate-200 text-[11px]"
                          >
                            <option value="source-over">Normal</option>
                            <option value="multiply">Multiply</option>
                            <option value="screen">Screen</option>
                            <option value="overlay">Overlay</option>
                          </select>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onMoveLayer(layer.id, 1)}
                              className="p-1 rounded bg-[#0D0F14] text-slate-300 hover:text-white cursor-pointer"
                              title="Move up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveLayer(layer.id, -1)}
                              className="p-1 rounded bg-[#0D0F14] text-slate-300 hover:text-white cursor-pointer"
                              title="Move down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMergeLayerDown(layer.id)}
                              className="px-1.5 py-1 rounded bg-[#0D0F14] text-[10px] text-slate-300 hover:text-white cursor-pointer"
                            >
                              {t.mergeDown}
                            </button>
                            {project.layers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => onDeleteLayer(layer.id)}
                                className="p-1 rounded bg-[#0D0F14] text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                                title="Delete layer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'stage' && (
          <div className="space-y-5">
            {/* Onion Skinning */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">{t.onionSkin}</span>
                <button
                  type="button"
                  onClick={() => onChangeOnionSkin({ ...onionSkin, enabled: !onionSkin.enabled })}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                    onionSkin.enabled ? 'bg-[#FF5A36] text-white' : 'bg-[#1C202B] text-slate-400'
                  }`}
                >
                  {onionSkin.enabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-rose-400">{t.onionBefore}</span>
                  <input
                    type="range"
                    min={0}
                    max={4}
                    value={onionSkin.framesBefore}
                    onChange={(e) => onChangeOnionSkin({ ...onionSkin, framesBefore: Number(e.target.value) })}
                    className="w-28 accent-rose-500"
                  />
                  <span className="font-mono tabular-nums w-5 text-end">{onionSkin.framesBefore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400">{t.onionAfter}</span>
                  <input
                    type="range"
                    min={0}
                    max={4}
                    value={onionSkin.framesAfter}
                    onChange={(e) => onChangeOnionSkin({ ...onionSkin, framesAfter: Number(e.target.value) })}
                    className="w-28 accent-emerald-500"
                  />
                  <span className="font-mono tabular-nums w-5 text-end">{onionSkin.framesAfter}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t.onionOpacity}</span>
                  <input
                    type="range"
                    min={0.05}
                    max={0.6}
                    step={0.05}
                    value={onionSkin.opacity}
                    onChange={(e) => onChangeOnionSkin({ ...onionSkin, opacity: Number(e.target.value) })}
                    className="w-28 accent-[#FF5A36]"
                  />
                  <span className="font-mono tabular-nums w-8 text-end">{Math.round(onionSkin.opacity * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Guides */}
            <div className="pt-3 border-t border-white/8 space-y-2.5">
              <span className="text-xs font-semibold text-slate-200 block">{t.guides}</span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: 'gridOverlay', label: t.grid },
                    { key: 'ruler', label: t.ruler },
                    { key: 'mirrorX', label: t.mirrorX },
                    { key: 'mirrorY', label: t.mirrorY },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => onChangeGuides({ ...guides, [g.key]: !guides[g.key] })}
                    className={`py-2 px-2.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                      guides[g.key]
                        ? 'bg-[#FF5A36]/15 border-[#FF5A36] text-white'
                        : 'bg-[#12151C] border-white/8 text-slate-400 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Paper & Line Boil */}
            <div className="pt-3 border-t border-white/8 space-y-3">
              <span className="text-xs font-semibold text-slate-200 block">{t.paperStyle}</span>
              <div className="grid grid-cols-5 gap-1.5">
                {(['cream', 'white', 'grid', 'dark', 'transparent'] as PaperStyle[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onChangePaperStyle(p)}
                    className={`py-1.5 rounded text-[11px] capitalize border cursor-pointer ${
                      project.paperStyle === p
                        ? 'border-[#FF5A36] bg-[#FF5A36]/15 text-white'
                        : 'border-white/10 bg-[#12151C] text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{t.lineBoil}</span>
                  <span className="font-mono tabular-nums text-slate-400">{project.lineBoilIntensity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2.5}
                  step={0.1}
                  value={project.lineBoilIntensity}
                  onChange={(e) => onChangeLineBoil(Number(e.target.value))}
                  className="w-full accent-[#FF5A36]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Wand2 className="w-4 h-4 text-[#FF5A36]" />
              <span>{t.aiTitle}</span>
            </div>

            <textarea
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={t.aiPlaceholder}
              className="w-full bg-[#0D0F14] border border-white/10 focus:border-[#FF5A36] rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 outline-none resize-none"
            />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="space-y-1">
                <span className="text-slate-400 block">{t.aiFramesCount}</span>
                <input
                  type="number"
                  min={4}
                  max={24}
                  value={aiFramesCount}
                  onChange={(e) => setAiFramesCount(Math.max(4, Math.min(24, Number(e.target.value))))}
                  className="w-full bg-[#0D0F14] border border-white/10 rounded px-2.5 py-1.5 text-white font-mono tabular-nums"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-400 block">{t.aiStyle}</span>
                <select
                  value={aiStyle}
                  onChange={(e) => setAiStyle(e.target.value as 'ink' | 'pencil' | 'chalkboard')}
                  className="w-full bg-[#0D0F14] border border-white/10 rounded px-2 py-1.5 text-white"
                >
                  <option value="ink">Ink & Color</option>
                  <option value="pencil">Pencil Sketch</option>
                  <option value="chalkboard">Chalkboard</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0D0F14] rounded-md border border-white/8 text-xs">
              <button
                type="button"
                onClick={() => setAiMode('replace')}
                className={`py-1.5 rounded font-medium cursor-pointer ${
                  aiMode === 'replace' ? 'bg-[#1C202B] text-white' : 'text-slate-400'
                }`}
              >
                {t.aiReplace}
              </button>
              <button
                type="button"
                onClick={() => setAiMode('append')}
                className={`py-1.5 rounded font-medium cursor-pointer ${
                  aiMode === 'append' ? 'bg-[#1C202B] text-white' : 'text-slate-400'
                }`}
              >
                {t.aiAppend}
              </button>
            </div>

            {aiError && (
              <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {aiError}
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerateAi}
              disabled={aiLoading || !aiPrompt.trim()}
              className="w-full py-2.5 px-3 rounded-md bg-[#FF5A36] hover:bg-[#ff6d4d] disabled:opacity-45 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiLoading ? t.aiGenerating : t.aiGenerate}</span>
            </button>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-3 flex flex-col h-full">
            <div className="text-xs font-semibold text-slate-200">{t.codeTitle}</div>

            <select
              onChange={(e) => {
                const tpl = CODE_TEMPLATES.find((x) => x.id === e.target.value);
                if (tpl) setCodeText(tpl.code);
              }}
              className="w-full bg-[#0D0F14] border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-200"
            >
              {CODE_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.titleEn}
                </option>
              ))}
            </select>

            <textarea
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              spellCheck={false}
              dir="ltr"
              className="w-full flex-1 min-h-[260px] bg-[#0A0C10] border border-white/10 focus:border-[#FF5A36] rounded-lg p-2.5 font-mono text-[11px] leading-relaxed text-emerald-300 outline-none resize-none"
            />

            {codeError && (
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300 font-mono">
                {codeError}
              </div>
            )}

            <button
              type="button"
              onClick={handleRunCode}
              className="w-full py-2.5 px-3 rounded-md bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{t.runScript}</span>
            </button>

            <button
              type="button"
              onClick={copyCliCmd}
              className="w-full py-2 px-3 rounded-md bg-[#1C202B] hover:bg-[#252A38] border border-white/8 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCli ? t.copied : t.copyCli}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
