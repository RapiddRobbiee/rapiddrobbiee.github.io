import { useEffect, useRef } from 'react';
import type { User } from '../services/authService';
import * as authService from '../services/authService';
import * as firestoreService from '../services/firestoreService';
import { logAnalyticsEvent } from '../services/analyticsService';
import { DokkanPatchState, PlannerSlot } from '../types';

const LOGIN_SYSTEM_ENABLED = true;

interface LegacyPlannerSlot {
  slotId: number;
  card?: any;
  cards?: any[];
}

interface UseAuthParams {
  setCurrentUser: (user: User | null) => void;
  setIsAuthLoading: (loading: boolean) => void;
  setIsPatchLoading: (loading: boolean) => void;
  setGeneratedSql: (sql: string) => void;
  setCurrentView: (view: 'dashboard' | 'planner' | 'miscTables' | 'globalSkillSets' | 'standbyFinish' | 'sqlOutput' | 'sqlConverter' | 'ezaDetails') => void;
  setLastLoadedSlot: (slot: string | null) => void;
  setSelectedCardIndex: (index: number) => void;
  setPlannerSlots: (slots: PlannerSlot[] | ((prev: PlannerSlot[]) => PlannerSlot[])) => void;
  loadPatchState: (state: DokkanPatchState) => void;
  resetPatchState: () => void;
  clearAutoSaveStorage: () => void;
  setIsLoadingPlanner: (loading: boolean) => void;
  addToast: (message: string, opts?: { type?: 'success' | 'error' | 'warning' | 'info'; duration?: number }) => void;
  autoSaveRestoredRef: React.MutableRefObject<boolean>;
}

export const getInitialPlannerSlots = (count: number): PlannerSlot[] => {
  return Array.from({ length: count }, (_, i) => ({
    slotId: i + 1,
    cards: [],
  }));
};

export const useAuth = ({
  setCurrentUser,
  setIsAuthLoading,
  setIsPatchLoading,
  setGeneratedSql,
  setCurrentView,
  setLastLoadedSlot,
  setSelectedCardIndex,
  setPlannerSlots,
  loadPatchState,
  resetPatchState,
  clearAutoSaveStorage,
  setIsLoadingPlanner,
  addToast,
  autoSaveRestoredRef,
}: UseAuthParams): void => {
  const previousUserRef = useRef<User | null>(null);

  useEffect(() => {
    if (LOGIN_SYSTEM_ENABLED) {
      authService.initializeFirebaseApp();
      const unsubscribe = authService.onAuthChange(async (user) => {
        setCurrentUser(user);
        if (user) {
          if (!previousUserRef.current && user) {
            const loginMethod = user.providerData[0]?.providerId || 'unknown';
            logAnalyticsEvent('login', { method: loginMethod });
          }

          // If an autosave was just restored, skip cloud auto-load —
          // the autosave is the user's most recent work.
          if (autoSaveRestoredRef.current) {
            console.log('[useAuth] Autosave restored — skipping cloud auto-load');
            setIsPatchLoading(false);
          } else {
            setIsPatchLoading(true);
            setLastLoadedSlot(null);
            let loadedState: DokkanPatchState | null = null;
            let loadedFromSlot: string | null = null;

            try {
              const slotIds = ['slot1', 'slot2', 'slot3', 'slot4'];
              for (const slotId of slotIds) {
                const slotData = await firestoreService.loadPatchDataFromSlot(user.uid, slotId);
                if (slotData && slotData.patchData) {
                  loadedState = slotData.patchData;
                  loadedFromSlot = slotId;
                  break;
                }
              }

              if (loadedState && loadedFromSlot) {
                clearAutoSaveStorage();
                loadPatchState(loadedState);
                setGeneratedSql('');
                setCurrentView('dashboard');
                setLastLoadedSlot(loadedFromSlot);
                setSelectedCardIndex(0);
              } else {
                // No cloud save found — leave current state alone
                setLastLoadedSlot(null);
              }
            } catch (error) {
              console.error('Error auto-loading patch state from Firestore:', error);
              addToast(
                `Failed to auto-load your saved patch: ${error instanceof Error ? error.message : 'Unknown error'}.`,
                { type: 'error', duration: 6000 }
              );
              setLastLoadedSlot(null);
            } finally {
              setIsPatchLoading(false);
            }
          }

          // Load Planner Data (always runs, regardless of autosave)
          setIsLoadingPlanner(true);
          firestoreService
            .loadPlannerSlots(user.uid)
            .then((loadedSlotsFromDb) => {
              if (loadedSlotsFromDb && loadedSlotsFromDb.length > 0) {
                const migratedSlots = loadedSlotsFromDb.map((slot) => {
                  const legacySlot = slot as unknown as LegacyPlannerSlot;
                  if (!legacySlot.cards && legacySlot.card) {
                    return { ...slot, cards: [legacySlot.card], card: undefined };
                  }
                  if (!slot.cards) {
                    return { ...slot, cards: [] };
                  }
                  return slot;
                });
                setPlannerSlots(migratedSlots);
              }
            })
            .finally(() => {
              setIsLoadingPlanner(false);
            });
        } else {
          // User signed out — leave patch state intact
          setLastLoadedSlot(null);
        }
        previousUserRef.current = user;
        setIsAuthLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsAuthLoading(false);
    }
  }, [
    loadPatchState,
    resetPatchState,
    setCurrentUser,
    setIsAuthLoading,
  ]);
};

export const handleSignOut = async (
  addToast: (message: string, opts?: { type?: 'success' | 'error' | 'warning' | 'info'; duration?: number }) => void,
): Promise<void> => {
  try {
    await authService.logout();
    logAnalyticsEvent('sign_out');
    addToast('Signed out successfully.', { type: 'success' });
  } catch (error) {
    console.error('Sign out error:', error);
    addToast(`Failed to sign out: ${error instanceof Error ? error.message : 'Unknown error'}`, { type: 'error' });
  }
};
