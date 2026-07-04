import React from 'react';
import * as Icons from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { Modal } from './ui/Modal';
import { ACCENT_THEMES } from '../lib/icons';

export const SettingsModal: React.FC = () => {
  const { activeModal, closeModal, accentColor, setAccentColor, theme, setTheme } = useUIStore();
  const isOpen = activeModal === 'settings';

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="Réglages" size="md">
      <div className="flex flex-col gap-6">
        {/* Color palette picker */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Thème de couleur
          </h4>
          <div className="grid grid-cols-4 gap-3">
            {ACCENT_THEMES.map((themeOption) => {
              const isSelected = accentColor === themeOption.color;
              return (
                <button
                  key={themeOption.color}
                  type="button"
                  onClick={() => setAccentColor(themeOption.color)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-slate-800 dark:border-white bg-slate-50 dark:bg-slate-800/60'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="relative w-9 h-9 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: themeOption.color }}>
                    {isSelected && <Icons.Check className="w-4.5 h-4.5 text-white" />}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    {themeOption.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800/80" />

        {/* Light/Dark/System theme mode */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Apparence
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'light', label: 'Clair', icon: 'Sun' },
              { key: 'dark', label: 'Sombre', icon: 'Moon' },
              { key: 'system', label: 'Système', icon: 'Monitor' }
            ].map((opt) => {
              const OptIcon = (Icons as any)[opt.icon];
              const isSelected = theme === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTheme(opt.key as any)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all text-xs font-semibold ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] dark:bg-[var(--accent-soft-dark)]'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <OptIcon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
