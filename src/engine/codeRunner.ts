import {
  HandDrawnBuilder,
  clamp,
  easeInOutQuad,
  easeOutBounce,
  lerp,
  oscillate,
} from '../shared/builder';
import { AnimationProject } from '../shared/types';

export function executeAnimationScript(scriptCode: string): AnimationProject {
  // Strip optional TS import/export lines so Codex/Claude Code scripts run directly in browser
  const cleaned = scriptCode
    .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, 'return ');

  const fn = new Function(
    'HandDrawnBuilder',
    'lerp',
    'clamp',
    'easeInOutQuad',
    'easeOutBounce',
    'oscillate',
    `"use strict";\n${cleaned}`
  );

  const result = fn(
    HandDrawnBuilder,
    lerp,
    clamp,
    easeInOutQuad,
    easeOutBounce,
    oscillate
  );

  if (!result || typeof result !== 'object' || !Array.isArray(result.frames)) {
    throw new Error(
      'Script must return an AnimationProject (e.g. `return scene.toProject();`).'
    );
  }

  return result as AnimationProject;
}
