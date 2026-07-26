import { useEffect, useRef, useCallback, useState } from 'react';
import { DokkanPatchState } from '../types';
import { getInitialPatchState } from './usePatchState';

const AUTOSAVE_KEY = 'dokkan_patcher_autosave';
const AUTOSAVE_TIMESTAMP_KEY = 'dokkan_patcher_autosave_timestamp';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const DEBOUNCE_MS = 2000; // 2 second debounce after last state change

export const clearAutoSaveFromStorage = (): void => {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
    localStorage.removeItem(AUTOSAVE_TIMESTAMP_KEY);
  } catch {
    // Silently ignore storage errors
  }
};

export const getAutoSaveFromStorage = (): {
  state: DokkanPatchState;
  timestamp: number;
} | null => {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    const timestamp = localStorage.getItem(AUTOSAVE_TIMESTAMP_KEY);
    if (!saved || !timestamp) return null;
    const state = JSON.parse(saved) as DokkanPatchState;
    return { state, timestamp: parseInt(timestamp, 10) };
  } catch (err) {
    console.error('[AutoSave] Failed to read from storage:', err);
    clearAutoSaveFromStorage();
    return null;
  }
};

const isEmptyState = (state: DokkanPatchState): boolean => {
  const initial = getInitialPatchState();
  return (
    state.cardForms.length <= 1 &&
    state.cardForms.every((c) => c.name === '' && c.id === initial.cardForms[0].id) &&
    state.passiveSkillSets.length === 0 &&
    state.leaderSkillSets.length === 0 &&
    state.specialSets.length === 0 &&
    state.activeSkillSets.length === 0 &&
    state.standbySkillSets.length === 0 &&
    state.finishSkillSets.length === 0
  );
};

interface UseAutoSaveResult {
  restoreAutoSave: () => DokkanPatchState | null;
  clearAutoSave: () => void;
  foundAutoSave: boolean;
  lastAutoSaveTime: Date | null;
  lastSavedTime: Date | null;
}

export const useAutoSave = (
  patchState: DokkanPatchState
): UseAutoSaveResult => {
  const [foundAutoSave, setFoundAutoSave] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<Date | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const patchStateRef = useRef(patchState);
  patchStateRef.current = patchState;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDataRef = useRef(false);

  // Check for auto-save on mount (runs once)
  useEffect(() => {
    const existing = getAutoSaveFromStorage();
    if (existing && !isEmptyState(existing.state)) {
      console.log(
        '[AutoSave] Found saved state from',
        new Date(existing.timestamp).toLocaleTimeString()
      );
      setFoundAutoSave(true);
      setLastAutoSaveTime(new Date(existing.timestamp));
    }
  }, []);

  const persist = useCallback(() => {
    const current = patchStateRef.current;
    if (isEmptyState(current)) {
      console.log('[AutoSave] Skipped — state is empty');
      return;
    }
    try {
      const serialized = JSON.stringify(current);
      localStorage.setItem(AUTOSAVE_KEY, serialized);
      localStorage.setItem(AUTOSAVE_TIMESTAMP_KEY, String(Date.now()));
      setLastSavedTime(new Date());
      console.log(
        '[AutoSave] Saved successfully —',
        (serialized.length / 1024).toFixed(1),
        'KB'
      );
    } catch (err) {
      console.error('[AutoSave] Failed to write to storage:', err);
    }
  }, []);

  const restoreAutoSave = useCallback((): DokkanPatchState | null => {
    const existing = getAutoSaveFromStorage();
    if (!existing || isEmptyState(existing.state)) return null;
    // Don't clear storage here — let the caller clear after successful load
    setFoundAutoSave(false);
    setLastAutoSaveTime(null);
    return existing.state;
  }, []);

  const clearAutoSave = useCallback(() => {
    console.log('[AutoSave] Cleared from storage');
    clearAutoSaveFromStorage();
    setFoundAutoSave(false);
    setLastAutoSaveTime(null);
    setLastSavedTime(null);
  }, []);

  // ── Trigger 1: Debounced save on every state change (most reliable) ──
  useEffect(() => {
    if (isEmptyState(patchState)) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      persist();
      debounceRef.current = null;
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [patchState, persist]);

  // ── Trigger 2: Periodic interval (backup) ──
  useEffect(() => {
    const hasData = !isEmptyState(patchState);

    if (hasData && !hasDataRef.current) {
      console.log('[AutoSave] Data detected — starting periodic interval');
      hasDataRef.current = true;
      intervalRef.current = setInterval(persist, AUTOSAVE_INTERVAL);
    } else if (!hasData && hasDataRef.current) {
      console.log('[AutoSave] State cleared — stopping periodic interval');
      hasDataRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [patchState, persist]);

  // Cleanup interval + debounce on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Trigger 3: Save on tab hidden (visibility change) ──
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('[AutoSave] Tab hidden — saving');
        persist();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [persist]);

  // ── Trigger 4: Save on page close / refresh ──
  useEffect(() => {
    const onUnload = () => {
      console.log('[AutoSave] Page unloading — saving');
      persist();
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [persist]);

  return { restoreAutoSave, clearAutoSave, foundAutoSave, lastAutoSaveTime, lastSavedTime };
};
