import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../services/authService';
import type { Database as SqlJsDatabase } from 'sql.js';
import { AppSettings, Theme } from '../types';
import { logAnalyticsEvent } from '../services/analyticsService';
import { ENABLE_ECLIPSE_THEME } from '../constants';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  dbInstance: SqlJsDatabase | null;
  setDbInstance: (db: SqlJsDatabase | null) => void;
  isAuthLoading: boolean;
  setIsAuthLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
  appLayout: 'dock',
  autoExpandFirstCard: true,
  defaultAdvancedOpen: false,
  confirmOnDelete: true,
  autoGenerateSqlOnTabSwitch: false,
  enableAnimations: true,
  stickyNavbar: false,
  enableVisualCausalityEditor: false,
  enableReverseSqlImport: false,
  enableStandbyFinishSkills: false,
  syncAlphaBetaEdits: false,
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true); // Default to true, updated by auth service
  const [dbInstance, setDbInstance] = useState<SqlJsDatabase | null>(null);
  const [theme, setTheme] = useState<Theme>('modern');

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const storedSettings = localStorage.getItem('dokkanPatchMakerSettings');
      return storedSettings
        ? { ...defaultSettings, ...JSON.parse(storedSettings) }
        : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  });

  useEffect(() => {
    const activeTheme = ENABLE_ECLIPSE_THEME ? 'eclipse' : theme;
    document.documentElement.setAttribute('data-theme', activeTheme);
    logAnalyticsEvent('theme_changed', { theme_name: activeTheme });
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('dokkanPatchMakerSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (settings.enableAnimations) {
      document.body.classList.remove('animations-disabled');
    } else {
      document.body.classList.add('animations-disabled');
    }
  }, [settings.enableAnimations]);

  const value = {
    currentUser,
    setCurrentUser,
    settings,
    setSettings,
    theme,
    setTheme,
    dbInstance,
    setDbInstance,
    isAuthLoading,
    setIsAuthLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
