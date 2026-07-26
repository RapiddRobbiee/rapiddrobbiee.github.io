import React from 'react';
import { LayoutProps } from '../../types';

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1m ago';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1h ago';
  return `${hours}h ago`;
};

interface LayoutIDEProps extends LayoutProps {
  headerNode: React.ReactNode;
}

/** A compact layout option with navigation and a single, distraction-free canvas. */
export const LayoutIDE: React.FC<LayoutIDEProps> = ({
  currentView,
  setCurrentView,
  tabs,
  children,
  headerNode,
  handleGenerateSql,
  isLoadingSql,
  anyOperationLoading,
  handleResetForm,
  loginSystemEnabled,
  currentUser,
  setShowSaveLoadModal,
  setShowVersionNotesModal,
  setShowReportBugModal,
  lastSavedTime,
}) => (
  <div className="flex h-screen flex-col overflow-hidden bg-[var(--clr-bg-main)] font-rajdhani">
    <div className="z-20 shrink-0 border-b border-[var(--clr-border)] bg-[var(--clr-bg-card)] p-2 shadow-md">
      <div className="w-full px-2">{headerNode}</div>
    </div>

    <div className="flex min-h-0 flex-1 overflow-hidden">
      <nav className="flex max-h-full w-60 shrink-0 flex-col border-r border-[var(--clr-border)] bg-[var(--clr-bg-card)] p-3" aria-label="Workspace navigation">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--clr-text-muted)]">Workspace</p>
          <p className="mt-1 text-lg font-bold text-[var(--clr-text)]">Build a patch</p>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto pt-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id)}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all ${currentView === tab.id ? 'bg-[var(--clr-primary)]/20 text-[var(--clr-accent)]' : 'text-[var(--clr-text-muted)] hover:bg-[var(--clr-bg-main)] hover:text-[var(--clr-text)]'}`}
            title={tab.name}
            aria-label={tab.name}
          >
            <i className={`fas ${tab.icon} w-5 text-center`} aria-hidden="true" />
            <span>{tab.name}</span>
            {currentView === tab.id && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-md bg-[var(--clr-accent)]" />}
          </button>
        ))}
        </div>

        <div className="mt-4 border-t border-[var(--clr-border)] pt-4">
          <button onClick={handleGenerateSql} disabled={isLoadingSql || anyOperationLoading} className="btn-primary flex w-full items-center justify-center gap-2 px-3 py-3 text-xs font-bold uppercase tracking-wide disabled:opacity-50">
            <i className={`fas ${isLoadingSql ? 'fa-spinner fa-spin' : 'fa-file-code'}`} aria-hidden="true" />
            {isLoadingSql ? 'Generating...' : 'Generate SQL Patch'}
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={handleResetForm} disabled={anyOperationLoading} className="btn-danger px-2 py-2 text-xs font-bold uppercase disabled:opacity-50"><i className="fas fa-rotate-left mr-1" />Reset</button>
            <button onClick={() => setShowSaveLoadModal(true)} disabled={!loginSystemEnabled || !currentUser || anyOperationLoading} className="btn-secondary px-2 py-2 text-xs font-bold uppercase disabled:opacity-40"><i className="fas fa-cloud-arrow-up mr-1" />Saves</button>
            <button onClick={() => setShowVersionNotesModal(true)} disabled={anyOperationLoading} className="btn-secondary px-2 py-2 text-xs font-bold uppercase disabled:opacity-50"><i className="fas fa-circle-info mr-1" />Notes</button>
            <button onClick={() => setShowReportBugModal(true)} disabled={anyOperationLoading} className="btn-secondary px-2 py-2 text-xs font-bold uppercase disabled:opacity-50"><i className="fas fa-bug mr-1" />Report</button>
          </div>
          {/* Auto-save indicator */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[var(--clr-text-muted)]">
            {lastSavedTime ? (
              <>
                <i className="fas fa-circle text-[6px] text-emerald-400" />
                <span>Saved {formatTimeAgo(lastSavedTime)}</span>
              </>
            ) : (
              <span className="opacity-40">Auto-save idle</span>
            )}
          </div>
        </div>
      </nav>

      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-[1500px]">{children}</div>
      </main>
    </div>
  </div>
);
