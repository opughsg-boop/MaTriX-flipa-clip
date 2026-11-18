// Wordless reel "Popcorn Panic" (9:16, 18 s, 30 fps), built with HandDrawnBuilder.
// Pair with: python3 scripts/foley.py --story popcorn --out exports/popcorn-sfx.wav
// Beats (seconds): 0-1.2 idle, 1.2-5.0 microwave hums and kernels pop faster,
// 5.0-5.8 silent anticipation, 5.8 bag bursts, 6-11.5 eating with crunches,
// 11.5-13.5 soda fizz, 13.5-18 satisfied ending.
import { HandDrawnBuilder, easeOutBounce, lerp, oscillate } from '../src/shared/builder';

const FPS = 30;
const DUR = 18;
const W = 1080;
const H = 1920;
const INK = '#14151A';
const SKIN = '#FFFFFF';
const SHADE = '#CBD5E1';
const BAG_RED = '#DC2626';
const CORN = '#FDE68A';
const CORN_DARK = '#D97706';

const scene = new HandDrawnBuilder({
  id: 'popcorn_panic',
  title: 'Popcorn Panic',
  width: W,
  height: H,
  fps: FPS,
  paperStyle: 'white',
  lineBoilIntensity: 1.0,
});

const wall = scene.addLayer('Background');
const set = scene.addLayer('Set');
const actor = scene.addLayer('Character');
const fx = scene.addLayer('FX');
const caption = scene.addLayer('Caption');

// Deterministic pseudo-random kernels so every frame is repeatable.
function rnd(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function drawKitchen(g: any, t: number) {
  // warm wall with cabinet band and counter
  g.rect(0, 0, W, H, { color: INK, fill: '#FDE7C2', fillStyle: 'solid', roughness: 0.6 });
  g.rect(0, 180, W, 360, { color: INK, fill: '#A16207', fillStyle: 'solid', roughness: 0.9 });
  for (let x = 60; x < W; x += 220) g.line(x, 180, x, 540, { color: '#78350F', width: 3, roughness: 0.8 });
  g.rect(0, 1180, W, 90, { color: INK, fill: '#6B7280', fillStyle: 'solid', roughness: 0.8 });
  g.rect(0, 1270, W, 650, { color: INK, fill: '#FCD9A2', fillStyle: 'solid', roughness: 0.8 });
  // light glow pulse while the microwave runs
  const glow = t > 1.2 && t < 5 ? 0.25 + 0.15 * oscillate(t * 3, 1) : 0.05;
  g.ellipse(W / 2, 260, 900, 260, { color: '#FDE68A', fill: '#FFFBEB', fillStyle: 'solid', opacity: glow, roughness: 2 });
}

function drawMicrowave(g: any, t: number, bump: number) {
  const x = 640 - bump * 6;
  const y = 980;
  g.rect(x, y, 320, 200, { color: INK, fill: '#D1D5DB', fillStyle: 'solid', roughness: 1.0 });
  const on = t > 1.2 && t < 5.0;
  g.rect(x + 24, y + 30, 220, 140, { color: INK, fill: on ? '#FDBA74' : '#1F2937', fillStyle: 'solid', roughness: 0.9 });
  g.rect(x + 262, y + 30, 36, 60, { color: INK, fill: '#374151', fillStyle: 'solid', roughness: 0.6 });
  g.circle(x + 280, y + 120, 18, { color: INK, fill: on ? '#EF4444' : '#9CA3AF', fillStyle: 'solid', roughness: 0.4 });
  // popcorn bag rotating inside
  const spin = on ? (t * 3) % 1 : 0;
  g.polygon(
    [
      [x + 110 - 40 * spin, y + 90],
      [x + 150 + 40 * spin, y + 90],
      [x + 160, y + 160],
      [x + 100, y + 160],
    ],
    { color: INK, fill: BAG_RED, fillStyle: 'solid', roughness: 0.9 }
  );
}

function drawPopcornBowl(g: any, cx: number, cy: number, fill: number) {
  g.ellipse(cx, cy, 380, 150, { color: INK, fill: '#F8FAFC', fillStyle: 'solid', roughness: 1.2 });
  g.ellipse(cx, cy - 20, 320, 110, { color: INK, fill: CORN_DARK, fillStyle: 'solid', roughness: 1.2 });
  const n = Math.round(fill * 26);
  for (let k = 0; k < n; k++) {
    const px = cx + (rnd(k) - 0.5) * 300;
    const py = cy - 60 - rnd(k + 9) * 80;
    g.circle(px, py, 46 + rnd(k + 3) * 16, { color: INK, fill: CORN, fillStyle: 'solid', roughness: 0.8 });
  }
}

function drawCharacter(g: any, cx: number, baseY: number, mood: 'idle' | 'startle' | 'eat' | 'happy', bob: number, squash: number) {
  const sy = 1 + squash * 0.1;
  const sx = 1 - squash * 0.07;
  const headY = baseY - 760 * sy + bob;

  const outline: Array<[number, number]> = [
    [cx - 95 * sx, headY + 40], [cx - 130 * sx, headY + 110], [cx - 150 * sx, baseY - 560 * sy],
    [cx - 210 * sx, baseY - 360 * sy], [cx - 225 * sx, baseY - 240 * sy], [cx - 170 * sx, baseY - 230 * sy],
    [cx - 120 * sx, baseY - 360 * sy], [cx - 115 * sx, baseY - 120 * sy], [cx - 95 * sx, baseY - 40 * sy],
    [cx + 95 * sx, baseY - 40 * sy], [cx + 115 * sx, baseY - 120 * sy], [cx + 120 * sx, baseY - 360 * sy],
    [cx + 170 * sx, baseY - 230 * sy], [cx + 225 * sx, baseY - 240 * sy], [cx + 210 * sx, baseY - 360 * sy],
    [cx + 150 * sx, baseY - 560 * sy], [cx + 130 * sx, headY + 110], [cx + 95 * sx, headY + 40],
  ];
  g.polygon(outline, { color: INK, fill: SKIN, fillStyle: 'solid', roughness: 1.6 });

  // cel shadow on the left side of torso and under the head (2-tone shading)
  g.polygon(
    [
      [cx - 110 * sx, headY + 150], [cx - 40 * sx, headY + 150], [cx - 55 * sx, baseY - 60],
      [cx - 110 * sx, baseY - 60], [cx - 118 * sx, baseY - 360 * sy],
    ],
    { color: INK, fill: SHADE, fillStyle: 'solid', roughness: 1.2 }
  );
  g.polygon(
    [
      [cx - 95 * sx, headY + 40], [cx + 95 * sx, headY + 40], [cx + 130 * sx, headY + 110],
      [cx - 130 * sx, headY + 110],
    ],
    { color: INK, fill: '#F1F5F9', fillStyle: 'solid', roughness: 1.0 }
  );

  // big round eyes near the bridge
  const eyeY = headY + 150;
  if (mood === 'happy') {
    for (const dx of [-38, 38]) g.line(cx + dx - 26, eyeY, cx + dx + 26, eyeY - 18, { color: INK, width: 6, roughness: 0.6 });
  } else {
    for (const dx of [-38, 38]) {
      g.circle(cx + dx * sx, eyeY, 58 * sx, { color: INK, fill: '#FFFFFF', fillStyle: 'solid', roughness: 1.0 });
      g.circle(cx + dx * sx, eyeY, 8, { color: INK, fill: INK, fillStyle: 'solid', roughness: 0.4 });
    }
  }

  // mouth
  if (mood === 'startle') {
    g.ellipse(cx, headY + 250, 60, 80, { color: INK, fill: '#7F1D1D', fillStyle: 'solid', roughness: 0.8 });
  } else if (mood === 'eat') {
    g.ellipse(cx, headY + 240, 70, 46 + 20 * oscillate(bob * 0.1, 1), { color: INK, fill: '#7F1D1D', fillStyle: 'solid', roughness: 0.8 });
  } else if (mood === 'happy') {
    g.polygon([[cx - 80, headY + 230], [cx + 80, headY + 230], [cx, headY + 290]], { color: INK, fill: '#B91C1C', fillStyle: 'solid', roughness: 0.8 });
  } else {
    g.line(cx - 60, headY + 240, cx + 60, headY + 240, { color: INK, width: 5, roughness: 0.8 });
  }

  // blush for the happy ending
  if (mood === 'happy') {
    g.ellipse(cx - 110, headY + 220, 50, 26, { color: INK, fill: '#FCA5A5', fillStyle: 'solid', opacity: 0.8, roughness: 0.9 });
    g.ellipse(cx + 110, headY + 220, 50, 26, { color: INK, fill: '#FCA5A5', fillStyle: 'solid', opacity: 0.8, roughness: 0.9 });
  }

  // popcorn-bag hat for brand fun: red snapback
  g.polygon(
    [[cx - 120 * sx, headY - 20], [cx - 110 * sx, headY - 130], [cx + 110 * sx, headY - 130], [cx + 120 * sx, headY - 20]],
    { color: INK, fill: BAG_RED, fillStyle: 'solid', roughness: 1.2 }
  );
  g.polygon(
    [[cx - 130 * sx, headY - 20], [cx - 230 * sx, headY + 10], [cx - 120 * sx, headY + 30]],
    { color: INK, fill: BAG_RED, fillStyle: 'solid', roughness: 1.2 }
  );
}

// Kernels flying out of the bag at t >= 5.8 (ballistic arcs).
function drawBurst(g: any, t: number) {
  const age = t - 5.8;
  for (let k = 0; k < 26; k++) {
    const life = 2.6 + rnd(k) * 0.8;
    const a = age * 1.0;
    if (a < 0 || a > life) continue;
    const vx = (rnd(k + 40) - 0.5) * 700;
    const vy = -(700 + rnd(k + 80) * 500);
    const x = 700 + vx * a;
    const y = 1000 + vy * a + 0.5 * 1500 * a * a;
    if (y > 1600) continue;
    g.circle(x, y, 44 + rnd(k + 5) * 14, { color: INK, fill: CORN, fillStyle: 'solid', roughness: 0.8 });
  }
}

const ticks = Math.round(FPS * DUR);
for (let i = 0; i < ticks; i++) {
  const t = i / FPS;
  const f = scene.addFrame(1, `t=${t.toFixed(2)}s`);

  f.draw(wall, (g) => drawKitchen(g, t));

  const bump = t > 5.8 && t < 6.2 ? (1 - (t - 5.8) / 0.4) : 0;
  f.draw(set, (g) => {
    drawMicrowave(g, t, bump);
    drawPopcornBowl(g, 700, 1700, t < 5.8 ? 0 : clamp01((t - 6.0) / 2.0));
  });

  // caption
  f.draw(caption, (g) => {
    if (t < 5.8) g.text(W / 2, 200, 'THE POPCORN KNOWS WHAT YOU DID', { fontSize: 30, color: INK, bold: true });
    else if (t >= 13.5) g.text(W / 2, 200, 'PLUMP, CRUNCHY, UNBOTHERED', { fontSize: 30, color: INK, bold: true });
  });

  let mood: 'idle' | 'startle' | 'eat' | 'happy' = 'idle';
  let squash = 0;
  let bob = 0;
  if (t < 5.8) {
    mood = 'idle';
    bob = oscillate(t * 1.2, 1) * 6;
  } else if (t < 8.0) {
    mood = 'startle';
    squash = easeOutBounce(clamp01((t - 5.8) / 0.5)) * 0.6;
  } else if (t < 13.5) {
    mood = 'eat';
    bob = Math.abs(Math.sin(((t - 8.0) * Math.PI) / 0.85)) * -18;
  } else {
    mood = 'happy';
    bob = oscillate(t * 1.5, 1) * 6;
  }

  f.draw(actor, (g) => drawCharacter(g, 380, 1900, mood, bob, squash));
  if (t >= 5.8 && t < 8.0) f.draw(fx, (g) => drawBurst(g, t));
}

export default scene.toProject();
