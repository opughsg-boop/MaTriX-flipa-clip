import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, FolderOpen, Plus, Trash2, Upload, X } from 'lucide-react';
import {
  BrowserExportFormat,
  exportProjectAsGif,
  exportProjectAsPngZip,
  exportProjectAsVideo,
} from '../engine/exporters';
import { Translations } from '../i18n/translations';
import { AnimationProject, PaperStyle } from '../shared/types';

/* ------------------- Export Modal ------------------- */
interface ExportModalProps {
  t: Translations;
  project: AnimationProject;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ t, project, onClose }) => {
  const [format, setFormat] = useState<BrowserExportFormat>('video');
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedCli, setCopiedCli] = useState(false);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleExport = async () => {
    setRendering(true);
    setError(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    const slug = project.id || 'animation';
    try {
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName(`${slug}.flipa.json`);
      } else if (format === 'gif') {
        const blob = await exportProjectAsGif(project, (c, tot) => setProgress({ current: c, total: tot }));
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName(`${slug}.gif`);
      } else if (format === 'png-zip') {
        const blob = await exportProjectAsPngZip(project, (c, tot) => setProgress({ current: c, total: tot }));
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName(`${slug}-frames.zip`);
      } else {
        const res = await exportProjectAsVideo(project, (c, tot) => setProgress({ current: c, total: tot }));
        setDownloadUrl(URL.createObjectURL(res.blob));
        setDownloadName(`${slug}.${res.extension}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setRendering(false);
    }
  };

  const cliCmd = `npm run render -- --input projects/${project.id}.flipa.json --format ${
    format === 'png-zip' ? 'png' : format === 'video' ? 'mp4' : 'gif'
  } --out exports/${project.id}.${format === 'png-zip' ? 'frames' : format === 'video' ? 'mp4' : 'gif'}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#151821] border border-white/12 rounded-xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-white">{t.exportTitle}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: 'video', label: 'MP4 / WebM Video (+ Audio)' },
                { id: 'gif', label: 'Animated GIF' },
                { id: 'png-zip', label: 'PNG Sequence (ZIP)' },
                { id: 'json', label: 'Project Source (.flipa.json)' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFormat(opt.id)}
                className={`p-3 rounded-lg border text-xs font-medium text-start transition-colors cursor-pointer ${
                  format === opt.id
                    ? 'bg-[#FF5A36]/15 border-[#FF5A36] text-white'
                    : 'bg-[#0D0F14] border-white/10 text-slate-300 hover:border-white/25'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Codex / Claude Code CLI Preview */}
          <div className="bg-[#0A0C10] border border-white/8 rounded-lg p-3 space-y-1.5" dir="ltr">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Node.js Headless CLI (Codex / Claude Code)</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(cliCmd);
                  setCopiedCli(true);
                  setTimeout(() => setCopiedCli(false), 1600);
                }}
                className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
              >
                {copiedCli ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCli ? t.copied : 'Copy'}</span>
              </button>
            </div>
            <code className="block font-mono text-[11px] text-emerald-300 break-all">{cliCmd}</code>
          </div>

          {rendering && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300 font-mono tabular-nums">
                <span>{t.exportProgress}</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2 bg-[#0D0F14] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF5A36] transition-all"
                  style={{
                    width: `${progress.total ? Math.round((progress.current / progress.total) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={downloadName}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.exportDownload} ({downloadName})</span>
              </a>
            )}
            <button
              type="button"
              onClick={handleExport}
              disabled={rendering}
              className="px-4 py-2 rounded-md bg-[#FF5A36] hover:bg-[#ff6d4d] disabled:opacity-45 text-xs font-semibold text-white cursor-pointer"
            >
              {t.exportStart}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------- Projects Modal ------------------- */
interface ProjectSummary {
  id: string;
  title: string;
  width: number;
  height: number;
  fps: number;
  frameCount: number;
  layerCount: number;
  updatedAt: string;
}

interface ProjectsModalProps {
  t: Translations;
  onSelectProject: (project: AnimationProject) => void;
  onClose: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({ t, onSelectProject, onClose }) => {
  const [items, setItems] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setItems(data.projects || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const openId = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    if (data.project) {
      onSelectProject(data.project);
      onClose();
    }
  };

  const deleteId = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    loadList();
  };

  const handleImportJson = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as AnimationProject;
    if (parsed && Array.isArray(parsed.frames)) {
      onSelectProject(parsed);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#151821] border border-white/12 rounded-xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-white">{t.projects}</h2>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportJson(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1C202B] hover:bg-[#252A38] text-xs text-slate-200 border border-white/10 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import .flipa.json</span>
            </button>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading projects...</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">{t.emptyProjects}</div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#0D0F14] border border-white/8 hover:border-white/20"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{item.title}</div>
                  <div className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                    {item.width}x{item.height} · {item.fps} FPS · {item.frameCount} {t.frames}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openId(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#FF5A36] hover:bg-[#ff6d4d] text-xs font-medium text-white cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteId(item.id)}
                    className="p-1.5 rounded bg-[#1C202B] text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    aria-label="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------- New Project Modal ------------------- */
interface NewProjectModalProps {
  t: Translations;
  onCreate: (opts: { title: string; width: number; height: number; fps: number; paperStyle: PaperStyle }) => void;
  onClose: () => void;
}

const PRESETS = [
  { label: 'YouTube HD (1280x720)', w: 1280, h: 720 },
  { label: 'Full HD (1920x1080)', w: 1920, h: 1080 },
  { label: 'Shorts / Reels (1080x1920)', w: 1080, h: 1920 },
  { label: 'Square (1080x1080)', w: 1080, h: 1080 },
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ t, onCreate, onClose }) => {
  const [title, setTitle] = useState('New Flipbook');
  const [presetIdx, setPresetIdx] = useState(0);
  const [fps, setFps] = useState(12);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>('cream');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#151821] border border-white/12 rounded-xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-white">{t.newProject}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <label className="block space-y-1.5">
            <span className="text-slate-300 font-medium">{t.projectTitle}</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0D0F14] border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-[#FF5A36]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-slate-300 font-medium">{t.dimensions}</span>
            <select
              value={presetIdx}
              onChange={(e) => setPresetIdx(Number(e.target.value))}
              className="w-full bg-[#0D0F14] border border-white/10 rounded-md px-3 py-2 text-white outline-none"
            >
              {PRESETS.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-slate-300 font-medium">{t.fps}</span>
              <input
                type="number"
                min={1}
                max={60}
                value={fps}
                onChange={(e) => setFps(Math.max(1, Math.min(60, Number(e.target.value) || 12)))}
                className="w-full bg-[#0D0F14] border border-white/10 rounded-md px-3 py-2 text-white font-mono tabular-nums"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-slate-300 font-medium">{t.paperStyle}</span>
              <select
                value={paperStyle}
                onChange={(e) => setPaperStyle(e.target.value as PaperStyle)}
                className="w-full bg-[#0D0F14] border border-white/10 rounded-md px-3 py-2 text-white"
              >
                <option value="cream">Cream Sketch</option>
                <option value="white">Crisp White</option>
                <option value="grid">Blueprint Grid</option>
                <option value="dark">Chalkboard Dark</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-[#1C202B] text-slate-300 hover:text-white cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={() => {
                const p = PRESETS[presetIdx];
                onCreate({ title: title.trim() || 'Untitled Flipbook', width: p.w, height: p.h, fps, paperStyle });
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#FF5A36] hover:bg-[#ff6d4d] text-white font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.createProject}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
