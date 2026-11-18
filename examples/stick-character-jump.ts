import { HandDrawnBuilder, easeInOutQuad, easeOutBounce, lerp, oscillate } from '../src/shared/builder';

const scene = new HandDrawnBuilder({
  id: 'example_codex_story',
  title: 'Codex Hand-Drawn Story',
  width: 1280,
  height: 720,
  fps: 12,
  paperStyle: 'cream',
  lineBoilIntensity: 1.1,
});

const bg = scene.addLayer('Background');
const actor = scene.addLayer('Character');
const fx = scene.addLayer('FX');

for (let i = 0; i < 24; i++) {
  const t = i / 23;
  const f = scene.addFrame(1);

  f.draw(bg, (g) => {
    g.line(100, 560, 1180, 560, { color: '#334155', width: 3.5, roughness: 1.8 });
    g.circle(1050, 140, 82, { color: '#EA580C', fill: '#FDBA74', fillStyle: 'hachure' });
  });

  const x = lerp(240, 960, easeInOutQuad(t));
  const jump = Math.sin(t * Math.PI);
  const y = 478 - jump * 210;

  f.draw(actor, (g) => {
    g.stickFigure(x, y, {
      scale: 1.05,
      torsoLean: lerp(-10, 14, t),
      leftArmAngle: -45 - jump * 85,
      rightArmAngle: 45 + oscillate(t, 2) * 30,
      leftLegAngle: -28 * jump,
      rightLegAngle: 32 * jump,
      expression: jump > 0.5 ? 'surprised' : 'happy',
    });
  });

  if (i >= 18) {
    const pop = easeOutBounce((i - 18) / 5);
    f.draw(fx, (g) => {
      g.speechBubble(x - 190, y - 210, 220 * pop, 68 * pop, 'Rendered!', 'right');
    });
  }
}

export default scene.toProject();
