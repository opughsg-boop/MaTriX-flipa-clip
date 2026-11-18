import { HandDrawnBuilder, easeOutBounce, lerp, oscillate } from '../src/shared/builder';

const scene = new HandDrawnBuilder({
  id: 'whiteboard_explainer',
  title: 'Whiteboard Idea Explainer',
  width: 1280,
  height: 720,
  fps: 12,
  paperStyle: 'grid',
  lineBoilIntensity: 1.15,
});

const board = scene.addLayer('Board');
const actor = scene.addLayer('Presenter');
const callouts = scene.addLayer('Callouts');

for (let i = 0; i < 24; i++) {
  const t = i / 23;
  const f = scene.addFrame(1);

  f.draw(board, (g) => {
    g.rect(90, 75, 1100, 570, { color: '#475569', width: 3.5, roughness: 1.5 });
    g.text(640, 125, 'HOW CODE BECOMES HAND-DRAWN VIDEO', {
      color: '#1E293B',
      fontSize: 28,
      bold: true,
    });
  });

  const raise = i >= 6 ? lerp(36, -138, Math.min(1, (i - 6) / 6)) : 36;
  f.draw(actor, (g) => {
    g.stickFigure(
      340,
      490,
      {
        scale: 1.12,
        leftArmAngle: -28 + oscillate(t, 2) * 8,
        rightArmAngle: raise,
        expression: i >= 12 ? 'surprised' : 'happy',
      },
      { color: '#111827', width: 4.5, roughness: 1.5 }
    );
  });

  if (i >= 8) {
    const pop1 = easeOutBounce(Math.min(1, (i - 8) / 5));
    f.draw(callouts, (g) => {
      g.rect(510, 220, 210 * pop1, 110 * pop1, {
        color: '#0284C7',
        fill: '#BAE6FD',
        fillStyle: 'hachure',
        width: 3.5,
      });
      if (i >= 11) {
        g.text(615, 275, '1. Code / AI', { color: '#0F172A', fontSize: 24, bold: true });
      }
    });
  }

  if (i >= 14) {
    const pop2 = easeOutBounce(Math.min(1, (i - 14) / 5));
    f.draw(callouts, (g) => {
      g.arrow(730, 275, 830, 275, { color: '#FF5A36', width: 4 });
      g.circle(960, 275, 140 * pop2, {
        color: '#EA580C',
        fill: '#FDE047',
        fillStyle: 'hachure',
        width: 4,
      });
      if (i >= 17) {
        g.text(960, 275, '2. MP4 / GIF', { color: '#111827', fontSize: 22, bold: true });
      }
    });
  }
}

export default scene.toProject();
