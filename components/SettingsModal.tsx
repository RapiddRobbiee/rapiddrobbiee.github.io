import React from 'react';
import { AppSettings, Theme } from '../types';
import { FormCheckbox } from './FormControls';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  themes: { id: Theme; name: string; colorClass: string }[];
}



export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  currentTheme,
  onThemeChange,
  themes,
}) => {
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = React.useState(false);

  if (!isOpen) return null;

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const renderThemeSelector = () => (
    <div>
      <button
        onClick={() => setIsThemeSelectorOpen(!isThemeSelectorOpen)}
        className="w-full flex items-center justify-between p-3 rounded-md backdrop-blur-sm hover:bg-[var(--clr-primary)]/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <i className="fas fa-palette text-[var(--clr-primary)]"></i>
          <span className="text-sm font-semibold text-[var(--clr-text-muted)]">Theme</span>
        </div>
        <i className={`fas fa-chevron-${isThemeSelectorOpen ? 'up' : 'down'} text-[var(--clr-text-muted)] transition-transform`}></i>
      </button>
      {isThemeSelectorOpen && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3 px-1">
          {themes.map((themeOption) => (
            <button
              key={themeOption.id}
              className={`theme-button ${currentTheme === themeOption.id ? 'selected' : ''}`}
              onClick={() => onThemeChange(themeOption.id)}
              aria-label={`Select ${themeOption.name} theme`}
              title={themeOption.name}
            >
              <div className={`theme-color-blotch ${themeOption.colorClass}`}></div>
              <span className="theme-name-small">{themeOption.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm font-rajdhani modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="modal-card p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 id="settings-title" className="text-2xl font-bold modal-title">
            <i className="fas fa-cog mr-3 text-[var(--clr-primary)]"></i>Settings
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--clr-text-muted)] hover:text-[var(--clr-accent)] text-2xl transition-colors"
            aria-label="Close settings"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6 custom-scrollbar">
          {/* Appearance Section */}
          <div>
            <h4 className="text-lg font-semibold text-[var(--clr-text-accent)] mb-2">Appearance</h4>
            <div className="space-y-4 p-3 bg-[var(--clr-bg-main)]/20 rounded-md">
              {renderThemeSelector()}
              <FormCheckbox
                label="Enable UI animations"
                checked={settings.enableAnimations}
                onChange={(checked) => handleSettingChange('enableAnimations', checked)}
                helpText="Enable various animations and transitions throughout the application."
              />
              <FormCheckbox
                label="Sticky navigation bar"
                checked={settings.stickyNavbar}
                onChange={(checked) => handleSettingChange('stickyNavbar', checked)}
                helpText="Keep the navigation bar fixed at the top when scrolling."
              />
            </div>
          </div>

        {/* Behavior Section */}
          <div>
            <h4 className="text-lg font-semibold text-[var(--clr-text-accent)] mb-2">Behavior</h4>
            <div className="p-3 bg-[var(--clr-bg-main)]/20 rounded-md">
              <div className="space-y-3">
                <FormCheckbox
                  label="Auto-expand new/loaded card forms"
                  checked={settings.autoExpandFirstCard}
                  onChange={(checked) => handleSettingChange('autoExpandFirstCard', checked)}
                  helpText="Automatically select the first card when loading or adding a new card form."
                />
                <FormCheckbox
                  label="Show advanced fields by default"
                  checked={settings.defaultAdvancedOpen}
                  onChange={(checked) => handleSettingChange('defaultAdvancedOpen', checked)}
                  helpText="Automatically show the 'Advanced & Miscellaneous Fields' section within Card Forms."
                />
                <FormCheckbox
                  label="Confirm before deleting card forms"
                  checked={settings.confirmOnDelete}
                  onChange={(checked) => handleSettingChange('confirmOnDelete', checked)}
                  helpText="Show a confirmation dialog before permanently deleting a card form."
                />
                <FormCheckbox
                  label="Sync Card 0/1 edits"
                  checked={settings.syncAlphaBetaEdits}
                  onChange={(checked) => handleSettingChange('syncAlphaBetaEdits', checked)}
                  helpText="When a card ID ends in 0 or 1, copy edits to its paired card while keeping both IDs separate."
                />
                <FormCheckbox
                  label="Auto-generate SQL on tab switch"
                  checked={settings.autoGenerateSqlOnTabSwitch}
                  onChange={(checked) => handleSettingChange('autoGenerateSqlOnTabSwitch', checked)}
                  helpText="Automatically generate the SQL patch when switching to the 'Generated SQL' tab if it's empty."
                />
              </div>
            </div>
          </div>

          {/* Beta Features Section */}
          <div>
            <h4 className="text-lg font-semibold text-[var(--clr-text-accent)] mb-2">
              <i className="fas fa-flask mr-2 text-[var(--clr-warning)]"></i>Beta Features
            </h4>
            <div className="p-3 bg-[var(--clr-bg-main)]/20 rounded-md border border-[var(--clr-warning)]/30">
              <FormCheckbox
                label="Visual Causality Editor"
                checked={settings.enableVisualCausalityEditor}
                onChange={(checked) => handleSettingChange('enableVisualCausalityEditor', checked)}
                helpText="Enable the new visual editor for causality conditions. When disabled, uses the traditional text field. (Experimental)"
              />
              <FormCheckbox
                label="Enable Reverse SQL Import"
                checked={settings.enableReverseSqlImport}
                onChange={(checked) => handleSettingChange('enableReverseSqlImport', checked)}
                helpText="Enable the ability to import SQL patch files to reconstruct the patch state. (Experimental)"
              />
              <FormCheckbox
                label="Enable Standby & Finish Skills"
                checked={settings.enableStandbyFinishSkills}
                onChange={(checked) => handleSettingChange('enableStandbyFinishSkills', checked)}
                helpText="Enable the editor for Standby and Finish Skills. (Experimental)"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--clr-border)] flex justify-end">
          <button onClick={onClose} className="btn-primary py-2 px-6 rounded-md">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
