// Wordless reel "Ice-Cube Tray" (9:16, 18 s, 30 fps), built with HandDrawnBuilder.
// Pair with: python3 scripts/foley.py --story ice --out exports/ice-sfx.wav
// Beats (s): 0-1.5 idle, 1.5-4.5 cubes drop one by one (tink each), 4.5-5.5 water pours,
// 5.5-6.0 silent beat, 6.0-8.5 first sip, 8.5-11 satisfied rattle, 11-18 happy ending.
import { HandDrawnBuilder, easeOutBounce, lerp, oscillate } from '../src/shared/builder';

const FPS = 30, DUR = 18, W = 1080, H = 1920;
const INK = '#14151A', SKIN = '#FFFFFF', SHADE = '#CBD5E1', CAP = '#2563EB';
const GLASS = '#DBEAFE', WATER = '#60A5FA', ICE = '#E0F2FE';
const GX = 700, GY = 1560, GW = 240, GH = 320; // glass center-x, bottom-y, width, height

const scene = new HandDrawnBuilder({ id: 'ice_cube_tray', title: 'Ice-Cube Tray', width: W, height: H, fps: FPS, paperStyle: 'white', lineBoilIntensity: 1.0 });
const wall = scene.addLayer('Background');
const set = scene.addLayer('Set');
const actor = scene.addLayer('Character');
const fx = scene.addLayer('FX');
const caption = scene.addLayer('Caption');

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// cube k lands in the glass at this time (seconds); cubes stack up from the glass bottom
const DROPS = [1.8, 2.5, 3.2, 3.9];
const WATER_FROM = 4.5, WATER_TO = 5.5;

function drawKitchen(g: any) {
  g.rect(0, 0, W, H, { color: INK, fill: '#E0F2FE', fillStyle: 'solid', roughness: 0.6 });
  for (let x = 60; x < W; x += 180) g.line(x, 0, x, 1150, { color: '#BAE6FD', width: 3, roughness: 0.8 });
  g.rect(0, 180, W, 300, { color: INK, fill: '#0EA5E9', fillStyle: 'solid', roughness: 0.9 });
  g.rect(0, 1180, W, 90, { color: INK, fill: '#94A3B8', fillStyle: 'solid', roughness: 0.8 });
  g.rect(0, 1270, W, 650, { color: INK, fill: '#F1F5F9', fillStyle: 'solid', roughness: 0.8 });
}

function drawTray(g: any, t: number) {
  // ice tray on the counter, emptier as cubes leave it
  const left = DROPS.filter((d) => t >= d).length;
  g.rect(150, 1100, 380, 80, { color: INK, fill: '#CBD5E1', fillStyle: 'solid', roughness: 1.0 });
  for (let k = 0; k < 6; k++) {
    if (k < 6 - left) g.rect(170 + k * 60, 1110, 46, 52, { color: INK, fill: ICE, fillStyle: 'solid', roughness: 0.8 });
  }
}

function drawGlass(g: any, t: number) {
  const level = clamp01((t - WATER_FROM) / (WATER_TO - WATER_FROM));
  const top = GY - GH;
  g.polygon([[GX - GW / 2, top], [GX + GW / 2, top], [GX + GW / 2 - 24, GY], [GX - GW / 2 + 24, GY]], { color: INK, fill: GLASS, fillStyle: 'solid', roughness: 1.0 });
  if (level > 0) {
    const h = GH * 0.7 * level;
    const wy = GY - h;
    g.polygon([[GX - GW / 2 + 8 + (GW - 16) * 0 , wy], [GX + GW / 2 - 8, wy], [GX + GW / 2 - 28, GY - 8], [GX - GW / 2 + 28, GY - 8]], { color: INK, fill: WATER, fillStyle: 'solid', roughness: 0.9 });
  }
  // cubes resting in the glass
  for (let k = 0; k < DROPS.length; k++) {
    if (t < DROPS[k]) continue;
    const landed = clamp01((t - DROPS[k]) / 0.25);
    const y = lerp(GY - 800, GY - 70 - k * 60, easeOutBounce(landed));
    drawCube(g, GX + (k - 1.5) * 50, y, 0.1 * (k % 2 ? 1 : -1) * landed);
  }
}

function drawCube(g: any, cx: number, cy: number, tilt: number) {
  const s = 52;
  const c = Math.cos(tilt), sn = Math.sin(tilt);
  const p = (x: number, y: number): [number, number] => [cx + x * c - y * sn, cy + x * sn + y * c];
  g.polygon([p(-s / 2, -s / 2), p(s / 2, -s / 2), p(s / 2, s / 2), p(-s / 2, s / 2)], { color: INK, fill: ICE, fillStyle: 'solid', roughness: 0.7 });
  g.polygon([p(-s / 2, -s / 2), p(0, -s / 2 - 10), p(s / 2, -s / 2), p(0, -s / 2 + 8)], { color: INK, fill: '#FFFFFF', fillStyle: 'solid', roughness: 0.4 });
}

function drawCharacter(g: any, cx: number, baseY: number, mood: 'idle' | 'sip' | 'happy' | 'blink', bob: number, squash: number) {
  const sy = 1 + squash * 0.08, sx = 1 - squash * 0.05;
  const headY = baseY - 760 * sy + bob;
  g.polygon([
    [cx - 95 * sx, headY + 40], [cx - 130 * sx, headY + 110], [cx - 150 * sx, baseY - 560 * sy], [cx - 210 * sx, baseY - 360 * sy],
    [cx - 225 * sx, baseY - 240 * sy], [cx - 170 * sx, baseY - 230 * sy], [cx - 120 * sx, baseY - 360 * sy], [cx - 115 * sx, baseY - 120 * sy],
    [cx - 95 * sx, baseY - 40 * sy], [cx + 95 * sx, baseY - 40 * sy], [cx + 115 * sx, baseY - 120 * sy], [cx + 120 * sx, baseY - 360 * sy],
    [cx + 170 * sx, baseY - 230 * sy], [cx + 225 * sx, baseY - 240 * sy], [cx + 210 * sx, baseY - 360 * sy], [cx + 150 * sx, baseY - 560 * sy],
    [cx + 130 * sx, headY + 110], [cx + 95 * sx, headY + 40],
  ], { color: INK, fill: SKIN, fillStyle: 'solid', roughness: 1.6 });
  g.polygon([[cx - 110 * sx, headY + 150], [cx - 40 * sx, headY + 150], [cx - 55 * sx, baseY - 60], [cx - 110 * sx, baseY - 60]], { color: INK, fill: SHADE, fillStyle: 'solid', roughness: 1.2 });
  const eyeY = headY + 150;
  if (mood === 'happy') {
    for (const dx of [-38, 38]) g.line(cx + dx - 26, eyeY, cx + dx + 26, eyeY - 18, { color: INK, width: 6, roughness: 0.6 });
  } else if (mood === 'blink') {
    for (const dx of [-38, 38]) g.line(cx + dx - 26, eyeY, cx + dx + 26, eyeY, { color: INK, width: 6, roughness: 0.6 });
  } else {
    for (const dx of [-38, 38]) {
      g.circle(cx + dx * sx, eyeY, 58 * sx, { color: INK, fill: '#FFFFFF', fillStyle: 'solid', roughness: 1.0 });
      g.circle(cx + dx * sx, eyeY, 8, { color: INK, fill: INK, fillStyle: 'solid', roughness: 0.4 });
    }
  }
  if (mood === 'sip') g.ellipse(cx, headY + 240, 56, 40, { color: INK, fill: '#7F1D1D', fillStyle: 'solid', roughness: 0.8 });
  else if (mood === 'happy') g.polygon([[cx - 80, headY + 230], [cx + 80, headY + 230], [cx, headY + 290]], { color: INK, fill: '#B91C1C', fillStyle: 'solid', roughness: 0.8 });
  else g.line(cx - 60, headY + 240, cx + 60, headY + 240, { color: INK, width: 5, roughness: 0.8 });
  g.polygon([[cx - 120 * sx, headY - 20], [cx - 110 * sx, headY - 130], [cx + 110 * sx, headY - 130], [cx + 120 * sx, headY - 20]], { color: INK, fill: CAP, fillStyle: 'solid', roughness: 1.2 });
  g.polygon([[cx - 130 * sx, headY - 20], [cx - 230 * sx, headY + 10], [cx - 120 * sx, headY + 30]], { color: INK, fill: CAP, fillStyle: 'solid', roughness: 1.2 });
}

const ticks = Math.round(FPS * DUR);
for (let i = 0; i < ticks; i++) {
  const t = i / FPS;
  const f = scene.addFrame(1, `t=${t.toFixed(2)}s`);
  f.draw(wall, (g) => drawKitchen(g));
  f.draw(set, (g) => { drawTray(g, t); drawGlass(g, t); });
  f.draw(caption, (g) => {
    if (t < 6.0) g.text(W / 2, 200, 'WHEN THE ICE TRAY IS ALMOST FULL', { fontSize: 30, color: INK, bold: true });
    else if (t >= 11.0) g.text(W / 2, 200, 'ICE, ICE, PERFECTLY COLD', { fontSize: 30, color: INK, bold: true });
  });

  let mood: 'idle' | 'sip' | 'happy' | 'blink' = 'idle';
  let bob = oscillate(t * 1.2, 1) * 6, squash = 0;
  // small startle squash on each cube landing
  for (const d of DROPS) if (t >= d && t < d + 0.2) squash = Math.max(squash, 0.6 * (1 - (t - d) / 0.2));
  if (t >= 6.0 && t < 8.5) { mood = 'sip'; bob = -Math.abs(Math.sin(((t - 6.0) * Math.PI) / 1.0)) * 18; }
  else if (t >= 11.0) { mood = 'happy'; bob = oscillate(t * 1.5, 1) * 6; }
  else if (Math.abs(t - 3.0) < 0.1) mood = 'blink';
  f.draw(actor, (g) => drawCharacter(g, 380, 1900, mood, bob, squash));
}

export default scene.toProject();
