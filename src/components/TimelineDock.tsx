import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CopyPlus,
  Mic,
  Music,
  Pause,
  Play,
  Plus,
  Repeat,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { renderProjectFrameToCanvas } from '../engine/canvasRenderer';
import { Translations } from '../i18n/translations';
import { AnimationProject, AudioClip } from '../shared/types';

interface TimelineDockProps {
  t: Translations;
  project: AnimationProject;
  currentFrameIndex: number;
  isPlaying: boolean;
  loopPlayback: boolean;
  layoutMode: 'classic' | 'studio';
  onSelectFrame: (idx: number) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onChangeFps: (fps: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: () => void;
  onDeleteFrame: () => void;
  onChangeFrameDuration: (idx: number, delta: number) => void;
  onAddAudioClip: (clip: AudioClip) => void;
  onUpdateAudioClip: (id: string, patch: Partial<AudioClip>) => void;
  onDeleteAudioClip: (id: string) => void;
}

const FrameThumb: React.FC<{ project: AnimationProject; index: number }> = ({ project, index }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = project.frames[index];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    renderProjectFrameToCanvas(canvas, project, index, { includePaper: true });
  }, [project, index, frame]);

  return (
    <canvas
      ref={ref}
      width={project.width}
      height={project.height}
      className="w-full h-full object-contain rounded-sm"
    />
  );
};

async function extractWaveform(arrayBuffer: ArrayBuffer): Promise<{ peaks: number[]; duration: number }> {
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const channel = decoded.getChannelData(0);
    const buckets = 48;
    const step = Math.max(1, Math.floor(channel.length / buckets));
    const peaks: number[] = [];
    for (let i = 0; i < buckets; i++) {
      let max = 0;
      const start = i * step;
      for (let j = 0; j < step && start + j < channel.length; j += 8) {
        const v = Math.abs(channel[start + j]);
        if (v > max) max = v;
      }
      peaks.push(Math.max(0.08, Math.min(1, max)));
    }
    return { peaks, duration: decoded.duration };
  } finally {
    await ctx.close();
  }
}

export const TimelineDock: React.FC<TimelineDockProps> = ({
  t,
  project,
  currentFrameIndex,
  isPlaying,
  loopPlayback,
  layoutMode,
  onSelectFrame,
  onTogglePlay,
  onToggleLoop,
  onChangeFps,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  onChangeFrameDuration,
  onAddAudioClip,
  onUpdateAudioClip,
  onDeleteAudioClip,
}) => {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const totalTicks = project.frames.reduce((acc, f) => acc + Math.max(1, f.duration || 1), 0);
  const totalSeconds = (totalTicks / project.fps).toFixed(1);

  const handleImportAudio = async (file: File) => {
    setAudioError(null);
    try {
      const buf = await file.arrayBuffer();
      const { peaks, duration } = await extractWaveform(buf);
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
      onAddAudioClip({
        id: `aud_${Date.now().toString(36)}`,
        name: file.name,
        dataUrl,
        startFrame: currentFrameIndex,
        durationSeconds: duration,
        volume: 0.9,
        muted: false,
        waveformPeaks: peaks,
      });
    } catch {
      setAudioError('Could not decode audio file.');
    }
  };

  const toggleVoiceRecord = async () => {
    setAudioError(null);
    if (isRecording && recorderRef.current) {
      recorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const buf = await blob.arrayBuffer();
        const { peaks, duration } = await extractWaveform(buf);
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(blob);
        });
        onAddAudioClip({
          id: `aud_${Date.now().toString(36)}`,
          name: `Voiceover ${project.audioTracks.length + 1}`,
          dataUrl,
          startFrame: currentFrameIndex,
          durationSeconds: duration,
          volume: 1.0,
          muted: false,
          waveformPeaks: peaks,
        });
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setAudioError('Microphone access denied or unavailable.');
    }
  };

  return (
    <section className="shrink-0 bg-[#12151C] border-t border-white/8 select-none">
      {/* Playback & Frame Control Strip */}
      <div className="px-4 py-2 border-b border-white/8 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Playback Transport */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectFrame(Math.max(0, currentFrameIndex - 1))}
            className="p-1.5 rounded bg-[#1C202B] hover:bg-[#252A38] text-slate-300 hover:text-white cursor-pointer"
            aria-label="Previous frame"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? t.pause : t.play}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFrame(Math.min(project.frames.length - 1, currentFrameIndex + 1))}
            className="p-1.5 rounded bg-[#1C202B] hover:bg-[#252A38] text-slate-300 hover:text-white cursor-pointer"
            aria-label="Next frame"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleLoop}
            title={t.loopPlayback}
            className={`p-1.5 rounded border text-xs cursor-pointer ${
              loopPlayback
                ? 'bg-[#FF5A36]/15 border-[#FF5A36] text-[#FF5A36]'
                : 'bg-[#1C202B] border-white/8 text-slate-400 hover:text-white'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400 ms-2">
            <span className="font-mono tabular-nums text-white">
              {String(currentFrameIndex + 1).padStart(2, '0')} / {String(project.frames.length).padStart(2, '0')}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{totalSeconds}s</span>
          </div>
        </div>

        {/* Center: FPS & Hold Controls */}
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <label className="flex items-center gap-1.5">
            <span className="text-slate-400">{t.fps}</span>
            <input
              type="number"
              min={1}
              max={60}
              value={project.fps}
              onChange={(e) => onChangeFps(Math.max(1, Math.min(60, Number(e.target.value) || 12)))}
              className="w-12 bg-[#0D0F14] border border-white/10 rounded px-1.5 py-1 text-center font-mono tabular-nums text-white"
            />
          </label>

          <div className="flex items-center gap-1">
            <span className="text-slate-400">{t.holdDuration}</span>
            <button
              type="button"
              onClick={() => onChangeFrameDuration(currentFrameIndex, -1)}
              className="w-6 h-6 rounded bg-[#1C202B] hover:bg-[#252A38] text-slate-200 font-mono cursor-pointer"
            >
              -
            </button>
            <span className="w-7 text-center font-mono tabular-nums text-white">
              {project.frames[currentFrameIndex]?.duration ?? 1}x
            </span>
            <button
              type="button"
              onClick={() => onChangeFrameDuration(currentFrameIndex, 1)}
              className="w-6 h-6 rounded bg-[#1C202B] hover:bg-[#252A38] text-slate-200 font-mono cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Right: Frame Manipulation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onAddFrame}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#1C202B] hover:bg-[#252A38] text-xs font-medium text-slate-200 border border-white/8 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>{t.addFrame}</span>
          </button>

          <button
            type="button"
            onClick={onDuplicateFrame}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#1C202B] hover:bg-[#252A38] text-xs font-medium text-slate-200 border border-white/8 cursor-pointer whitespace-nowrap"
          >
            <CopyPlus className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.duplicateFrame}</span>
          </button>

          <button
            type="button"
            onClick={onDeleteFrame}
            disabled={project.frames.length <= 1}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#1C202B] hover:bg-rose-500/15 disabled:opacity-35 text-xs font-medium text-rose-300 border border-white/8 cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.deleteFrame}</span>
          </button>
        </div>
      </div>

      {/* Horizontal Filmstrip Frames */}
      <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
        {project.frames.map((frame, idx) => {
          const active = idx === currentFrameIndex;
          const hold = Math.max(1, frame.duration || 1);
          const cardWidth = layoutMode === 'studio' ? 76 + (hold - 1) * 28 : 76;
          return (
            <button
              key={frame.id}
              type="button"
              onClick={() => onSelectFrame(idx)}
              style={{ width: `${cardWidth}px` }}
              className={`shrink-0 rounded-md p-1 transition-all cursor-pointer text-start border ${
                active
                  ? 'bg-[#1C202B] border-[#FF5A36]'
                  : 'bg-[#151821] border-white/10 hover:border-white/25'
              }`}
            >
              <div className="h-11 w-full bg-[#0D0F14] rounded-sm overflow-hidden flex items-center justify-center">
                <FrameThumb project={project} index={idx} />
              </div>
              <div className="mt-1 flex items-center justify-between px-0.5 text-[10px] font-mono tabular-nums text-slate-400">
                <span className={active ? 'text-white font-semibold' : ''}>{idx + 1}</span>
                {hold > 1 && <span className="text-[#FF5A36]">{hold}x</span>}
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onAddFrame}
          aria-label={t.addFrame}
          className="shrink-0 w-14 h-[66px] rounded-md border border-dashed border-white/15 hover:border-[#FF5A36] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Studio Mode Audio Tracks Mixer */}
      {layoutMode === 'studio' && (
        <div className="px-4 py-2 border-t border-white/8 bg-[#0E1016] space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <Music className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>{t.audioTracks}</span>
              {audioError && <span className="text-rose-400 text-[11px]">{audioError}</span>}
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportAudio(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className="px-2.5 py-1 rounded bg-[#1C202B] hover:bg-[#252A38] text-[11px] text-slate-200 border border-white/8 cursor-pointer whitespace-nowrap"
              >
                {t.importAudio}
              </button>
              <button
                type="button"
                onClick={toggleVoiceRecord}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border cursor-pointer whitespace-nowrap ${
                  isRecording
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-[#1C202B] hover:bg-[#252A38] border-white/8 text-slate-200'
                }`}
              >
                {isRecording ? <Square className="w-3 h-3" /> : <Mic className="w-3 h-3 text-[#FF5A36]" />}
                <span>{isRecording ? t.stopRecording : t.recordVoice}</span>
              </button>
            </div>
          </div>

          {project.audioTracks.length > 0 && (
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {project.audioTracks.map((clip) => (
                <div
                  key={clip.id}
                  className="flex items-center justify-between gap-3 bg-[#151821] border border-white/8 rounded px-2.5 py-1.5 text-xs"
                >
                  <span className="truncate max-w-[140px] text-slate-200 font-medium">{clip.name}</span>

                  {/* Mini Waveform */}
                  <div className="flex-1 flex items-center gap-0.5 h-5 overflow-hidden">
                    {clip.waveformPeaks.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-[#FF5A36]/75 rounded-xs"
                        style={{ height: `${Math.round(p * 100)}%` }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateAudioClip(clip.id, { muted: !clip.muted })}
                      className="text-slate-300 hover:text-white cursor-pointer"
                    >
                      {clip.muted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={clip.volume}
                      onChange={(e) => onUpdateAudioClip(clip.id, { volume: Number(e.target.value) })}
                      className="w-16 accent-[#FF5A36]"
                    />
                    <button
                      type="button"
                      onClick={() => onDeleteAudioClip(clip.id)}
                      className="text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
