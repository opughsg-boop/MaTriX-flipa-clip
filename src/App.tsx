import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CanvasStage } from './components/CanvasStage';
import { ExportModal, NewProjectModal, ProjectsModal } from './components/Modals';
import { RightPanel, RightTab } from './components/RightPanel';
import { TimelineDock } from './components/TimelineDock';
import { ToolRail } from './components/ToolRail';
import { TopBar } from './components/TopBar';
import { expandFrameSchedule } from './engine/exporters';
import { TRANSLATIONS } from './i18n/translations';
import { createDefaultBounceProject } from './shared/samples';
import {
  AnimationFrame,
  AnimationProject,
  AudioClip,
  DrawElement,
  Language,
  LayerDef,
  OnionSkinConfig,
  PaperStyle,
  StudioGuidesConfig,
  ToolKind,
} from './shared/types';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const t = TRANSLATIONS[lang];

  const [project, setProject] = useState<AnimationProject>(() => createDefaultBounceProject());
  const [historyPast, setHistoryPast] = useState<AnimationProject[]>([]);
  const [historyFuture, setHistoryFuture] = useState<AnimationProject[]>([]);

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [activeLayerId, setActiveLayerId] = useState<string>(() => project.layers[2]?.id ?? project.layers[0].id);
  const [activeTool, setActiveTool] = useState<ToolKind>('ink');
  const [strokeColor, setStrokeColor] = useState('#111827');
  const [fillColor, setFillColor] = useState('');
  const [brushSize, setBrushSize] = useState(5);
  const [roughness, setRoughness] = useState(1.4);

  const [layoutMode, setLayoutMode] = useState<'classic' | 'studio'>('studio');
  const [rightTab, setRightTab] = useState<RightTab>('layers');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [onionSkin, setOnionSkin] = useState<OnionSkinConfig>({
    enabled: true,
    framesBefore: 1,
    framesAfter: 1,
    opacity: 0.25,
    tintBefore: '#EF4444',
    tintAfter: '#10B981',
  });

  const [guides, setGuides] = useState<StudioGuidesConfig>({
    ruler: false,
    mirrorX: false,
    mirrorY: false,
    gridOverlay: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [loopPlayback, setLoopPlayback] = useState(true);

  const [showExport, setShowExport] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  const activeAudioPlayersRef = useRef<HTMLAudioElement[]>([]);

  const commitProjectChange = useCallback(
    (updater: (prev: AnimationProject) => AnimationProject) => {
      setProject((prev) => {
        const next = updater(prev);
        setHistoryPast((past) => [...past.slice(-29), prev]);
        setHistoryFuture([]);
        return next;
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((p) => p.slice(0, -1));
    setHistoryFuture((f) => [project, ...f]);
    setProject(previous);
    setCurrentFrameIndex((idx) => Math.min(idx, previous.frames.length - 1));
  }, [historyPast, project]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((f) => f.slice(1));
    setHistoryPast((p) => [...p, project]);
    setProject(next);
    setCurrentFrameIndex((idx) => Math.min(idx, next.frames.length - 1));
  }, [historyFuture, project]);

  // Load first project from disk if available on mount
  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then(async (data) => {
        const first = data?.projects?.[0];
        if (first?.id) {
          const res = await fetch(`/api/projects/${first.id}`);
          const full = await res.json();
          if (full?.project) {
            setProject(full.project);
            const layers = full.project.layers as LayerDef[];
            setActiveLayerId(layers[layers.length - 1]?.id ?? layers[0]?.id ?? 'layer_1');
          }
        }
      })
      .catch(() => {
        // Fallback already initialized with default bounce sample
      });
  }, []);

  // Playback loop honoring hold durations and audio tracks
  useEffect(() => {
    if (!isPlaying) {
      activeAudioPlayersRef.current.forEach((a) => {
        a.pause();
        a.currentTime = 0;
      });
      activeAudioPlayersRef.current = [];
      return;
    }

    const schedule = expandFrameSchedule(project);
    if (schedule.length === 0) {
      setIsPlaying(false);
      return;
    }

    // Start audio clips
    const players: HTMLAudioElement[] = [];
    for (const clip of project.audioTracks) {
      if (clip.muted || !clip.dataUrl) continue;
      const audio = new Audio(clip.dataUrl);
      audio.volume = clip.volume;
      const delayMs = Math.max(0, (clip.startFrame / project.fps) * 1000);
      setTimeout(() => {
        audio.play().catch(() => {});
      }, delayMs);
      players.push(audio);
    }
    activeAudioPlayersRef.current = players;

    let tick = Math.max(0, schedule.indexOf(currentFrameIndex));
    const interval = setInterval(() => {
      tick += 1;
      if (tick >= schedule.length) {
        if (loopPlayback) {
          tick = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
      setCurrentFrameIndex(schedule[tick]);
    }, 1000 / project.fps);

    return () => {
      clearInterval(interval);
      players.forEach((a) => {
        a.pause();
        a.currentTime = 0;
      });
    };
  }, [isPlaying, project.fps, project.frames, project.audioTracks, loopPlayback]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'ArrowRight') {
        setCurrentFrameIndex((i) => Math.min(project.frames.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentFrameIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo, project.frames.length]);

  const handleSaveProject = async () => {
    setSaveState('saving');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.project) setProject(data.project);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } else {
        setSaveState('idle');
      }
    } catch {
      setSaveState('idle');
    }
  };

  const handleAddElements = (elements: DrawElement[]) => {
    commitProjectChange((prev) => {
      const frames = prev.frames.map((f, idx) => {
        if (idx !== currentFrameIndex) return f;
        const existing = f.elementsByLayer[activeLayerId] ?? [];
        return {
          ...f,
          elementsByLayer: {
            ...f.elementsByLayer,
            [activeLayerId]: [...existing, ...elements],
          },
        };
      });
      return { ...prev, frames };
    });
  };

  const handleReplaceLayerElements = (layerId: string, elements: DrawElement[]) => {
    commitProjectChange((prev) => ({
      ...prev,
      frames: prev.frames.map((f, idx) =>
        idx === currentFrameIndex
          ? { ...f, elementsByLayer: { ...f.elementsByLayer, [layerId]: elements } }
          : f
      ),
    }));
  };

  const handleClearFrame = () => {
    handleReplaceLayerElements(activeLayerId, []);
  };

  const handleImportTraceImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(project.width * 0.7 / img.width, project.height * 0.7 / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        handleAddElements([
          {
            id: `img_${Date.now().toString(36)}`,
            type: 'image',
            x: (project.width - w) / 2,
            y: (project.height - h) / 2,
            w,
            h,
            dataUrl,
            opacity: 0.75,
          },
        ]);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleAddFrame = () => {
    commitProjectChange((prev) => {
      const newFrame: AnimationFrame = {
        id: `frame_${Date.now().toString(36)}`,
        duration: 1,
        elementsByLayer: {},
      };
      const frames = [...prev.frames];
      frames.splice(currentFrameIndex + 1, 0, newFrame);
      return { ...prev, frames };
    });
    setCurrentFrameIndex((i) => i + 1);
  };

  const handleDuplicateFrame = () => {
    commitProjectChange((prev) => {
      const src = prev.frames[currentFrameIndex];
      const copy: AnimationFrame = {
        ...JSON.parse(JSON.stringify(src)),
        id: `frame_${Date.now().toString(36)}`,
      };
      const frames = [...prev.frames];
      frames.splice(currentFrameIndex + 1, 0, copy);
      return { ...prev, frames };
    });
    setCurrentFrameIndex((i) => i + 1);
  };

  const handleDeleteFrame = () => {
    if (project.frames.length <= 1) return;
    commitProjectChange((prev) => ({
      ...prev,
      frames: prev.frames.filter((_, idx) => idx !== currentFrameIndex),
    }));
    setCurrentFrameIndex((i) => Math.max(0, i - 1));
  };

  const handleChangeFrameDuration = (idx: number, delta: number) => {
    commitProjectChange((prev) => ({
      ...prev,
      frames: prev.frames.map((f, i) =>
        i === idx ? { ...f, duration: Math.max(1, Math.min(24, (f.duration || 1) + delta)) } : f
      ),
    }));
  };

  const handleAddLayer = () => {
    const newId = `layer_${Date.now().toString(36)}`;
    commitProjectChange((prev) => ({
      ...prev,
      layers: [
        ...prev.layers,
        {
          id: newId,
          name: `Layer ${prev.layers.length + 1}`,
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'source-over',
        },
      ],
    }));
    setActiveLayerId(newId);
  };

  const handleUpdateLayer = (id: string, patch: Partial<LayerDef>) => {
    commitProjectChange((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  };

  const handleMoveLayer = (id: string, dir: -1 | 1) => {
    commitProjectChange((prev) => {
      const idx = prev.layers.findIndex((l) => l.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.layers.length) return prev;
      const copy = [...prev.layers];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return { ...prev, layers: copy };
    });
  };

  const handleMergeLayerDown = (id: string) => {
    commitProjectChange((prev) => {
      const idx = prev.layers.findIndex((l) => l.id === id);
      if (idx <= 0) return prev;
      const upper = prev.layers[idx];
      const lower = prev.layers[idx - 1];
      const frames = prev.frames.map((f) => ({
        ...f,
        elementsByLayer: {
          ...f.elementsByLayer,
          [lower.id]: [
            ...(f.elementsByLayer[lower.id] ?? []),
            ...(f.elementsByLayer[upper.id] ?? []),
          ],
        },
      }));
      return {
        ...prev,
        layers: prev.layers.filter((l) => l.id !== upper.id),
        frames,
      };
    });
  };

  const handleDeleteLayer = (id: string) => {
    if (project.layers.length <= 1) return;
    commitProjectChange((prev) => {
      const layers = prev.layers.filter((l) => l.id !== id);
      if (activeLayerId === id) setActiveLayerId(layers[layers.length - 1].id);
      return { ...prev, layers };
    });
  };

  const handleApplyAiFrames = (newFrames: AnimationFrame[], mode: 'append' | 'replace', title?: string) => {
    commitProjectChange((prev) => ({
      ...prev,
      title: mode === 'replace' && title ? title : prev.title,
      frames: mode === 'replace' ? newFrames : [...prev.frames, ...newFrames],
    }));
    setCurrentFrameIndex(mode === 'replace' ? 0 : project.frames.length);
  };

  const handleCompileCodeProject = (compiled: AnimationProject) => {
    commitProjectChange((prev) => ({
      ...compiled,
      id: prev.id,
      audioTracks: prev.audioTracks,
    }));
    setActiveLayerId(compiled.layers[compiled.layers.length - 1]?.id ?? compiled.layers[0]?.id ?? 'layer_1');
    setCurrentFrameIndex(0);
  };

  const handleCreateNewProject = (opts: {
    title: string;
    width: number;
    height: number;
    fps: number;
    paperStyle: PaperStyle;
  }) => {
    const id = `proj_${Date.now().toString(36)}`;
    const fresh: AnimationProject = {
      version: 1,
      id,
      title: opts.title,
      width: opts.width,
      height: opts.height,
      fps: opts.fps,
      paperStyle: opts.paperStyle,
      lineBoilIntensity: 1.0,
      layers: [
        { id: 'layer_bg', name: 'Background', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
        { id: 'layer_ink', name: 'Ink', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
      ],
      frames: [
        { id: 'frame_1', duration: 1, elementsByLayer: {} },
      ],
      audioTracks: [],
      updatedAt: new Date().toISOString(),
    };
    setProject(fresh);
    setHistoryPast([]);
    setHistoryFuture([]);
    setActiveLayerId('layer_ink');
    setCurrentFrameIndex(0);
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="h-screen w-screen flex flex-col bg-[#0D0F14] text-[#F3F4F6] overflow-hidden">
      <TopBar
        t={t}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'en' ? 'ar' : 'en'))}
        projectTitle={project.title}
        onChangeTitle={(title) => setProject((p) => ({ ...p, title }))}
        layoutMode={layoutMode}
        onChangeLayoutMode={setLayoutMode}
        onOpenProjects={() => setShowProjects(true)}
        onOpenNewProject={() => setShowNewProject(true)}
        onSaveProject={handleSaveProject}
        saveState={saveState}
        onOpenExport={() => setShowExport(true)}
      />

      <main className="flex-1 min-h-0 flex overflow-hidden">
        <ToolRail
          t={t}
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          strokeColor={strokeColor}
          onChangeStrokeColor={setStrokeColor}
          fillColor={fillColor}
          onChangeFillColor={setFillColor}
          brushSize={brushSize}
          onChangeBrushSize={setBrushSize}
          roughness={roughness}
          onChangeRoughness={setRoughness}
          canUndo={historyPast.length > 0}
          canRedo={historyFuture.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearFrame={handleClearFrame}
          onImportTraceImage={handleImportTraceImage}
        />

        <CanvasStage
          t={t}
          project={project}
          currentFrameIndex={currentFrameIndex}
          activeLayerId={activeLayerId}
          activeTool={activeTool}
          strokeColor={strokeColor}
          fillColor={fillColor}
          brushSize={brushSize}
          roughness={roughness}
          onionSkin={onionSkin}
          guides={guides}
          isPlaying={isPlaying}
          onAddElements={handleAddElements}
          onReplaceFrameLayerElements={handleReplaceLayerElements}
        />

        <RightPanel
          t={t}
          activeTab={rightTab}
          onTabChange={setRightTab}
          project={project}
          activeLayerId={activeLayerId}
          onSelectLayer={setActiveLayerId}
          onAddLayer={handleAddLayer}
          onUpdateLayer={handleUpdateLayer}
          onMoveLayer={handleMoveLayer}
          onMergeLayerDown={handleMergeLayerDown}
          onDeleteLayer={handleDeleteLayer}
          onionSkin={onionSkin}
          onChangeOnionSkin={setOnionSkin}
          guides={guides}
          onChangeGuides={setGuides}
          onChangePaperStyle={(paperStyle) => commitProjectChange((p) => ({ ...p, paperStyle }))}
          onChangeLineBoil={(lineBoilIntensity) => setProject((p) => ({ ...p, lineBoilIntensity }))}
          onApplyAiFrames={handleApplyAiFrames}
          onCompileCodeProject={handleCompileCodeProject}
        />
      </main>

      <TimelineDock
        t={t}
        project={project}
        currentFrameIndex={currentFrameIndex}
        isPlaying={isPlaying}
        loopPlayback={loopPlayback}
        layoutMode={layoutMode}
        onSelectFrame={setCurrentFrameIndex}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onToggleLoop={() => setLoopPlayback((l) => !l)}
        onChangeFps={(fps) => setProject((p) => ({ ...p, fps }))}
        onAddFrame={handleAddFrame}
        onDuplicateFrame={handleDuplicateFrame}
        onDeleteFrame={handleDeleteFrame}
        onChangeFrameDuration={handleChangeFrameDuration}
        onAddAudioClip={(clip: AudioClip) =>
          commitProjectChange((p) => ({ ...p, audioTracks: [...p.audioTracks, clip] }))
        }
        onUpdateAudioClip={(id, patch) =>
          setProject((p) => ({
            ...p,
            audioTracks: p.audioTracks.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          }))
        }
        onDeleteAudioClip={(id) =>
          commitProjectChange((p) => ({
            ...p,
            audioTracks: p.audioTracks.filter((c) => c.id !== id),
          }))
        }
      />

      {showExport && (
        <ExportModal t={t} project={project} onClose={() => setShowExport(false)} />
      )}

      {showProjects && (
        <ProjectsModal
          t={t}
          onSelectProject={(loaded) => {
            setProject(loaded);
            setHistoryPast([]);
            setHistoryFuture([]);
            setActiveLayerId(loaded.layers[loaded.layers.length - 1]?.id ?? loaded.layers[0]?.id ?? 'layer_1');
            setCurrentFrameIndex(0);
          }}
          onClose={() => setShowProjects(false)}
        />
      )}

      {showNewProject && (
        <NewProjectModal t={t} onCreate={handleCreateNewProject} onClose={() => setShowNewProject(false)} />
      )}
    </div>
  );
}
