import React from 'react';
import { LayoutProps } from '../../types';
import { currentAppVersion } from '../../versionNotes';

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

interface LayoutDockProps extends LayoutProps {
  headerNode: React.ReactNode;
}

/**
 * The default workspace layout. It keeps the patch workflow visible instead
 * of hiding the primary actions in a hover-only dock.
 */
export const LayoutDock: React.FC<LayoutDockProps> = ({
  currentView,
  setCurrentView,
  tabs,
  children,
  headerNode,
  generatedSql,
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
}) => {
  const workflowTabs = tabs.filter((tab) =>
    ['dashboard', 'globalSkillSets', 'standbyFinish', 'ezaDetails', 'miscTables', 'sqlOutput'].includes(tab.id)
  );

  return (
    <div className="min-h-screen bg-transparent font-rajdhani text-[var(--clr-text)]">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col px-3 py-3 sm:px-5 lg:px-6">
        <div className="shrink-0">{headerNode}</div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          <aside className="sidebar-card flex max-h-full shrink-0 flex-col p-3 lg:w-60" aria-label="Patch workflow">
            <div className="px-4 pt-4 pb-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--clr-text-muted)]">Workspace</p>
              <p className="mt-1 text-lg font-bold text-[var(--clr-text)]">Build a patch</p>
            </div>

            <nav className="overflow-y-auto grid grid-cols-2 gap-2 px-1 pt-1 lg:grid-cols-1" aria-label="Patch sections">
              {workflowTabs.map((tab) => {
                const active = currentView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentView(tab.id)}
                    disabled={anyOperationLoading && !['sqlOutput'].includes(tab.id)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      active
                        ? 'bg-[var(--clr-primary)]/20 text-[var(--clr-accent)] ring-1 ring-[var(--clr-primary)]/40'
                        : 'text-[var(--clr-text-muted)] hover:bg-[var(--clr-primary)]/10 hover:text-[var(--clr-text)]'
                    }`}
                  >
                    <i className={`fas ${tab.icon} w-5 text-center`} aria-hidden="true" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-[var(--clr-border)] pt-4">
              <button
                onClick={handleGenerateSql}
                disabled={isLoadingSql || anyOperationLoading}
                className="btn-primary flex w-full items-center justify-center gap-2 px-3 py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
              >
                <i className={`fas ${isLoadingSql ? 'fa-spinner fa-spin' : 'fa-file-code'}`} aria-hidden="true" />
                {isLoadingSql ? 'Generating...' : 'Generate SQL Patch'}
              </button>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={handleResetForm}
                  disabled={anyOperationLoading}
                  className="btn-danger flex items-center justify-center gap-2 px-2 py-2 text-xs font-bold uppercase tracking-wide disabled:opacity-50"
                >
                  <i className="fas fa-rotate-left" aria-hidden="true" />
                  Reset
                </button>
                <button
                  onClick={() => setShowSaveLoadModal(true)}
                  disabled={!loginSystemEnabled || !currentUser || anyOperationLoading}
                  className="btn-secondary flex items-center justify-center gap-2 px-2 py-2 text-xs font-bold uppercase tracking-wide disabled:opacity-40"
                  title={!currentUser ? 'Sign in to use cloud saves' : 'Cloud saves'}
                >
                  <i className="fas fa-cloud-arrow-up" aria-hidden="true" />
                  Saves
                </button>
                <button
                  onClick={() => setShowVersionNotesModal(true)}
                  disabled={anyOperationLoading}
                  className="btn-secondary flex items-center justify-center gap-2 px-2 py-2 text-xs font-bold uppercase tracking-wide disabled:opacity-50"
                >
                  <i className="fas fa-circle-info" aria-hidden="true" />
                  Notes
                </button>
                <button
                  onClick={() => setShowReportBugModal(true)}
                  disabled={anyOperationLoading}
                  className="btn-secondary flex items-center justify-center gap-2 px-2 py-2 text-xs font-bold uppercase tracking-wide disabled:opacity-50"
                >
                  <i className="fas fa-bug" aria-hidden="true" />
                  Report
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-2 border-t border-[var(--clr-border)] pt-3 pb-1">
              <p className="text-center text-[11px] leading-snug text-[var(--clr-text-muted)]">
                {generatedSql ? 'SQL is ready to copy or download.' : 'Edit a card, then generate your patch.'}
              </p>
              <div className="flex items-center justify-between gap-2 px-1">
                <p className="text-[11px] font-medium text-[var(--clr-text-muted)]">{currentAppVersion}</p>
                <div className="flex items-center gap-2">
                  {lastSavedTime ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400/80">
                      <i className="fas fa-circle text-[5px]" />
                      {formatTimeAgo(lastSavedTime)}
                    </span>
                  ) : (
                    <span className="text-[10px] opacity-30">auto-save idle</span>
                  )}
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
};
