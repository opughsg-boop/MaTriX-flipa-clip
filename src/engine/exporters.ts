import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import JSZip from 'jszip';
import { AnimationProject } from '../shared/types';
import { renderProjectFrameToCanvas } from './canvasRenderer';

export type BrowserExportFormat = 'video' | 'gif' | 'png-zip' | 'json';

export function expandFrameSchedule(project: AnimationProject): number[] {
  const schedule: number[] = [];
  project.frames.forEach((f, idx) => {
    const ticks = Math.max(1, f.duration || 1);
    for (let t = 0; t < ticks; t++) {
      schedule.push(idx);
    }
  });
  return schedule;
}

export async function exportProjectAsGif(
  project: AnimationProject,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const schedule = expandFrameSchedule(project);
  const canvas = document.createElement('canvas');
  canvas.width = project.width;
  canvas.height = project.height;
  const ctx = canvas.getContext('2d')!;
  const gif = GIFEncoder();
  const delayMs = Math.max(20, Math.round(1000 / project.fps));

  for (let i = 0; i < schedule.length; i++) {
    renderProjectFrameToCanvas(canvas, project, schedule[i], { includePaper: true });
    const imgData = ctx.getImageData(0, 0, project.width, project.height).data;
    const palette = quantize(imgData, 256);
    const index = applyPalette(imgData, palette);
    gif.writeFrame(index, project.width, project.height, {
      palette,
      delay: delayMs,
      repeat: i === 0 ? 0 : undefined,
    });
    onProgress?.(i + 1, schedule.length);
    await new Promise((r) => setTimeout(r, 0));
  }

  gif.finish();
  const bytes = gif.bytes();
  return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
}

export async function exportProjectAsPngZip(
  project: AnimationProject,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const schedule = expandFrameSchedule(project);
  const canvas = document.createElement('canvas');
  canvas.width = project.width;
  canvas.height = project.height;
  const zip = new JSZip();

  for (let i = 0; i < schedule.length; i++) {
    renderProjectFrameToCanvas(canvas, project, schedule[i], {
      includePaper: project.paperStyle !== 'transparent',
    });
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encode failed'))), 'image/png');
    });
    const name = `frame_${String(i + 1).padStart(4, '0')}.png`;
    zip.file(name, blob);
    onProgress?.(i + 1, schedule.length);
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function exportProjectAsVideo(
  project: AnimationProject,
  onProgress?: (current: number, total: number) => void
): Promise<{ blob: Blob; extension: 'mp4' | 'webm' }> {
  const schedule = expandFrameSchedule(project);
  const canvas = document.createElement('canvas');
  canvas.width = project.width;
  canvas.height = project.height;

  const mimeCandidates = [
    { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' as const },
    { mime: 'video/mp4', ext: 'mp4' as const },
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' as const },
    { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' as const },
    { mime: 'video/webm', ext: 'webm' as const },
  ];

  const chosen = mimeCandidates.find((c) => MediaRecorder.isTypeSupported(c.mime)) ?? {
    mime: 'video/webm',
    ext: 'webm' as const,
  };

  const canvasStream = canvas.captureStream(project.fps);
  const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

  // Mix project audio tracks via Web Audio API if present
  let audioCtx: AudioContext | null = null;
  const activeClips = project.audioTracks.filter((a) => !a.muted && a.dataUrl);
  if (activeClips.length > 0) {
    audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    for (const clip of activeClips) {
      try {
        const res = await fetch(clip.dataUrl);
        const buf = await res.arrayBuffer();
        const decoded = await audioCtx.decodeAudioData(buf);
        const src = audioCtx.createBufferSource();
        src.buffer = decoded;
        const gain = audioCtx.createGain();
        gain.gain.value = clip.volume;
        src.connect(gain);
        gain.connect(dest);
        const delaySec = clip.startFrame / project.fps;
        src.start(audioCtx.currentTime + delaySec);
      } catch {
        // Skip undecodable audio clip gracefully
      }
    }
    tracks.push(...dest.stream.getAudioTracks());
  }

  const combinedStream = new MediaStream(tracks);
  const recorder = new MediaRecorder(combinedStream, {
    mimeType: chosen.mime,
    videoBitsPerSecond: 6_000_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();
  const frameIntervalMs = 1000 / project.fps;

  for (let i = 0; i < schedule.length; i++) {
    renderProjectFrameToCanvas(canvas, project, schedule[i], { includePaper: true });
    onProgress?.(i + 1, schedule.length);
    await new Promise((r) => setTimeout(r, frameIntervalMs));
  }

  recorder.stop();
  await stopped;
  if (audioCtx) {
    await audioCtx.close();
  }

  return {
    blob: new Blob(chunks, { type: chosen.mime }),
    extension: chosen.ext,
  };
}
