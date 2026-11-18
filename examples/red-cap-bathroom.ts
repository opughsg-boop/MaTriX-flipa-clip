// US wordless comedy reel (9:16, 18 s, 30 fps) built with HandDrawnBuilder.
// Style follows the "Red-Cap Blueprint" in .claude/skills/us-stickman-comedy-reels/SKILL.md:
// one white body silhouette, red snapback cap, tiled bathroom, gut-tunnel and bowl-splash close-ups,
// a silent anticipation beat, and a bold English caption.
import { HandDrawnBuilder, easeInOutQuad, easeOutBounce, lerp, oscillate } from '../src/shared/builder';

const FPS = 30;
const DUR = 18;
const W = 1080;
const H = 1920;
const CAP = '#E8221A';
const BODY = '#FFFFFF';
const INK = '#14151A';

const scene = new HandDrawnBuilder({
  id: 'red_cap_bathroom',
  title: 'Red Cap - Bathroom Door Knock',
  width: W,
  height: H,
  fps: FPS,
  paperStyle: 'white',
  lineBoilIntensity: 1.0,
});

const wall = scene.addLayer('Background');
const set = scene.addLayer('Set');
const sketch = scene.addLayer('Sketch');
const ink = scene.addLayer('Ink');
const color = scene.addLayer('Color');
const caption = scene.addLayer('Caption');

// Timeline (seconds). Keep scene beats aligned with the shot table in the skill.
const T = {
  idleEnd: 1.5, // knock, sit, sweat
  strainEnd: 3.4, // strain with squash & stretch
  tunnelEnd: 5.2, // gut tunnel zoom
  silentEnd: 6.1, // anticipation: nothing but room tone
  splashEnd: 8.0, // bowl close-up splashdown
  reliefEnd: 18, // relief, hold to loop
};

type Mood = 'idle' | 'strain' | 'shock' | 'relief';

function drawBathroom(g: any) {
  // dark side pillars + tiled wall
  g.rect(0, 0, W, H, { color: '#2B3A40', fill: '#5B6B73', fillStyle: 'solid', roughness: 0.6 });
  for (let y = 80; y < H; y += 110) g.line(0, y, W, y, { color: '#41525A', width: 2, roughness: 0.8 });
  for (let x = 90; x < W; x += 150) g.line(x, 0, x, H, { color: '#41525A', width: 2, roughness: 0.8 });
  // speckled blue towel on chrome bar
  g.rect(900, 700, 70, 220, { color: '#1D4ED8', fill: '#3B82F6', fillStyle: 'hachure', roughness: 1.2 });
}

function drawToilet(g: any, cx: number, baseY: number, s: number) {
  // tank
  g.rect(cx - 190 * s, baseY - 720 * s, 380 * s, 240 * s, { color: INK, fill: '#EDE7D6', fillStyle: 'solid', roughness: 1.2 });
  // pedestal + contoured bowl
  g.polygon(
    [
      [cx - 90 * s, baseY - 480 * s],
      [cx + 90 * s, baseY - 480 * s],
      [cx + 130 * s, baseY - 40 * s],
      [cx - 130 * s, baseY - 40 * s],
    ],
    { color: INK, fill: '#E6DFC8', fillStyle: 'solid', roughness: 1.4 }
  );
  g.ellipse(cx, baseY - 470 * s, 360 * s, 150 * s, { color: INK, fill: '#F3EEDD', fillStyle: 'solid', roughness: 1.2 });
  g.ellipse(cx, baseY - 470 * s, 290 * s, 100 * s, { color: INK, fill: '#7EC8F0', fillStyle: 'solid', roughness: 1.2 });
}

function drawCharacter(g: any, cx: number, baseY: number, mood: Mood, squash: number) {
  const s = 1;
  const sy = 1 + squash * 0.12; // stretch on strain
  const sx = 1 - squash * 0.08;
  const headY = baseY - 760 * sy;

  // one continuous white silhouette: head, shoulders, bowed arms, thighs
  const outline: Array<[number, number]> = [
    [cx - 95 * sx, headY + 40],
    [cx - 130 * sx, headY + 110],
    [cx - 150 * sx, baseY - 560 * sy],
    [cx - 210 * sx, baseY - 360 * sy],
    [cx - 225 * sx, baseY - 240 * sy],
    [cx - 170 * sx, baseY - 230 * sy],
    [cx - 120 * sx, baseY - 360 * sy],
    [cx - 115 * sx, baseY - 120 * sy],
    [cx - 95 * sx, baseY - 40 * sy],
    [cx + 95 * sx, baseY - 40 * sy],
    [cx + 115 * sx, baseY - 120 * sy],
    [cx + 120 * sx, baseY - 360 * sy],
    [cx + 170 * sx, baseY - 230 * sy],
    [cx + 225 * sx, baseY - 240 * sy],
    [cx + 210 * sx, baseY - 360 * sy],
    [cx + 150 * sx, baseY - 560 * sy],
    [cx + 130 * sx, headY + 110],
    [cx + 95 * sx, headY + 40],
  ];
  g.polygon(outline, { color: INK, fill: BODY, fillStyle: 'solid', roughness: 1.6 });

  // big round eyes near the bridge, pinpoint pupils
  const eyeY = headY + 150;
  for (const dx of [-38, 38]) {
    g.circle(cx + dx * sx, eyeY, 58 * sx, { color: INK, fill: '#FFFFFF', fillStyle: 'solid', roughness: 1.0 });
    g.circle(cx + dx * sx, eyeY, 8, { color: INK, fill: INK, fillStyle: 'solid', roughness: 0.4 });
  }

  // puffed-cheek strain mouth
  if (mood === 'strain' || mood === 'idle') {
    g.polygon(
      [
        [cx - 90 * sx, headY + 240],
        [cx - 30 * sx, headY + 215],
        [cx + 30 * sx, headY + 215],
        [cx + 90 * sx, headY + 240],
      ],
      { color: INK, fill: '#B91C1C', fillStyle: 'solid', roughness: 0.8 }
    );
  } else if (mood === 'shock') {
    g.ellipse(cx, headY + 250, 60, 80, { color: INK, fill: '#7F1D1D', fillStyle: 'solid', roughness: 0.8 });
  } else {
    g.line(cx - 60, headY + 240, cx + 60, headY + 240, { color: INK, width: 5, roughness: 0.8 });
  }

  // red snapback cap with center seam, top button and flat left visor
  g.polygon(
    [
      [cx - 120 * sx, headY - 20],
      [cx - 110 * sx, headY - 130],
      [cx + 110 * sx, headY - 130],
      [cx + 120 * sx, headY - 20],
    ],
    { color: INK, fill: CAP, fillStyle: 'solid', roughness: 1.2 }
  );
  g.line(cx, headY - 130, cx, headY - 20, { color: INK, width: 3, roughness: 0.6 });
  g.circle(cx, headY - 132, 18, { color: INK, fill: INK, fillStyle: 'solid', roughness: 0.4 });
  g.polygon(
    [
      [cx - 130 * sx, headY - 20],
      [cx - 230 * sx, headY + 10],
      [cx - 120 * sx, headY + 30],
    ],
    { color: INK, fill: CAP, fillStyle: 'solid', roughness: 1.2 }
  );
}

function drawSplash(g: any, t: number) {
  const pop = easeOutBounce(clamp01((t - T.silentEnd) / 0.6));
  g.ellipse(W / 2, H / 2 - 80, 900, 900, { color: INK, fill: '#F3EEDD', fillStyle: 'solid', roughness: 1.2 });
  g.ellipse(W / 2, H / 2 - 80, 700, 700, { color: INK, fill: '#7EC8F0', fillStyle: 'solid', roughness: 1.2 });
  // water crown
  const cy = H / 2 - 80 - 60;
  g.polygon(
    [
      [W / 2 - 180 * pop, cy + 30],
      [W / 2 - 120 * pop, cy - 160 * pop],
      [W / 2 - 40 * pop, cy - 40 * pop],
      [W / 2, cy - 220 * pop],
      [W / 2 + 40 * pop, cy - 40 * pop],
      [W / 2 + 120 * pop, cy - 160 * pop],
      [W / 2 + 180 * pop, cy + 30],
    ],
    { color: INK, fill: '#FFFFFF', fillStyle: 'solid', roughness: 1.4 }
  );
  // droplets and ripples
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + t * 2;
    const r = 260 + 40 * oscillate(t + k * 0.1, 2);
    g.circle(W / 2 + Math.cos(a) * r * pop, cy - 200 * pop + Math.sin(a) * 60, 26, {
      color: INK,
      fill: '#FFFFFF',
      fillStyle: 'solid',
      roughness: 0.5,
    });
  }
  g.ellipse(W / 2, cy + 40, 520 * pop + 40, 120 * pop + 20, { color: INK, width: 3, roughness: 1.4 });
}

function drawTunnel(g: any, t: number) {
  // terracotta concentric rings zooming outward + star exit
  g.rect(0, 0, W, H, { color: '#7C2D12', fill: '#B45309', fillStyle: 'solid', roughness: 0.6 });
  for (let k = 0; k < 7; k++) {
    const p = (k + t * 2.2) % 7;
    const rx = 80 + p * 90;
    const ry = rx * 1.35;
    g.ellipse(W / 2, H / 2 + 120, rx * 2, ry * 2, { color: '#7C2D12', width: 3, roughness: 1.8 });
  }
  g.polygon(starPoints(W / 2, H / 2 + 120, 60, 26), { color: INK, fill: INK, fillStyle: 'solid', roughness: 0.6 });
}

function starPoints(cx: number, cy: number, R: number, r: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  return pts;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

const ticks = Math.round(FPS * DUR);
for (let i = 0; i < ticks; i++) {
  const t = i / FPS;
  const f = scene.addFrame(1, `t=${t.toFixed(2)}s`);

  // caption
  f.draw(caption, (g) => {
    g.text(W / 2, 200, 'WHEN SOMEONE KNOCKS ON THE DOOR...', { fontSize: 30, color: INK, bold: true });
  });

  if (t < T.tunnelEnd && t >= T.strainEnd) {
    // gut tunnel
    f.draw(wall, (g) => drawTunnel(g, t));
    continue;
  }

  if (t >= T.silentEnd && t < T.splashEnd) {
    // bowl close-up
    f.draw(wall, (g) => g.rect(0, 0, W, H, { color: '#2B3A40', fill: '#4B5B63', fillStyle: 'solid', roughness: 0.6 }));
    f.draw(sketch, (g) => drawSplash(g, t));
    continue;
  }

  // room
  f.draw(wall, (g) => drawBathroom(g));

  let mood: Mood = 'idle';
  let squash = 0;
  let cx = W / 2;
  let baseY = H - 80;

  if (t < T.idleEnd) {
    mood = 'idle';
    cx += oscillate(t * 4, 1) * 4; // knock jitter
  } else if (t < T.strainEnd) {
    mood = 'strain';
    squash = easeInOutQuad((t - T.idleEnd) / (T.strainEnd - T.idleEnd));
  } else if (t < T.silentEnd) {
    mood = 'shock';
    squash = 0;
  } else {
    mood = 'relief';
    squash = lerp(0, 0.2, clamp01((t - 8.0) / 2));
  }

  f.draw(set, (g) => drawToilet(g, W / 2, baseY, 1.25));
  f.draw(ink, (g) => drawCharacter(g, cx, baseY, mood, squash));

  if (mood === 'relief') {
    f.draw(sketch, (g) => {
      g.text(W / 2, 1330, 'Ahhh.', { fontSize: 64, color: INK, bold: true });
    });
  }
}

export default scene.toProject();
