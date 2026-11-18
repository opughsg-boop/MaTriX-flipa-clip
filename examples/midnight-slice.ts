// Wordless reel "Midnight Slice" (9:16, 40 s, 30 fps), original story built with HandDrawnBuilder.
// Pair with: python3 scripts/foley.py --story pizza --out exports/pizza-sfx.wav
// Beats (s): 0-7 kitchen sneak, 3 fridge opens | 7-13 slice and cheese pull |
// 13-17 silent beat | 17-24 floor squeaks, roommate appears | 24-31 hallway chase | 31-40 shared last slice.
import { HandDrawnBuilder, easeOutBounce, lerp, oscillate } from '../src/shared/builder';

const FPS = 30, DUR = 40, W = 1080, H = 1920;
const INK = '#14151A', SKIN = '#FFFFFF', SHADE = '#CBD5E1';
const BEANIE = '#16A34A', HOODIE = '#F59E0B', CHEESE = '#FEF08A', CRUST = '#B45309', SAUCE = '#DC2626';

const scene = new HandDrawnBuilder({ id: 'midnight_slice', title: 'Midnight Slice', width: W, height: H, fps: FPS, paperStyle: 'white', lineBoilIntensity: 1.0 });
const bg = scene.addLayer('Background');
const set = scene.addLayer('Set');
const actor = scene.addLayer('Character');
const fx = scene.addLayer('FX');
const caption = scene.addLayer('Caption');

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

function person(g: any, cx: number, baseY: number, cap: string, mood: string, bob: number, squash: number, facing: number, scale = 1) {
  const sc = scale, sy = 1 + squash * 0.08, sx = 1 - squash * 0.05;
  const headY = baseY - 760 * sc * sy + bob;
  const P = (x: number, y: number): [number, number] => [cx + x * sc * sx * facing, y];
  g.polygon([
    P(-95, headY + 40), P(-130, headY + 110), P(-150, baseY - 560 * sc), P(-210, baseY - 360 * sc), P(-225, baseY - 240 * sc),
    P(-170, baseY - 230 * sc), P(-120, baseY - 360 * sc), P(-115, baseY - 120 * sc), P(-95, baseY - 40 * sc), P(95, baseY - 40 * sc),
    P(115, baseY - 120 * sc), P(120, baseY - 360 * sc), P(170, baseY - 230 * sc), P(225, baseY - 240 * sc), P(210, baseY - 360 * sc),
    P(150, baseY - 560 * sc), P(130, headY + 110), P(95, headY + 40),
  ], { color: INK, fill: SKIN, fillStyle: 'solid', roughness: 1.6 });
  g.polygon([P(-110, headY + 150), P(-40, headY + 150), P(-55, baseY - 60), P(-110, baseY - 60)], { color: INK, fill: SHADE, fillStyle: 'solid', roughness: 1.2 });
  const eyeY = headY + 150;
  const eyes = (r: number) => { for (const dx of [-38, 38]) { g.circle(cx + dx * sc * facing, eyeY, r * sc, { color: INK, fill: '#FFFFFF', fillStyle: 'solid', roughness: 1.0 }); g.circle(cx + dx * sc * facing, eyeY, 8 * sc, { color: INK, fill: INK, fillStyle: 'solid', roughness: 0.4 }); } };
  if (mood === 'happy') { for (const dx of [-38, 38]) g.line(cx + dx * sc - 26, eyeY, cx + dx * sc + 26, eyeY - 18, { color: INK, width: 6, roughness: 0.6 }); }
  else if (mood === 'shock') eyes(72);
  else if (mood === 'sneak') { for (const dx of [-38, 38]) g.line(cx + dx * sc - 26, eyeY, cx + dx * sc + 26, eyeY, { color: INK, width: 6, roughness: 0.6 }); }
  else eyes(58);
  if (mood === 'shock') g.ellipse(cx, headY + 250, 60 * sc, 80 * sc, { color: INK, fill: '#7F1D1D', fillStyle: 'solid', roughness: 0.8 });
  else if (mood === 'chew') g.ellipse(cx, headY + 240, 56 * sc, 36 * sc, { color: INK, fill: '#7F1D1D', fillStyle: 'solid', roughness: 0.8 });
  else if (mood === 'happy') g.polygon([[cx - 80 * sc, headY + 230], [cx + 80 * sc, headY + 230], [cx, headY + 290]], { color: INK, fill: '#B91C1C', fillStyle: 'solid', roughness: 0.8 });
  else g.line(cx - 60 * sc, headY + 240, cx + 60 * sc, headY + 240, { color: INK, width: 5, roughness: 0.8 });
  // beanie
  g.polygon([[cx - 120 * sc, headY - 20], [cx - 110 * sc, headY - 130], [cx + 110 * sc, headY - 130], [cx + 120 * sc, headY - 20]], { color: INK, fill: cap, fillStyle: 'solid', roughness: 1.2 });
}

function fridge(g: any, open: number) {
  g.rect(60, 880, 300, 640, { color: INK, fill: '#E5E7EB', fillStyle: 'solid', roughness: 1.0 });
  g.rect(60 + 300 * open * 0.4, 880, 300 - 300 * open * 0.4, 640, { color: INK, fill: '#F9FAFB', fillStyle: 'solid', roughness: 1.0 });
  g.rect(260, 1000, 30, 90, { color: INK, fill: '#9CA3AF', fillStyle: 'solid', roughness: 0.6 });
  if (open > 0.2) g.rect(120, 960, 120, 160, { color: INK, fill: '#A3E635', fillStyle: 'solid', roughness: 0.8 });
}

function pizza(g: any, lift: number) {
  g.rect(560, 1180, 420, 22, { color: INK, fill: '#9CA3AF', fillStyle: 'solid', roughness: 0.8 });
  g.rect(560, 1080, 420, 100, { color: INK, fill: '#FDE68A', fillStyle: 'solid', roughness: 0.9 });
  const tip = [620, 1080 - 120 * lift];
  g.polygon([[600, 1080], [760, 1080], tip as [number, number]], { color: INK, fill: CHEESE, fillStyle: 'solid', roughness: 0.8 });
  g.polygon([[600, 1080], [760, 1080], [tip[0] + 10, tip[1] + 8]], { color: INK, fill: SAUCE, fillStyle: 'solid', roughness: 0.6 });
  // cheese string stretching between the slice and the box
  const pts: Array<[number, number]> = [];
  for (let k = 0; k <= 8; k++) pts.push([tip[0] + (680 - tip[0]) * (k / 8) + (k % 2 ? 6 : -6), tip[1] + (1080 - tip[1]) * (k / 8)]);
  if (lift > 0.3) g.stroke(pts, { color: '#FDE047', width: 8, roughness: 1.2 });
}

const ticks = Math.round(FPS * DUR);
for (let i = 0; i < ticks; i++) {
  const t = i / FPS;
  const f = scene.addFrame(1, `t=${t.toFixed(2)}s`);

  // ---- background per scene ----
  f.draw(bg, (g) => {
    if (t < 7) { g.rect(0, 0, W, H, { color: INK, fill: '#1E293B', fillStyle: 'solid', roughness: 0.6 }); g.ellipse(200, 300, 380, 380, { color: INK, fill: '#334155', fillStyle: 'solid', roughness: 1.2 }); }
    else if (t < 13) { g.rect(0, 0, W, H, { color: INK, fill: '#F1F5F9', fillStyle: 'solid', roughness: 0.6 }); g.rect(0, 1300, W, 620, { color: INK, fill: '#E2E8F0', fillStyle: 'solid', roughness: 0.8 }); }
    else if (t < 17) { g.rect(0, 0, W, H, { color: INK, fill: '#0F172A', fillStyle: 'solid', roughness: 0.6 }); }
    else if (t < 24) { g.rect(0, 0, W, H, { color: INK, fill: '#FEF3C7', fillStyle: 'solid', roughness: 0.6 }); g.rect(820, 500, 260, 800, { color: INK, fill: '#7C2D12', fillStyle: 'solid', roughness: 0.8 }); }
    else if (t < 31) { g.rect(0, 0, W, H, { color: INK, fill: '#DBEAFE', fillStyle: 'solid', roughness: 0.6 }); for (let x = 0; x < W; x += 200) g.rect(x, 1500, 180, 420, { color: INK, fill: '#93C5FD', fillStyle: 'solid', roughness: 0.8 }); }
    else { g.rect(0, 0, W, H, { color: INK, fill: '#FFF7ED', fillStyle: 'solid', roughness: 0.6 }); g.rect(0, 1350, W, 570, { color: INK, fill: '#FDBA74', fillStyle: 'solid', roughness: 0.8 }); }
  });

  // ---- set pieces ----
  f.draw(set, (g) => {
    if (t < 7) fridge(g, seg(t, 2.8, 3.6));
    if (t >= 7 && t < 13) pizza(g, seg(t, 9, 12));
    if (t >= 17 && t < 24) { g.rect(820, 500, 260, 800, { color: INK, fill: '#7C2D12', fillStyle: 'solid', roughness: 0.8 }); g.circle(1000, 1000, 24, { color: INK, fill: '#FDE68A', fillStyle: 'solid', roughness: 0.4 }); }
    if (t >= 24 && t < 31) { for (let x = 100; x < W; x += 300) g.rect(x, 1500, 200, 30, { color: INK, fill: '#60A5FA', fillStyle: 'solid', roughness: 0.6 }); }
    if (t >= 31) { g.rect(120, 1300, 840, 160, { color: INK, fill: '#FB923C', fillStyle: 'solid', roughness: 0.9 }); g.rect(140, 1200, 800, 110, { color: INK, fill: '#F97316', fillStyle: 'solid', roughness: 0.9 }); }
  });

  // ---- characters ----
  f.draw(actor, (g) => {
    if (t < 7) {
      const x = lerp(900, 620, seg(t, 0, 3));
      person(g, x, 1900, BEANIE, t < 3 ? 'sneak' : 'idle', oscillate(t * 1.4, 1) * 4, 0, -1, 0.9);
    } else if (t < 13) {
      person(g, 620, 1900, BEANIE, t < 9 ? 'idle' : 'chew', oscillate(t * 2, 1) * 4, 0, 1, 0.9);
    } else if (t < 17) {
      person(g, 540, 1900, BEANIE, 'idle', 0, 0, 1, 0.9);
    } else if (t < 24) {
      const k = seg(t, 17.5, 18.5);
      person(g, 540, 1900, BEANIE, t < 18 ? 'shock' : 'shock', -easeOutBounce(k) * 14, 0.6 * (1 - k), 1, 0.9);
    } else if (t < 31) {
      const x = lerp(260, 900, seg(t, 24, 30.5));
      person(g, x, 1900, BEANIE, 'shock', -Math.abs(Math.sin(t * 9)) * 30, 0, 1, 0.9);
    } else {
      person(g, 360, 1900, BEANIE, t < 35 ? 'chew' : 'happy', oscillate(t * 1.3, 1) * 4, 0, 1, 0.9);
      person(g, 760, 1900, HOODIE, t < 35 ? 'chew' : 'happy', oscillate(t * 1.1, 1) * 4, 0, -1, 0.9);
    }
  });

  // ---- captions ----
  f.draw(caption, (g) => {
    const line =
      t < 7 ? 'MIDNIGHT. NOBODY IS AWAKE.'
      : t < 13 ? 'THE LAST SLICE. THE LAST ONE.'
      : t < 17 ? ''
      : t < 24 ? 'THEN THE FLOOR SQUEAKED.'
      : t < 31 ? 'THIS HOUSE HAS OPINIONS.'
      : 'SHARING IS CARING. EVENTUALLY.';
    if (line) g.text(W / 2, 200, line, { fontSize: 30, color: INK, bold: true });
  });
}

export default scene.toProject();
