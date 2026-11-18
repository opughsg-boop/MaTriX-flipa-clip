import React from 'react';
import {
  Check,
  Download,
  FolderOpen,
  Languages,
  PlusSquare,
  Save,
} from 'lucide-react';
import { Translations } from '../i18n/translations';
import { Language } from '../shared/types';

interface TopBarProps {
  t: Translations;
  lang: Language;
  onToggleLang: () => void;
  projectTitle: string;
  onChangeTitle: (title: string) => void;
  layoutMode: 'classic' | 'studio';
  onChangeLayoutMode: (mode: 'classic' | 'studio') => void;
  onOpenProjects: () => void;
  onOpenNewProject: () => void;
  onSaveProject: () => void;
  saveState: 'idle' | 'saving' | 'saved';
  onOpenExport: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  t,
  lang,
  onToggleLang,
  projectTitle,
  onChangeTitle,
  layoutMode,
  onChangeLayoutMode,
  onOpenProjects,
  onOpenNewProject,
  onSaveProject,
  saveState,
  onOpenExport,
}) => {
  return (
    <header className="h-14 shrink-0 bg-[#12151C] border-b border-white/8 px-4 flex items-center justify-between gap-4 select-none">
      {/* Zone 1: Brand & Editable Project Title */}
      <div className="flex items-center gap-4 min-w-0">
        <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
          {t.appName}
        </span>
        <span className="text-white/15 shrink-0" aria-hidden="true">
          /
        </span>
        <input
          type="text"
          value={projectTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          className="bg-transparent text-sm font-medium text-slate-200 hover:text-white focus:text-white border-b border-transparent focus:border-[#FF5A36] outline-none px-1 py-0.5 truncate max-w-[220px]"
          aria-label={t.projectTitle}
        />
      </div>

      {/* Zone 2: Layout Switch & File Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden md:flex items-center bg-[#0D0F14] border border-white/8 rounded-md p-0.5">
          <button
            type="button"
            onClick={() => onChangeLayoutMode('classic')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              layoutMode === 'classic'
                ? 'bg-[#1C202B] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.classicLayout}
          </button>
          <button
            type="button"
            onClick={() => onChangeLayoutMode('studio')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              layoutMode === 'studio'
                ? 'bg-[#1C202B] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.studioLayout}
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenProjects}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C202B] hover:bg-[#252A38] text-xs font-medium text-slate-200 border border-white/8 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>{t.projects}</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewProject}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C202B] hover:bg-[#252A38] text-xs font-medium text-slate-200 border border-white/8 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <PlusSquare className="w-3.5 h-3.5 text-slate-400" />
          <span>{t.newProject}</span>
        </button>

        <button
          type="button"
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#1C202B] hover:bg-[#252A38] text-xs font-medium text-slate-200 border border-white/8 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Switch Arabic / English"
        >
          <Languages className="w-3.5 h-3.5 text-slate-400" />
          <span>{lang === 'en' ? 'AR' : 'EN'}</span>
        </button>
      </div>

      {/* Zone 3: Save & Primary Export CTA */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onSaveProject}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C202B] hover:bg-[#252A38] text-xs font-medium text-slate-200 border border-white/8 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {saveState === 'saved' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Save className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>{saveState === 'saved' ? t.saved : t.save}</span>
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#FF5A36] hover:bg-[#ff6d4d] text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.exportVideo}</span>
        </button>
      </div>
    </header>
  );
};
