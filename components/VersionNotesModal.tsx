import React, { useState } from 'react';
import { versionNotes, VersionNoteEntry } from '../versionNotes';
import { tutorialSteps, TutorialStep } from '../tutorial';

interface VersionNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'notes' | 'tutorial';

export const VersionNotesModal: React.FC<VersionNotesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('notes');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm font-rajdhani modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-notes-title"
    >
      <div
        className="modal-card p-0 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col modal-content overflow-hidden"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header with Tabs */}
        <div className="shrink-0 border-b border-[var(--clr-border)]">
          <div className="flex justify-between items-center px-6 pt-5 pb-0">
            <h3 id="version-notes-title" className="text-2xl font-bold modal-title">
              {activeTab === 'notes' ? 'Patch Notes' : 'Tutorial'}
            </h3>
            <button
              onClick={onClose}
              className="text-[var(--clr-text-muted)] hover:text-[var(--clr-accent)] text-2xl transition-colors"
              aria-label="Close"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-0 px-6 mt-4">
            <button
              onClick={() => setActiveTab('notes')}
              className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider transition-all rounded-t-lg ${
                activeTab === 'notes'
                  ? 'text-[var(--clr-accent)] bg-[var(--clr-bg-card)] border border-b-0 border-[var(--clr-border)]'
                  : 'text-[var(--clr-text-muted)] hover:text-[var(--clr-text)] border border-transparent border-b-[var(--clr-border)]'
              }`}
              style={activeTab === 'notes' ? { marginBottom: '-1px' } : undefined}
            >
              <i className="fas fa-scroll text-xs"></i>
              Patch Notes
            </button>
            <button
              onClick={() => setActiveTab('tutorial')}
              className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider transition-all rounded-t-lg ${
                activeTab === 'tutorial'
                  ? 'text-[var(--clr-accent)] bg-[var(--clr-bg-card)] border border-b-0 border-[var(--clr-border)]'
                  : 'text-[var(--clr-text-muted)] hover:text-[var(--clr-text)] border border-transparent border-b-[var(--clr-border)]'
              }`}
              style={activeTab === 'tutorial' ? { marginBottom: '-1px' } : undefined}
            >
              <i className="fas fa-graduation-cap text-xs"></i>
              Info!
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {activeTab === 'notes' ? (
            /* ---------- Patch Notes Tab ---------- */
            <div className="p-6 space-y-6">
              {versionNotes.map((entry: VersionNoteEntry, index: number) => (
                <div key={entry.version}>
                  <div className="mb-3">
                    <h4 className="text-xl font-semibold text-[var(--clr-text-accent)]">
                      <i className="fas fa-code-branch mr-2 text-sm text-[var(--clr-accent)]"></i>
                      {entry.version}
                    </h4>
                    <p className="text-xs text-[var(--clr-text-muted)] ml-7">
                      <i className="far fa-calendar-alt mr-1"></i>
                      {entry.date}
                    </p>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-[var(--clr-text)] text-sm pl-2">
                    {entry.notes.map((note, noteIndex) => (
                      <li key={noteIndex} className="leading-relaxed">{note}</li>
                    ))}
                  </ul>
                  {index < versionNotes.length - 1 && (
                    <hr className="my-6 border-[var(--clr-border)]" />
                  )}
                </div>
              ))}
              {versionNotes.length === 0 && (
                <p className="text-center text-[var(--clr-text-muted)] italic py-8">
                  No version notes available.
                </p>
              )}
            </div>
          ) : (
            /* ---------- Tutorial Tab ---------- */
            <div className="p-6">
              {/* Intro Banner */}
              <div className="card p-5 mb-6 bg-gradient-to-r from-[var(--clr-primary)]/10 to-[var(--clr-accent)]/10 border-[var(--clr-accent)]/30">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-[var(--clr-accent)]/20 flex items-center justify-center text-2xl">
                    <i className="fas fa-dragon text-[var(--clr-accent)]"></i>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[var(--clr-text-accent)] mb-1">
                       Patch Creation Information
                    </h4>
                    <p className="text-sm text-[var(--clr-text-muted)] leading-relaxed">
                      Follow this step-by-step tutorial to master the Dokkan Patch Maker workflow — from loading your database to generating your finished SQL.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tutorial Steps */}
              <div className="space-y-5">
                {tutorialSteps.map((step: TutorialStep, index: number) => (
                  <div
                    key={index}
                    className="card p-5 transition-all hover:border-[var(--clr-border-focus)]"
                  >
                    {/* Step Header */}
                    <div className="flex items-start gap-4 mb-3">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-[var(--clr-accent)]/15 flex items-center justify-center text-lg">
                        <i className={`fas ${step.icon} text-[var(--clr-accent)]`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-[var(--clr-text-accent)]">
                          {step.title}
                        </h4>
                        <p className="text-sm text-[var(--clr-text-muted)] leading-relaxed mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Visual Flow (if present) */}
                    {step.visual && (
                      <div className="ml-14 mb-3 px-3 py-1.5 rounded-md bg-[var(--clr-primary)]/10 border border-[var(--clr-border)] inline-block">
                        <span className="text-xs text-[var(--clr-text-muted)] font-mono tracking-wide">
                          {step.visual}
                        </span>
                      </div>
                    )}

                    {/* Tips */}
                    {step.tips && step.tips.length > 0 && (
                      <div className="ml-14 mt-3 space-y-1.5">
                        {step.tips.map((tip: string, tipIdx: number) => (
                          <div
                            key={tipIdx}
                            className="flex items-start gap-2 text-xs text-[var(--clr-text-muted)] leading-relaxed"
                          >
                            <i className="fas fa-circle text-[4px] text-[var(--clr-accent)] mt-1.5 shrink-0"></i>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer CTA */}
              <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-[var(--clr-accent)]/10 to-transparent border border-[var(--clr-accent)]/20 text-center">
                <p className="text-sm text-[var(--clr-text-muted)] mb-3">
                  <i className="fas fa-check-circle text-[var(--clr-accent)] mr-1"></i>
                  You're now ready to create your first patch. Start by loading a database!
                </p>
                <p className="text-xs text-[var(--clr-text-muted)] opacity-70">
                  Need help? Report bugs via the sidebar button or reach out to the community.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 mt-auto border-t border-[var(--clr-border)] px-6 py-4 flex justify-end">
          <button onClick={onClose} className="btn-secondary py-2 px-5 rounded-md text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
