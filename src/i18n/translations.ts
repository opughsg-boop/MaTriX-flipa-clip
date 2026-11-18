import { Language } from '../shared/types';

export interface Translations {
  appName: string;
  projects: string;
  newProject: string;
  save: string;
  saved: string;
  exportVideo: string;
  aiAnimator: string;
  codeAnimator: string;
  classicLayout: string;
  studioLayout: string;
  play: string;
  pause: string;
  fps: string;
  onionSkin: string;
  onionBefore: string;
  onionAfter: string;
  onionOpacity: string;
  guides: string;
  ruler: string;
  mirrorX: string;
  mirrorY: string;
  grid: string;
  paperStyle: string;
  lineBoil: string;
  layers: string;
  addLayer: string;
  mergeDown: string;
  opacity: string;
  blendMode: string;
  tools: {
    pencil: string;
    ink: string;
    marker: string;
    fill: string;
    eraser: string;
    lasso: string;
    line: string;
    circle: string;
    rect: string;
    arrow: string;
    text: string;
    pan: string;
  };
  brushSize: string;
  roughness: string;
  color: string;
  fillColor: string;
  undo: string;
  redo: string;
  clearFrame: string;
  frames: string;
  addFrame: string;
  duplicateFrame: string;
  deleteFrame: string;
  holdDuration: string;
  loopPlayback: string;
  audioTracks: string;
  importAudio: string;
  recordVoice: string;
  stopRecording: string;
  volume: string;
  aiTitle: string;
  aiPlaceholder: string;
  aiFramesCount: string;
  aiStyle: string;
  aiGenerate: string;
  aiGenerating: string;
  aiAppend: string;
  aiReplace: string;
  codeTitle: string;
  runScript: string;
  loadExample: string;
  copyCli: string;
  copied: string;
  exportTitle: string;
  exportFormat: string;
  exportStart: string;
  exportProgress: string;
  exportDownload: string;
  projectTitle: string;
  dimensions: string;
  createProject: string;
  cancel: string;
  textPrompt: string;
  emptyProjects: string;
  importImage: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appName: 'FlipaForge',
    projects: 'Projects',
    newProject: 'New Project',
    save: 'Save',
    saved: 'Saved',
    exportVideo: 'Export',
    aiAnimator: 'AI Generator',
    codeAnimator: 'Code & Agent',
    classicLayout: 'Classic',
    studioLayout: 'Studio',
    play: 'Play',
    pause: 'Pause',
    fps: 'FPS',
    onionSkin: 'Onion Skin',
    onionBefore: 'Before',
    onionAfter: 'After',
    onionOpacity: 'Opacity',
    guides: 'Guides',
    ruler: 'Ruler',
    mirrorX: 'Mirror X',
    mirrorY: 'Mirror Y',
    grid: 'Grid',
    paperStyle: 'Paper',
    lineBoil: 'Line Boil',
    layers: 'Layers',
    addLayer: 'Add Layer',
    mergeDown: 'Merge Down',
    opacity: 'Opacity',
    blendMode: 'Blend',
    tools: {
      pencil: 'Pencil',
      ink: 'Ink Pen',
      marker: 'Marker',
      fill: 'Bucket Fill',
      eraser: 'Eraser',
      lasso: 'Lasso Move',
      line: 'Line',
      circle: 'Circle',
      rect: 'Rectangle',
      arrow: 'Arrow',
      text: 'Text',
      pan: 'Pan Stage',
    },
    brushSize: 'Size',
    roughness: 'Sketchiness',
    color: 'Stroke',
    fillColor: 'Fill',
    undo: 'Undo',
    redo: 'Redo',
    clearFrame: 'Clear',
    frames: 'Frames',
    addFrame: 'Add Frame',
    duplicateFrame: 'Duplicate',
    deleteFrame: 'Delete',
    holdDuration: 'Hold',
    loopPlayback: 'Loop',
    audioTracks: 'Audio Tracks',
    importAudio: 'Import Audio',
    recordVoice: 'Record Voice',
    stopRecording: 'Stop',
    volume: 'Volume',
    aiTitle: 'AI Hand-Drawn Frame Generator',
    aiPlaceholder: 'Describe your animation scene (e.g., A smiling stick character waves, jumps over a puddle, and lands with dust puffs)',
    aiFramesCount: 'Frames',
    aiStyle: 'Drawing Style',
    aiGenerate: 'Generate Frames',
    aiGenerating: 'Drawing frames...',
    aiAppend: 'Append to Timeline',
    aiReplace: 'Replace Timeline',
    codeTitle: 'Code Animator (Codex / Claude Code SDK)',
    runScript: 'Run & Compile Frames',
    loadExample: 'Load Template',
    copyCli: 'Copy CLI Render Command',
    copied: 'Copied',
    exportTitle: 'Export Animation',
    exportFormat: 'Output Format',
    exportStart: 'Render & Export',
    exportProgress: 'Rendering frame',
    exportDownload: 'Download File',
    projectTitle: 'Project Title',
    dimensions: 'Canvas Preset',
    createProject: 'Create Flipbook',
    cancel: 'Cancel',
    textPrompt: 'Enter hand-drawn label text',
    emptyProjects: 'No saved projects on disk yet.',
    importImage: 'Trace Image',
  },
  ar: {
    appName: 'FlipaForge',
    projects: 'المشاريع',
    newProject: 'مشروع جديد',
    save: 'حفظ',
    saved: 'تم الحفظ',
    exportVideo: 'تصدير',
    aiAnimator: 'مولد الذكاء الاصطناعي',
    codeAnimator: 'الأكواد والوكلاء',
    classicLayout: 'كلاسيكي',
    studioLayout: 'استوديو',
    play: 'تشغيل',
    pause: 'إيقاف',
    fps: 'إطار/ث',
    onionSkin: 'شفافية البصل',
    onionBefore: 'السابق',
    onionAfter: 'التالي',
    onionOpacity: 'الشفافية',
    guides: 'أدلة الرسم',
    ruler: 'مسطرة',
    mirrorX: 'تناظر أفقي',
    mirrorY: 'تناظر رأسي',
    grid: 'شبكة',
    paperStyle: 'الورق',
    lineBoil: 'اهتزاز الخط اليدوي',
    layers: 'الطبقات',
    addLayer: 'طبقة جديدة',
    mergeDown: 'دمج للأسفل',
    opacity: 'الشفافية',
    blendMode: 'الدمج',
    tools: {
      pencil: 'قلم رصاص',
      ink: 'قلم حبر',
      marker: 'تحديد',
      fill: 'دلو التعبئة',
      eraser: 'ممحاة',
      lasso: 'تحديد وتحريك',
      line: 'خط يدوي',
      circle: 'دائرة',
      rect: 'مستطيل',
      arrow: 'سهم',
      text: 'نص',
      pan: 'تحريك اللوحة',
    },
    brushSize: 'الحجم',
    roughness: 'خشونة اليد',
    color: 'لون الخط',
    fillColor: 'التعبئة',
    undo: 'تراجع',
    redo: 'إعادة',
    clearFrame: 'مسح',
    frames: 'الإطارات',
    addFrame: 'إطار جديد',
    duplicateFrame: 'تكرار',
    deleteFrame: 'حذف',
    holdDuration: 'مدة الثبات',
    loopPlayback: 'تكرار',
    audioTracks: 'مسارات الصوت',
    importAudio: 'استيراد صوت',
    recordVoice: 'تسجيل صوت',
    stopRecording: 'إيقاف التسجيل',
    volume: 'الصوت',
    aiTitle: 'توليد إطارات مرسومة بالذكاء الاصطناعي',
    aiPlaceholder: 'صف مشهد الأنميشن (مثال: شخصية كرتونية تلوح بيدها ثم تقفز فوق بركة ماء مع تناثر الغبار)',
    aiFramesCount: 'عدد الإطارات',
    aiStyle: 'أسلوب الرسم',
    aiGenerate: 'توليد الإطارات',
    aiGenerating: 'جارٍ رسم الإطارات...',
    aiAppend: 'إضافة إلى الخط الزمني',
    aiReplace: 'استبدال الخط الزمني',
    codeTitle: 'محرر الأكواد (لـ Codex و Claude Code)',
    runScript: 'تشغيل وبناء الإطارات',
    loadExample: 'تحميل قالب',
    copyCli: 'نسخ أمر التصدير CLI',
    copied: 'تم النسخ',
    exportTitle: 'تصدير الفيديو والرسوم',
    exportFormat: 'صيغة التصدير',
    exportStart: 'تجهيز وتصدير',
    exportProgress: 'معالجة الإطار',
    exportDownload: 'تحميل الملف',
    projectTitle: 'اسم المشروع',
    dimensions: 'مقاس اللوحة',
    createProject: 'إنشاء المشروع',
    cancel: 'إلغاء',
    textPrompt: 'أدخل النص المرسوم',
    emptyProjects: 'لا توجد مشاريع محفوظة بعد.',
    importImage: 'صورة للتتبع',
  },
};
