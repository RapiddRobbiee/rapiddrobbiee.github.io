import React from 'react';
import { Settings, Tab } from '../types';
import { logAnalyticsEvent } from '../services/analyticsService';
import { User } from '../services/authService';
import { currentAppVersion } from '../versionNotes';
import { useToast } from '../context/ToastContext';

interface SidebarProps {
  sidebarWidth: number;
  tabs: Tab[];
  currentView: string;
  setCurrentView: (tabId: string) => void;
  settings: Settings;
  generatedSql: string;
  handleGenerateSql: () => void;
  anyOperationLoading: boolean;
  isLoadingSql: boolean;
  handleResetForm: () => void;
  loginSystemEnabled: boolean;
  currentUser: User | null;
  setShowSaveLoadModal: (show: boolean) => void;
  setShowVersionNotesModal: (show: boolean) => void;
  setShowReportBugModal: (show: boolean) => void;
  resizeHandleRef: React.RefObject<HTMLDivElement | null>;
  handleMouseDown: (e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarWidth,
  tabs,
  currentView,
  setCurrentView,
  settings,
  generatedSql,
  handleGenerateSql,
  anyOperationLoading,
  isLoadingSql,
  handleResetForm,
  loginSystemEnabled,
  currentUser,
  setShowSaveLoadModal,
  setShowVersionNotesModal,
  setShowReportBugModal,
  resizeHandleRef,
  handleMouseDown,
}) => {
  const { addToast } = useToast();
  return (
    <aside style={{ width: `${sidebarWidth}%` }} className="p-4 card flex flex-col relative">
      <nav className="space-y-2 flex-grow">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (
                settings.autoGenerateSqlOnTabSwitch &&
                tab.id === 'sqlOutput' &&
                generatedSql === ''
              ) {
                handleGenerateSql();
              }
              setCurrentView(tab.id);
              logAnalyticsEvent('view_tab', { tab_name: tab.id });
            }}
            className={`w-full text-left px-4 py-3 rounded-md transition-all duration-200 ease-in-out font-semibold text-lg relative overflow-hidden group
                ${currentView === tab.id
                ? 'bg-[var(--clr-primary)] bg-opacity-20 text-[var(--clr-text)]'
                : 'bg-transparent hover:bg-[var(--clr-primary)] hover:bg-opacity-10 hover:text-[var(--clr-text)]'
              }`}
            disabled={
              anyOperationLoading && currentView !== 'sqlOutput' && currentView !== 'sqlConverter'
            }
          >
            <span
              className={`absolute left-0 top-0 h-full w-1 bg-[var(--clr-accent)] transition-transform duration-300 ease-out ${currentView === tab.id ? 'transform scale-y-100' : 'transform scale-y-0'} group-hover:scale-y-100`}
            ></span>
            <i
              className={`fas ${tab.icon} mr-3 w-5 text-center transition-colors duration-200`}
            ></i>
            {tab.name}
          </button>
        ))}
        <div className="mt-4 space-y-3 pt-4 border-t border-[var(--clr-border)]">
          <button
            onClick={handleGenerateSql}
            disabled={isLoadingSql || anyOperationLoading}
            className="w-full btn-primary py-3 px-4 disabled:opacity-60 flex items-center justify-center text-md"
          >
            {isLoadingSql ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>Generating...
              </>
            ) : (
              <>
                <i className="fas fa-cogs mr-2"></i>Generate SQL Patch
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleResetForm}
              disabled={anyOperationLoading}
              className="w-full btn-danger py-2 px-4 rounded-md disabled:opacity-50 flex items-center justify-center text-sm"
            >
              <i className="fas fa-undo mr-2"></i> Reset
            </button>
            <button
              onClick={() => {
                if (loginSystemEnabled && currentUser) {
                  setShowSaveLoadModal(true);
                  logAnalyticsEvent('open_modal', { modal_name: 'save_load' });
                } else {
                  addToast('Login system is currently disabled or you are not signed in.', { type: 'warning' });
                }
              }}
              disabled={!loginSystemEnabled || !currentUser || anyOperationLoading}
              className="w-full btn-secondary py-2 px-4 rounded-md text-sm disabled:opacity-50 flex items-center justify-center"
              title={
                !loginSystemEnabled || !currentUser
                  ? 'Login to enable cloud saves'
                  : 'Manage Cloud Saves'
              }
            >
              <i className="fas fa-cloud-upload-alt mr-2"></i> Saves
            </button>
            <button
              onClick={() => {
                setShowVersionNotesModal(true);
                logAnalyticsEvent('open_modal', { modal_name: 'version_notes' });
              }}
              disabled={anyOperationLoading}
              className="w-full btn-secondary py-2 px-4 rounded-md text-sm disabled:opacity-50 flex items-center justify-center"
              title="View Version Notes"
            >
              <i className="fas fa-info-circle mr-2"></i> Notes
            </button>
            <button
              onClick={() => {
                setShowReportBugModal(true);
                logAnalyticsEvent('open_modal', { modal_name: 'report_bug' });
              }}
              disabled={anyOperationLoading}
              className="w-full btn-secondary py-2 px-4 rounded-md text-sm disabled:opacity-50 flex items-center justify-center"
              title="Report a Bug"
            >
              <i className="fas fa-bug mr-2"></i> Report
            </button>

          </div>
          <h1 className='text-center text-sm'>{currentAppVersion} by @RapiddRobbiee</h1>
        </div>
      </nav>
      <div ref={resizeHandleRef} className="resize-handle" onMouseDown={handleMouseDown}></div>
    </aside>
  );
};
