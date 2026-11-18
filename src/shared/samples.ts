import {
  HandDrawnBuilder,
  easeInOutQuad,
  easeOutBounce,
  lerp,
  oscillate,
} from './builder';
import { AnimationProject } from './types';

export function createDefaultBounceProject(): AnimationProject {
  const scene = new HandDrawnBuilder({
    id: 'sample_stick_jump',
    title: 'Sketch Character Jump',
    width: 1280,
    height: 720,
    fps: 12,
    paperStyle: 'cream',
    lineBoilIntensity: 1.0,
  });

  const bg = scene.addLayer('Background');
  const fx = scene.addLayer('FX & Dust');
  const ink = scene.addLayer('Character');

  const total = 24;
  for (let i = 0; i < total; i++) {
    const t = i / (total - 1);
    const frame = scene.addFrame(1, i === 0 ? 'Wave' : i === 12 ? 'Apex' : i === 20 ? 'Land' : undefined);

    // Background hills & ground line with natural hand-drawn wobble
    frame.draw(bg, (g) => {
      g.line(90, 560, 1190, 560, { color: '#334155', width: 3.5, roughness: 1.7 });
      g.circle(1060, 130, 86, { color: '#EA580C', fill: '#FDBA74', fillStyle: 'hachure', width: 3, roughness: 1.8 });
      // Sketchy distant hill
      g.stroke(
        [
          [90, 560],
          [310, 440],
          [540, 515],
          [820, 420],
          [1190, 560],
        ],
        { brush: 'pencil', color: '#94A3B8', width: 2.5, roughness: 1.6 }
      );
      // Puddle in middle
      g.ellipse(640, 566, 170, 24, { color: '#0284C7', fill: '#BAE6FD', fillStyle: 'hachure', width: 2.5, roughness: 1.5 });
    });

    // Character arc: Wave (0..6), Jump (7..18), Land & Settle (19..23)
    let x = 280;
    let y = 478;
    let armR = 35;
    let armL = -35;
    let legL = -18;
    let legR = 18;
    let lean = 0;
    let exp: 'happy' | 'surprised' | 'determined' | 'neutral' = 'happy';

    if (i <= 6) {
      const wt = i / 6;
      armR = -135 + oscillate(wt, 2) * 28;
      lean = oscillate(wt, 1) * 4;
    } else if (i <= 18) {
      const jt = (i - 7) / 11;
      x = lerp(280, 960, easeInOutQuad(jt));
      const arc = Math.sin(jt * Math.PI);
      y = 478 - arc * 230;
      lean = lerp(-12, 16, jt);
      armL = -110 - arc * 40;
      armR = 110 + arc * 40;
      legL = -40 * arc;
      legR = 45 * arc;
      exp = jt > 0.3 && jt < 0.7 ? 'surprised' : 'determined';
    } else {
      const lt = (i - 19) / 4;
      x = 960;
      y = 478 + (1 - easeOutBounce(lt)) * 18;
      lean = lerp(12, 0, lt);
      armL = lerp(-90, -35, lt);
      armR = lerp(90, 35, lt);
      exp = 'happy';
    }

    frame.draw(ink, (g) => {
      g.stickFigure(
        x,
        y,
        {
          scale: 1.05,
          torsoLean: lean,
          leftArmAngle: armL,
          rightArmAngle: armR,
          leftLegAngle: legL,
          rightLegAngle: legR,
          expression: exp,
        },
        { color: '#111827', width: 4.5, roughness: 1.5 }
      );
      if (i <= 6) {
        g.speechBubble(x + 48, y - 210, 170, 62, 'Hello!', 'left', { color: '#111827', fill: '#FFFFFF' });
      }
    });

    // Dust puffs on takeoff & landing
    if (i === 7 || i === 8 || i === 19 || i === 20) {
      const puffX = i < 12 ? 270 : 960;
      const spread = (i === 8 || i === 20) ? 28 : 12;
      frame.draw(fx, (g) => {
        g.circle(puffX - spread, 548, 26, { color: '#64748B', width: 2.2, roughness: 2.1 });
        g.circle(puffX + spread, 546, 22, { color: '#64748B', width: 2.2, roughness: 2.1 });
      });
    }
  }

  return scene.toProject();
}

export const CODE_TEMPLATES: Array<{ id: string; titleEn: string; titleAr: string; code: string }> = [
  {
    id: 'bounce-ball',
    titleEn: 'Bouncing Sketch Ball (24 frames)',
    titleAr: 'كرة تقفز بأسلوب الرسم اليدوي (24 إطار)',
    code: `// HandDrawnBuilder is available globally in the Code Runner!
const scene = new HandDrawnBuilder({
  title: "Bouncing Sketch Ball",
  width: 1280,
  height: 720,
  fps: 12,
  paperStyle: "cream",
  lineBoilIntensity: 1.1
});

const bg = scene.addLayer("Background");
const ink = scene.addLayer("Ink");

for (let i = 0; i < 24; i++) {
  const t = i / 23;
  const x = lerp(180, 1100, t);
  const bounce = Math.abs(Math.sin(t * Math.PI * 3));
  const y = 530 - bounce * 310;
  const squash = bounce < 0.09 ? 1.28 : 1.0;

  const frame = scene.addFrame(1);
  frame.draw(bg, (g) => {
    g.line(100, 575, 1180, 575, { color: "#334155", width: 3.5, roughness: 1.8 });
    g.text(640, 95, "Frame-by-Frame Physics", { color: "#475569", fontSize: 32, bold: true });
  });

  frame.draw(ink, (g) => {
    // Shadow shrinks as ball rises
    const shadowW = lerp(110, 42, bounce);
    g.ellipse(x, 576, shadowW, 14, { color: "#94A3B8", fill: "#CBD5E1", fillStyle: "hachure", width: 1.5 });
    // Ball with squash & stretch
    g.ellipse(x, y, 76 * squash, 76 / squash, {
      color: "#111827",
      fill: "#FF5A36",
      fillStyle: "hachure",
      width: 4,
      roughness: 1.7
    });
  });
}

return scene.toProject();`,
  },
  {
    id: 'stick-explain',
    titleEn: 'Whiteboard Idea Explainer (20 frames)',
    titleAr: 'شخصية تشرح فكرة على السبورة (20 إطار)',
    code: `const scene = new HandDrawnBuilder({
  title: "Idea Lightbulb",
  width: 1280,
  height: 720,
  fps: 12,
  paperStyle: "grid",
  lineBoilIntensity: 1.2
});

const bg = scene.addLayer("Board");
const char = scene.addLayer("Character");
const idea = scene.addLayer("Idea");

for (let i = 0; i < 20; i++) {
  const t = i / 19;
  const frame = scene.addFrame(1);

  frame.draw(bg, (g) => {
    g.rect(120, 90, 1040, 540, { color: "#475569", width: 3, roughness: 1.5 });
  });

  frame.draw(char, (g) => {
    const raise = i >= 8 ? lerp(35, -145, Math.min(1, (i - 8) / 5)) : 35;
    g.stickFigure(410, 470, {
      scale: 1.15,
      rightArmAngle: raise,
      leftArmAngle: -25 + oscillate(t, 2) * 10,
      expression: i >= 10 ? "surprised" : "neutral"
    }, { color: "#0F172A", width: 4.5, roughness: 1.5 });
  });

  if (i >= 10) {
    const pop = easeOutBounce(Math.min(1, (i - 10) / 6));
    frame.draw(idea, (g) => {
      const r = 68 * pop;
      g.circle(690, 230, r, { color: "#D97706", fill: "#FDE047", fillStyle: "hachure", width: 4, roughness: 1.8 });
      g.arrow(495, 310, 625, 250, { color: "#FF5A36", width: 4 });
      if (i >= 14) {
        g.speechBubble(760, 150, 270, 80, "Aha! New Video", "left", { color: "#0F172A", fill: "#FFFFFF" });
      }
    });
  }
}

return scene.toProject();`,
  },
];
