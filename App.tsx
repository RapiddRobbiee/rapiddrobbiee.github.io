import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppContext } from './context/AppContext';
import { useToast } from './context/ToastContext';
import { usePatchState, synchronizeDerivedCardSkillEntries } from './hooks/usePatchState';
import { useAutoSave } from './hooks/useAutoSave';
import { useAuth, handleSignOut as authHandleSignOut, getInitialPlannerSlots } from './hooks/useAuth';
import * as firestoreService from './services/firestoreService';
import {
  DokkanPatchState,
  CardForm,
  CardUniqueInfo,
  PassiveSkillSet,
  LeaderSkillSet,
  SpecialSet,
  ActiveSkillSet,
  DokkanID,
  CardSpecial,
  CardActiveSkill,
  StandbySkillSet,
  CardStandbySkill,
  ActiveSkillEffect,
  PlannerSlot,
  Theme,
} from './types';
import {
  INITIAL_CARD_FORM,
  generateLocalId,
  ELEMENT_TYPES,
  RARITY_TYPES,
  ID_PREFIXES,
  isLocallyGeneratedId,
  INITIAL_CARD_SPECIAL,
  INITIAL_ACTIVE_SKILL_EFFECT,
  INITIAL_PASSIVE_SKILL,
  INITIAL_LEADER_SKILL,
  INITIAL_SPECIAL_SKILL,
  INITIAL_STANDBY_SKILL,
} from './constants';
import { generateSqlPatch } from './services/sqlGenerator';
import { MainContent } from './components/MainContent';
import { LoadCharacterModal } from './components/LoadCharacterModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import * as dbService from './services/databaseService';
import { LoginScreen } from './components/LoginScreen';
import { logAnalyticsEvent } from './services/analyticsService';
import { VersionNotesModal } from './components/VersionNotesModal';
import { ReportBugModal } from './components/ReportBugModal';
import { currentAppVersion } from './versionNotes';
import { SettingsModal } from './components/SettingsModal';
import { NewsBanner } from './components/NewsBanner';
import { getActiveBanners, getDismissedBannerIds, dismissBanner } from './newsBanners';
import { ImportSqlModal } from './components/ImportSqlModal';
import { FolderImportModal } from './components/FolderImportModal';
import { LayoutDock } from './components/layouts/LayoutDock';

// const aiClientApiKey = process.env.API_KEY; // Gemini disabled
const LOGIN_SYSTEM_ENABLED = true;

const THEMES: { id: Theme; name: string; colorClass: string }[] = [
  { id: 'classic', name: 'Classic', colorClass: 'bg-orange-500' },
  { id: 'modern', name: 'Modern', colorClass: 'bg-blue-500' },
  { id: 'shenron', name: 'Emerald', colorClass: 'bg-green-500' },
  { id: 'buu', name: 'Bubblegum', colorClass: 'bg-pink-500' },
  { id: 'vegeta', name: 'Regal', colorClass: 'bg-blue-800' },
  { id: 'supersaiyan', name: 'Aura', colorClass: 'bg-yellow-400' },
  { id: 'frieza', name: 'Amethyst', colorClass: 'bg-purple-500' },
  { id: 'cell', name: 'Bio-Lume', colorClass: 'bg-lime-500' },
  { id: 'zamasu', name: 'Glitch', colorClass: 'bg-purple-700' },
  { id: 'blackfrieza', name: 'Monochrome', colorClass: 'bg-black' },
  {
    id: 'cosmicrift',
    name: 'Cosmic Rift',
    colorClass: 'bg-gradient-to-br from-indigo-500 to-purple-600',
  },
  {
    id: 'dragonradar',
    name: 'Dragon Radar',
    colorClass: 'bg-gradient-to-br from-amber-500 to-lime-600',
  },
  {
    id: 'destroyer',
    name: 'Destroyer',
    colorClass: 'bg-gradient-to-br from-fuchsia-600 to-purple-800',
  },
  { id: 'crimson', name: 'Crimson', colorClass: 'bg-gradient-to-br from-red-500 to-rose-700' },
  { id: 'maple', name: 'Maple', colorClass: 'bg-gradient-to-br from-amber-600 to-orange-800' },
];



// Fix: Changed to named export
export const App: React.FC = () => {
  const {
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
  } = useAppContext();

  const { addToast } = useToast();

  const { patchState, setPatchState, loadPatchState, resetPatchState } = usePatchState();
  const { clearAutoSave: clearAutoSaveStorage, restoreAutoSave, foundAutoSave, lastAutoSaveTime, lastSavedTime } = useAutoSave(patchState);

  // Restore auto-save on mount (before cloud save auto-load can override)
  const autoSaveRestoredRef = useRef(false);
  useEffect(() => {
    if (foundAutoSave && !autoSaveRestoredRef.current) {
      const savedState = restoreAutoSave();
      if (savedState) {
        autoSaveRestoredRef.current = true;
        loadPatchState(savedState);
        clearAutoSaveStorage(); // Clear after successful load (restore no longer clears)
        setGeneratedSql('');
        setLastLoadedSlot(null);
        const timeStr = lastAutoSaveTime?.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        });
        addToast(`Auto-saved patch recovered from ${timeStr}`, { type: 'info', duration: 4000 });
      }
    }
  }, [foundAutoSave]);

  const [plannerSlots, setPlannerSlots] = useState<PlannerSlot[]>(getInitialPlannerSlots(4));
  const [isSavingPlanner, setIsSavingPlanner] = useState<boolean>(false);
  const [isLoadingPlanner, setIsLoadingPlanner] = useState<boolean>(false);

  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [isLoadingSql, setIsLoadingSql] = useState<boolean>(false);
  const [isPatchLoading, setIsPatchLoading] = useState<boolean>(false);

  const [isSavingSlot, setIsSavingSlot] = useState<Record<string, boolean>>({});
  const [lastLoadedSlot, setLastLoadedSlot] = useState<string | null>(null);
  const [showSaveLoadModal, setShowSaveLoadModal] = useState<boolean>(false);
  const [showVersionNotesModal, setShowVersionNotesModal] = useState<boolean>(false);
  const [showReportBugModal, setShowReportBugModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showImportSqlModal, setShowImportSqlModal] = useState<boolean>(false);
  const [showFolderImportModal, setShowFolderImportModal] = useState<boolean>(false);
  const [dismissedBannerIds, setDismissedBannerIds] = useState<string[]>([]);
  // const [theme, setTheme] = useState<Theme>('modern');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'planner' | 'miscTables' | 'globalSkillSets' | 'standbyFinish' | 'sqlOutput' | 'sqlConverter' | 'ezaDetails'>('dashboard');
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showLoadCharacterModal, setShowLoadCharacterModal] = useState<boolean>(false);
  const [loadModalMode, setLoadModalMode] = useState<'patch' | 'planner'>('patch');
  const [plannerLoadTargetSlot, setPlannerLoadTargetSlot] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setDismissedBannerIds(getDismissedBannerIds());
  }, []);

  const handleBannerDismiss = useCallback((bannerId: string) => {
    dismissBanner(bannerId);
    setDismissedBannerIds(getDismissedBannerIds());
  }, []);

  // Auth: firebase auth state + cloud save auto-load
  useAuth({
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
  });

  // Manage selected card index when cards are added/removed
  useEffect(() => {
    if (selectedCardIndex >= patchState.cardForms.length && patchState.cardForms.length > 0) {
      setSelectedCardIndex(patchState.cardForms.length - 1);
    } else if (patchState.cardForms.length === 0) {
      setSelectedCardIndex(0);
    }
  }, [patchState.cardForms.length, selectedCardIndex]);

  const handleSignOut = () => authHandleSignOut(addToast);

  const handleExportJson = () => {
    const dataStr = JSON.stringify(patchState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dokkan-patch-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    logAnalyticsEvent('export_json');
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const parsedState = JSON.parse(json);
        // Basic validation: check if it has cardForms array
        if (!parsedState.cardForms || !Array.isArray(parsedState.cardForms)) {
          throw new Error('Invalid patch file format');
        }

        setPatchState(parsedState);
        setGeneratedSql('');
        setLastLoadedSlot(null);
        if (settings.autoExpandFirstCard)
        setSelectedCardIndex(0);

        logAnalyticsEvent('import_json');
        addToast('Patch data imported successfully!', { type: 'success' });
      } catch (error) {
        console.error('Error importing JSON:', error);
        addToast('Failed to import JSON file. Please ensure it is a valid Dokkan Patcher export.', { type: 'error' });
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setIsProfileDropdownOpen(false); // Close profile dropdown if open
  };

  const handleDbFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsDbLoading(true);
    setDbError(null);
    setDbInstance(null);
    try {
      const loadedDb = await dbService.loadDatabase(file);
      setDbInstance(loadedDb);
      logAnalyticsEvent('db_file_loaded', { file_size: file.size });
      addToast('Database loaded successfully!', { type: 'success' });
    } catch (err) {
      console.error('Error loading database:', err);
      setDbError(err instanceof Error ? err.message : 'Unknown error loading database.');
      logAnalyticsEvent('db_file_load_failed');
      addToast(`Error loading database: ${err instanceof Error ? err.message : 'Unknown error'}`, { type: 'error' });
    } finally {
      setIsDbLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCharacterLoaded = (loadedCharacterPatchState: DokkanPatchState) => {
    const synchronizedState = synchronizeDerivedCardSkillEntries(loadedCharacterPatchState);
    setPatchState((prev) => ({
      ...prev, // Keep existing SQL converter state
      ...synchronizedState,
    }));
    setGeneratedSql('');
    setCurrentView('dashboard');
    setShowLoadCharacterModal(false);
    setLastLoadedSlot(null);
    setSelectedCardIndex(0);
    logAnalyticsEvent('character_loaded_from_db', {
      card_id: synchronizedState.cardForms[0]?.id,
      card_name_length: synchronizedState.cardForms[0]?.name?.length,
    });
    addToast(
      `Character "${synchronizedState.cardForms[0]?.name || 'Unknown'}" loaded successfully! Remember to save to a cloud slot if needed.`,
      { type: 'success', duration: 5000 }
    );
  };

  const handleCharacterLoadedForPlanner = async (cardId: DokkanID) => {
    if (!dbInstance || plannerLoadTargetSlot === null) return;
    try {
      const plannedCard = await dbService.getCharacterForPlanner(dbInstance, cardId);
      if (plannedCard) {
        setPlannerSlots((prevSlots) =>
          prevSlots.map((slot) => {
            if (slot.slotId === plannerLoadTargetSlot) {
              const newCards = [...slot.cards, plannedCard];
              return { ...slot, cards: newCards };
            }
            return slot;
          })
        );
        logAnalyticsEvent('character_loaded_for_planner', {
          card_id: cardId,
          slot_id: plannerLoadTargetSlot,
        });
        setShowLoadCharacterModal(false);
      } else {
        addToast(`Failed to load and format character ${cardId} for the planner.`, { type: 'error' });
      }
    } catch (error) {
      addToast(`Error loading character for planner: ${error}`, { type: 'error' });
    }
  };

  const openLoadModalForPatch = () => {
    if (!dbInstance) {
      addToast('Please load a database file first.', { type: 'warning' });
      return;
    }
    setLoadModalMode('patch');
    setShowLoadCharacterModal(true);
    logAnalyticsEvent('open_modal', { modal_name: 'load_character_patch' });
  };

  const openLoadModalForPlanner = (slotId: number) => {
    if (!dbInstance) {
      addToast('Please load a database file first.', { type: 'warning' });
      return;
    }
    setLoadModalMode('planner');
    setPlannerLoadTargetSlot(slotId);
    setShowLoadCharacterModal(true);
    logAnalyticsEvent('open_modal', { modal_name: 'load_character_planner', slot_id: slotId });
  };

  const updateCardForm = useCallback(
    (index: number, updatedForm: CardForm) => {
      setPatchState((prev) => {
        const oldForm = prev.cardForms[index];
        const newPatchState = { ...prev };
        const updatedCardForms = prev.cardForms.map((form, i) =>
          i === index ? updatedForm : form
        );
        newPatchState.cardForms = updatedCardForms;

        const currentCardId = updatedForm.id;
        const oldCardId = oldForm.id;

        // Handle Card ID change for associated entities
        if (oldCardId !== currentCardId && isLocallyGeneratedId(oldCardId)) {
          const newCardId = currentCardId;

          // Update CardUniqueInfo
          const oldUniqueInfoId = ID_PREFIXES.CARD_UNIQUE_INFO + oldCardId;
          if (isLocallyGeneratedId(oldUniqueInfoId)) {
            const newUniqueInfoId = ID_PREFIXES.CARD_UNIQUE_INFO + newCardId;
            newPatchState.cardUniqueInfos = prev.cardUniqueInfos.map((cui) =>
              cui.id === oldUniqueInfoId ? { ...cui, id: newUniqueInfoId } : cui
            );
            if (updatedForm.card_unique_info_id === oldUniqueInfoId) {
              updatedForm.card_unique_info_id = newUniqueInfoId;
            }
          }

          const skillSetTypesToUpdate: {
            key: keyof DokkanPatchState;
            idField: keyof CardForm;
            prefix: (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];
          }[] = [
              {
                key: 'passiveSkillSets',
                idField: 'passive_skill_set_id',
                prefix: ID_PREFIXES.PASSIVE_SKILL_SET,
              },
              {
                key: 'leaderSkillSets',
                idField: 'leader_skill_set_id',
                prefix: ID_PREFIXES.LEADER_SKILL_SET,
              },
            ];

          skillSetTypesToUpdate.forEach((skillInfo) => {
            const oldSetId = skillInfo.prefix + oldCardId;
            if (
              isLocallyGeneratedId(oldSetId) &&
              (oldForm[skillInfo.idField] as string) === oldSetId
            ) {
              const newSetId = skillInfo.prefix + newCardId;
              (newPatchState[skillInfo.key] as Array<{ id: DokkanID }>) = (
                prev[skillInfo.key] as Array<{ id: DokkanID }>
              ).map((set) => (set.id === oldSetId ? { ...set, id: newSetId } : set));

              if (skillInfo.idField !== 'id') {
                (updatedForm[skillInfo.idField] as string) = newSetId;
              }
            }
          });

          // Update SpecialSet and CardSpecials
          const oldSpecialSetId = ID_PREFIXES.SPECIAL_SET + oldCardId;
          if (isLocallyGeneratedId(oldSpecialSetId)) {
            const newSpecialSetId = ID_PREFIXES.SPECIAL_SET + newCardId;
            newPatchState.specialSets = prev.specialSets.map((set) =>
              set.id === oldSpecialSetId ? { ...set, id: newSpecialSetId } : set
            );
            newPatchState.cardSpecials = newPatchState.cardSpecials.map((cs) =>
              cs.card_id === oldCardId && cs.special_set_id === oldSpecialSetId
                ? { ...cs, card_id: newCardId, special_set_id: newSpecialSetId }
                : cs.card_id === oldCardId
                  ? { ...cs, card_id: newCardId }
                  : cs
            );
          } else {
            newPatchState.cardSpecials = newPatchState.cardSpecials.map((cs) =>
              cs.card_id === oldCardId ? { ...cs, card_id: newCardId } : cs
            );
          }

          // Update EZA if baseCardIdForEZA was the one changed
          if (prev.isEZA && prev.optimalAwakeningGrowth && prev.baseCardIdForEZA === oldCardId) {
            const updatedOag = { ...prev.optimalAwakeningGrowth };
            const newOagRowId =
              ID_PREFIXES.OPTIMAL_AWAKENING_GROWTH_ID + newCardId.slice(0, -1) + '0';
            const newOagTypeId = newCardId.slice(0, -1) + '0';

            if (
              isLocallyGeneratedId(updatedOag.id) ||
              updatedOag.id.endsWith(oldCardId.slice(0, -1) + '0')
            ) {
              updatedOag.id = newOagRowId;
            }
            if (
              isLocallyGeneratedId(updatedOag.optimal_awakening_grow_type) ||
              updatedOag.optimal_awakening_grow_type === oldCardId.slice(0, -1) + '0'
            ) {
              updatedOag.optimal_awakening_grow_type = newOagTypeId;
            }
            newPatchState.optimalAwakeningGrowth = updatedOag;
            newPatchState.baseCardIdForEZA = newCardId;
          }
        }

        // Consistently update cardForms array with the potentially modified updatedForm
        // This needs to be done before active/standby skill processing if they rely on updatedForm fields directly.
        newPatchState.cardForms = newPatchState.cardForms.map((form, i) =>
          i === index ? updatedForm : form
        );

        // Handle cardActiveSkills updates
        const activeSkillSetIdRef = updatedForm.active_skill_set_id_ref;
        newPatchState.cardActiveSkills = newPatchState.cardActiveSkills || [];
        if (oldCardId !== currentCardId) {
          newPatchState.cardActiveSkills = newPatchState.cardActiveSkills.filter(
            (cas) => cas.card_id !== oldCardId
          );
        }
        newPatchState.cardActiveSkills = newPatchState.cardActiveSkills.filter(
          (cas) =>
            !(
              cas.card_id === currentCardId &&
              (cas.active_skill_set_id !== activeSkillSetIdRef ||
                !activeSkillSetIdRef ||
                activeSkillSetIdRef.trim() === '')
            )
        );
        if (activeSkillSetIdRef && activeSkillSetIdRef.trim() !== '') {
          const existingEntryIndex = newPatchState.cardActiveSkills.findIndex(
            (cas) =>
              cas.card_id === currentCardId && cas.active_skill_set_id === activeSkillSetIdRef
          );
          if (existingEntryIndex === -1) {
            newPatchState.cardActiveSkills.push({
              id: `${currentCardId}${activeSkillSetIdRef}`,
              card_id: currentCardId,
              active_skill_set_id: activeSkillSetIdRef,
            });
          } else {
            // Ensure ID is correct if card ID changed
            newPatchState.cardActiveSkills[existingEntryIndex].id =
              `${currentCardId}${activeSkillSetIdRef}`;
          }
        }

        // Handle cardStandbySkills updates
        const standbySkillSetIdRef = updatedForm.standby_skill_set_id_ref;
        newPatchState.cardStandbySkills = newPatchState.cardStandbySkills || [];
        if (oldCardId !== currentCardId) {
          newPatchState.cardStandbySkills = newPatchState.cardStandbySkills.filter(
            (css) => css.card_id !== oldCardId
          );
        }
        newPatchState.cardStandbySkills = newPatchState.cardStandbySkills.filter(
          (css) =>
            !(
              css.card_id === currentCardId &&
              (css.standby_skill_set_id !== standbySkillSetIdRef ||
                !standbySkillSetIdRef ||
                standbySkillSetIdRef.trim() === '')
            )
        );
        if (standbySkillSetIdRef && standbySkillSetIdRef.trim() !== '') {
          const existingEntryIndex = newPatchState.cardStandbySkills.findIndex(
            (css) =>
              css.card_id === currentCardId && css.standby_skill_set_id === standbySkillSetIdRef
          );
          if (existingEntryIndex === -1) {
            newPatchState.cardStandbySkills.push({
              id: `${currentCardId}${standbySkillSetIdRef}`,
              card_id: currentCardId,
              standby_skill_set_id: standbySkillSetIdRef,
            });
          } else {
            newPatchState.cardStandbySkills[existingEntryIndex].id =
              `${currentCardId}${standbySkillSetIdRef}`;
          }
        }

        // Sync Active Skill Sets definitions if card ID changed and a local set was tied to it
        if (oldCardId !== currentCardId && isLocallyGeneratedId(oldCardId)) {
          const oldActiveSetId = ID_PREFIXES.ACTIVE_SKILL_SET + oldCardId;
          if (
            isLocallyGeneratedId(oldActiveSetId) &&
            oldForm.active_skill_set_id_ref === oldActiveSetId
          ) {
            const newActiveSetId = ID_PREFIXES.ACTIVE_SKILL_SET + currentCardId;
            newPatchState.activeSkillSets = (prev.activeSkillSets || []).map((set) =>
              set.id === oldActiveSetId ? { ...set, id: newActiveSetId } : set
            );
            // Ensure the updatedForm.active_skill_set_id_ref (which is `activeSkillSetIdRef`) reflects this change if it was pointing to the old local ID.
            if (updatedForm.active_skill_set_id_ref === oldActiveSetId) {
              updatedForm.active_skill_set_id_ref = newActiveSetId;
              // Re-update cardForms array because updatedForm might have changed
              newPatchState.cardForms = newPatchState.cardForms.map((form, i) =>
                i === index ? updatedForm : form
              );
            }
          }
        }

        // Sync Standby Skill Sets definitions if card ID changed
        if (oldCardId !== currentCardId && isLocallyGeneratedId(oldCardId)) {
          const oldStandbySetId = ID_PREFIXES.STANDBY_SKILL_SET + oldCardId;
          if (
            isLocallyGeneratedId(oldStandbySetId) &&
            oldForm.standby_skill_set_id_ref === oldStandbySetId
          ) {
            const newStandbySetId = ID_PREFIXES.STANDBY_SKILL_SET + currentCardId;
            newPatchState.standbySkillSets = (prev.standbySkillSets || []).map((set) =>
              set.id === oldStandbySetId ? { ...set, id: newStandbySetId } : set
            );
            if (updatedForm.standby_skill_set_id_ref === oldStandbySetId) {
              updatedForm.standby_skill_set_id_ref = newStandbySetId;
              newPatchState.cardForms = newPatchState.cardForms.map((form, i) =>
                i === index ? updatedForm : form
              );
            }
          }
        }

        return newPatchState;
      });
      setLastLoadedSlot(null);
    },
    [setPatchState]
  );

  const addCardForm = useCallback(() => {
    const newCardFormId = generateLocalId();

    const newUniqueInfoId = ID_PREFIXES.CARD_UNIQUE_INFO + newCardFormId;
    const newPassiveSetId = ID_PREFIXES.PASSIVE_SKILL_SET + newCardFormId;
    const newLeaderSetId = ID_PREFIXES.LEADER_SKILL_SET + newCardFormId;
    const newActiveSetId = ID_PREFIXES.ACTIVE_SKILL_SET + newCardFormId;
    const newStandbySetId = ID_PREFIXES.STANDBY_SKILL_SET + newCardFormId;
    const newSpecialSetId = ID_PREFIXES.SPECIAL_SET + newCardFormId;

    const newCardForm: CardForm = {
      ...INITIAL_CARD_FORM(),
      id: newCardFormId,
      name: `New Card ${newCardFormId}`,
      card_unique_info_id: newUniqueInfoId,
      passive_skill_set_id: newPassiveSetId,
      leader_skill_set_id: newLeaderSetId,
      active_skill_set_id_ref: newActiveSetId,
      standby_skill_set_id_ref: newStandbySetId,
    };

    const newUniqueInfo: CardUniqueInfo = {
      id: newUniqueInfoId,
      name: `Character Name for ${newCardFormId}`,
    };
    const newPassiveSet: PassiveSkillSet = {
      id: newPassiveSetId,
      name: `Passive for ${newCardFormId}`,
      skills: [],
    }; // Removed description
    const newLeaderSet: LeaderSkillSet = {
      id: newLeaderSetId,
      name: `Leader for ${newCardFormId}`,
      skills: [],
    }; // Removed description

    const defaultActiveSkillEffect: ActiveSkillEffect = {
      ...INITIAL_ACTIVE_SKILL_EFFECT(),
      id: newActiveSetId + '1', // Default first effect ID
      active_skill_set_id: newActiveSetId,
    };
    const newActiveSet: ActiveSkillSet = {
      id: newActiveSetId,
      name: `Active for ${newCardFormId}`,
      effect_description: '',
      condition_description: '',
      turn: 1,
      exec_limit: 1,
      skills: [defaultActiveSkillEffect],
      costume_special_view_id: 0,
    };
    const newStandbySet: StandbySkillSet = {
      id: newStandbySetId,
      name: `Standby for ${newCardFormId}`,
      ingame_icon_path: '',
      effect_description: '',
      condition_description: '',
      exec_limit: 1,
      skills: [], // Standby skills can be added later via editor
      costume_special_view_id: 0,
    };
    const newSpecialSet: SpecialSet = {
      id: newSpecialSetId,
      name: `Special for ${newCardFormId}`,
      skills: [],
      aim_target: 0,
      increase_rate: 180,
      lv_bonus: 25,
      is_inactive: 0,
    }; // Removed description

    const newDefaultCardSpecial = INITIAL_CARD_SPECIAL(newCardFormId, newSpecialSetId);
    const newCardActiveSkill: CardActiveSkill = {
      id: `${newCardFormId}${newActiveSetId}`,
      card_id: newCardFormId,
      active_skill_set_id: newActiveSetId,
    };
    const newCardStandbySkill: CardStandbySkill = {
      id: `${newCardFormId}${newStandbySetId}`,
      card_id: newCardFormId,
      standby_skill_set_id: newStandbySetId,
    };

    setPatchState((prev) => ({
      ...prev,
      cardForms: [...prev.cardForms, newCardForm],
      cardUniqueInfos: [...prev.cardUniqueInfos, newUniqueInfo],
      passiveSkillSets: [...prev.passiveSkillSets, newPassiveSet],
      leaderSkillSets: [...prev.leaderSkillSets, newLeaderSet],
      activeSkillSets: [...(prev.activeSkillSets || []), newActiveSet],
      standbySkillSets: [...(prev.standbySkillSets || []), newStandbySet],
      specialSets: [...prev.specialSets, newSpecialSet],
      cardSpecials: [...prev.cardSpecials, newDefaultCardSpecial],
      cardActiveSkills: [...(prev.cardActiveSkills || []), newCardActiveSkill],
      cardStandbySkills: [...(prev.cardStandbySkills || []), newCardStandbySkill],
    }));

    setSelectedCardIndex(patchState.cardForms.length);

    logAnalyticsEvent('add_card_form', { new_card_id: newCardFormId });
    setLastLoadedSlot(null);
    setSelectedCardIndex(patchState.cardForms.length);
    setCurrentView('dashboard');
  }, [patchState.cardForms.length, settings, setPatchState, setSelectedCardIndex, setCurrentView]);

  const removeCardForm = useCallback(
    (index: number, cardIdToRemove: DokkanID) => {
      const cardNameToConfirm = patchState.cardForms[index]?.name || `Card at index ${index}`;
      if (
        settings.confirmOnDelete &&
        !window.confirm(
          `Are you sure you want to remove "${cardNameToConfirm}"? This action cannot be undone.`
        )
      ) {
        return;
      }
      setPatchState((prev) => {
        const isIdLocal = (id: string) => isLocallyGeneratedId(id);
        const NON_EMPTY_PREFIXES = Object.values(ID_PREFIXES).filter((p) => p && p.length > 0);
        const baseIdPart = (id: string) =>
          id.replace(new RegExp(`^(${NON_EMPTY_PREFIXES.join('|')})`), '');
        const cardFormToRemove = prev.cardForms[index];

        let cuiToRemove: string | undefined;
        if (
          isIdLocal(cardFormToRemove.card_unique_info_id) &&
          baseIdPart(cardFormToRemove.card_unique_info_id) === cardIdToRemove
        ) {
          cuiToRemove = cardFormToRemove.card_unique_info_id;
        }

        let passiveSetToRemove: string | undefined;
        if (
          isIdLocal(cardFormToRemove.passive_skill_set_id) &&
          baseIdPart(cardFormToRemove.passive_skill_set_id) === cardIdToRemove
        ) {
          passiveSetToRemove = cardFormToRemove.passive_skill_set_id;
        }
        let leaderSetToRemove: string | undefined;
        if (
          isIdLocal(cardFormToRemove.leader_skill_set_id) &&
          baseIdPart(cardFormToRemove.leader_skill_set_id) === cardIdToRemove
        ) {
          leaderSetToRemove = cardFormToRemove.leader_skill_set_id;
        }
        let activeSetToRemove: string | undefined;
        if (
          cardFormToRemove.active_skill_set_id_ref &&
          isIdLocal(cardFormToRemove.active_skill_set_id_ref) &&
          baseIdPart(cardFormToRemove.active_skill_set_id_ref) === cardIdToRemove
        ) {
          activeSetToRemove = cardFormToRemove.active_skill_set_id_ref;
        }
        let standbySetToRemove: string | undefined;
        if (
          cardFormToRemove.standby_skill_set_id_ref &&
          isIdLocal(cardFormToRemove.standby_skill_set_id_ref) &&
          baseIdPart(cardFormToRemove.standby_skill_set_id_ref) === cardIdToRemove
        ) {
          standbySetToRemove = cardFormToRemove.standby_skill_set_id_ref;
        }
        let specialSetToRemove: string | undefined;
        const defaultSpecialSetForCard = ID_PREFIXES.SPECIAL_SET + cardIdToRemove;
        if (isIdLocal(defaultSpecialSetForCard)) {
          const cardSpecialEntry = prev.cardSpecials.find(
            (cs) => cs.card_id === cardIdToRemove && cs.special_set_id === defaultSpecialSetForCard
          );
          if (cardSpecialEntry) {
            specialSetToRemove = defaultSpecialSetForCard;
          }
        }

        return {
          ...prev,
          cardForms: prev.cardForms.filter((_, i) => i !== index),
          cardUniqueInfos: cuiToRemove
            ? prev.cardUniqueInfos.filter((cui) => cui.id !== cuiToRemove)
            : prev.cardUniqueInfos,
          passiveSkillSets: passiveSetToRemove
            ? prev.passiveSkillSets.filter((ps) => ps.id !== passiveSetToRemove)
            : prev.passiveSkillSets,
          leaderSkillSets: leaderSetToRemove
            ? prev.leaderSkillSets.filter((ls) => ls.id !== leaderSetToRemove)
            : prev.leaderSkillSets,
          activeSkillSets: activeSetToRemove
            ? (prev.activeSkillSets || []).filter((as) => as.id !== activeSetToRemove)
            : prev.activeSkillSets,
          standbySkillSets: standbySetToRemove
            ? (prev.standbySkillSets || []).filter((ss) => ss.id !== standbySetToRemove)
            : prev.standbySkillSets,
          specialSets: specialSetToRemove
            ? prev.specialSets.filter((sps) => sps.id !== specialSetToRemove)
            : prev.specialSets,

          cardSpecials: prev.cardSpecials.filter((cs) => cs.card_id !== cardIdToRemove),
          cardActiveSkills: (prev.cardActiveSkills || []).filter(
            (cas) => cas.card_id !== cardIdToRemove
          ),
          cardStandbySkills: (prev.cardStandbySkills || []).filter(
            (css) => css.card_id !== cardIdToRemove
          ),

          isEZA: prev.baseCardIdForEZA === cardIdToRemove ? false : prev.isEZA,
          baseCardIdForEZA:
            prev.baseCardIdForEZA === cardIdToRemove ? undefined : prev.baseCardIdForEZA,
          optimalAwakeningGrowth:
            prev.baseCardIdForEZA === cardIdToRemove ? undefined : prev.optimalAwakeningGrowth,
        };
      });
      setSelectedCardIndex(Math.max(0, Math.min(index, patchState.cardForms.length - 2)));
      logAnalyticsEvent('remove_card_form', { removed_card_id: cardIdToRemove });
      setLastLoadedSlot(null);
    },
    [patchState.cardForms, settings.confirmOnDelete, setPatchState]
  );

  const duplicateCardForm = useCallback(
    (indexToDuplicate: number) => {
      const originalForm = patchState.cardForms[indexToDuplicate];
      if (!originalForm) return;

      const newCardId = generateLocalId();
      const duplicatedForm: CardForm = JSON.parse(JSON.stringify(originalForm)); // Deep copy

      duplicatedForm.id = newCardId;
      duplicatedForm.name = `Copy of ${originalForm.name}`;

      const newPatchState = { ...patchState };
      newPatchState.cardForms = [...patchState.cardForms, duplicatedForm];

      // Helper to duplicate a skill set and its skills
      const duplicateSkillSet = <T extends { id: DokkanID; name: string; skills: any[] }>(
        originalSet: T | undefined,
        newSetId: DokkanID,
        newSetNamePrefix: string,
        _skillFactory: (setId: DokkanID) => any, // Factory for individual skills
        skillIdGenerator: (
          setId: DokkanID,
          skillIndex: number,
          baseSkillId?: DokkanID
        ) => DokkanID
      ): T | undefined => {
        if (!originalSet) return undefined;
        const newSet: T = JSON.parse(JSON.stringify(originalSet));
        newSet.id = newSetId;
        newSet.name = `${newSetNamePrefix} for ${newCardId}`;
        newSet.skills = (originalSet.skills || []).map((skill, idx) => {
          const newSkill = JSON.parse(JSON.stringify(skill));
          newSkill.id = skillIdGenerator(newSetId, idx, skill.id);
          // Update skill's own reference to parent set ID if it exists (e.g. active_skill_set_id)
          const parentIdField = Object.keys(newSkill).find((k) => k.endsWith('_set_id'));

          if (parentIdField) (newSkill as any)[parentIdField] = newSetId;
          return newSkill;
        });
        return newSet;
      };

      // Skill ID Generators (simplified from SkillDetailEditor)
      const passiveSpecialSkillIdGen = (
        setId: DokkanID,
        index: number,
        _baseSkillId?: DokkanID
      ) => (index === 0 ? setId : String(index * 100) + setId);
      const leaderSkillIdGen = (setId: DokkanID, index: number) =>
        setId + String(index).padStart(2, '0');
      const activeSkillIdGen = (setId: DokkanID, index: number) => setId + String(index + 1);
      const standbyFinishSkillIdGen = (_setId: DokkanID, _index: number) => generateLocalId();

      // CardUniqueInfo
      if (
        isLocallyGeneratedId(originalForm.card_unique_info_id) &&
        originalForm.card_unique_info_id.endsWith(originalForm.id)
      ) {
        const newUniqueInfoId = ID_PREFIXES.CARD_UNIQUE_INFO + newCardId;
        const originalCui = patchState.cardUniqueInfos.find(
          (c) => c.id === originalForm.card_unique_info_id
        );
        if (originalCui) {
          const newCui: CardUniqueInfo = {
            ...originalCui,
            id: newUniqueInfoId,
            name: `Character Name for ${newCardId}`,
          };
          newPatchState.cardUniqueInfos = [...newPatchState.cardUniqueInfos, newCui];
          duplicatedForm.card_unique_info_id = newUniqueInfoId;
        }
      }

      // PassiveSkillSet
      if (
        isLocallyGeneratedId(originalForm.passive_skill_set_id) &&
        originalForm.passive_skill_set_id.endsWith(originalForm.id)
      ) {
        const newPassiveSetId = ID_PREFIXES.PASSIVE_SKILL_SET + newCardId;
        const originalSet = patchState.passiveSkillSets.find(
          (s) => s.id === originalForm.passive_skill_set_id
        );
        const newSet = duplicateSkillSet(
          originalSet,
          newPassiveSetId,
          'Passive',
          INITIAL_PASSIVE_SKILL,
          passiveSpecialSkillIdGen
        );
        if (newSet) {
          newPatchState.passiveSkillSets = [...newPatchState.passiveSkillSets, newSet];
          duplicatedForm.passive_skill_set_id = newPassiveSetId;
        }
      }

      // LeaderSkillSet
      if (
        isLocallyGeneratedId(originalForm.leader_skill_set_id) &&
        originalForm.leader_skill_set_id.endsWith(originalForm.id)
      ) {
        const newLeaderSetId = ID_PREFIXES.LEADER_SKILL_SET + newCardId;
        const originalSet = patchState.leaderSkillSets.find(
          (s) => s.id === originalForm.leader_skill_set_id
        );
        const newSet = duplicateSkillSet(
          originalSet,
          newLeaderSetId,
          'Leader',
          INITIAL_LEADER_SKILL,
          leaderSkillIdGen
        );
        if (newSet) {
          newPatchState.leaderSkillSets = [...newPatchState.leaderSkillSets, newSet];
          duplicatedForm.leader_skill_set_id = newLeaderSetId;
        }
      }

      // ActiveSkillSet & CardActiveSkill
      if (
        originalForm.active_skill_set_id_ref &&
        isLocallyGeneratedId(originalForm.active_skill_set_id_ref) &&
        originalForm.active_skill_set_id_ref.endsWith(originalForm.id)
      ) {
        const newActiveSetId = ID_PREFIXES.ACTIVE_SKILL_SET + newCardId;
        const originalSet = patchState.activeSkillSets.find(
          (s) => s.id === originalForm.active_skill_set_id_ref
        );
        const newSet = duplicateSkillSet(
          originalSet,
          newActiveSetId,
          'Active',
          INITIAL_ACTIVE_SKILL_EFFECT,
          activeSkillIdGen
        );
        if (newSet) {
          newPatchState.activeSkillSets = [...newPatchState.activeSkillSets, newSet];
          duplicatedForm.active_skill_set_id_ref = newActiveSetId;
          const newCardActiveSkill: CardActiveSkill = {
            id: `${newCardId}${newActiveSetId}`,
            card_id: newCardId,
            active_skill_set_id: newActiveSetId,
          };
          newPatchState.cardActiveSkills = [
            ...(newPatchState.cardActiveSkills || []),
            newCardActiveSkill,
          ];
        }
      } else if (originalForm.active_skill_set_id_ref) {
        // Shared set, just create new CardActiveSkill if ref exists
        const newCardActiveSkill: CardActiveSkill = {
          id: `${newCardId}${originalForm.active_skill_set_id_ref}`,
          card_id: newCardId,
          active_skill_set_id: originalForm.active_skill_set_id_ref,
        };
        newPatchState.cardActiveSkills = [
          ...(newPatchState.cardActiveSkills || []),
          newCardActiveSkill,
        ];
      }

      // StandbySkillSet & CardStandbySkill
      if (
        originalForm.standby_skill_set_id_ref &&
        isLocallyGeneratedId(originalForm.standby_skill_set_id_ref) &&
        originalForm.standby_skill_set_id_ref.endsWith(originalForm.id)
      ) {
        const newStandbySetId = ID_PREFIXES.STANDBY_SKILL_SET + newCardId;
        const originalSet = patchState.standbySkillSets.find(
          (s) => s.id === originalForm.standby_skill_set_id_ref
        );
        const newSet = duplicateSkillSet(
          originalSet,
          newStandbySetId,
          'Standby',
          INITIAL_STANDBY_SKILL,
          standbyFinishSkillIdGen
        );
        if (newSet) {
          newPatchState.standbySkillSets = [...newPatchState.standbySkillSets, newSet];
          duplicatedForm.standby_skill_set_id_ref = newStandbySetId;
          const newCardStandbySkill: CardStandbySkill = {
            id: `${newCardId}${newStandbySetId}`,
            card_id: newCardId,
            standby_skill_set_id: newStandbySetId,
          };
          newPatchState.cardStandbySkills = [
            ...(newPatchState.cardStandbySkills || []),
            newCardStandbySkill,
          ];
        }
      } else if (originalForm.standby_skill_set_id_ref) {
        // Shared set
        const newCardStandbySkill: CardStandbySkill = {
          id: `${newCardId}${originalForm.standby_skill_set_id_ref}`,
          card_id: newCardId,
          standby_skill_set_id: originalForm.standby_skill_set_id_ref,
        };
        newPatchState.cardStandbySkills = [
          ...(newPatchState.cardStandbySkills || []),
          newCardStandbySkill,
        ];
      }

      // CardSpecials and their SpecialSets
      const originalCardSpecials = patchState.cardSpecials.filter(
        (cs) => cs.card_id === originalForm.id
      );
      originalCardSpecials.forEach((originalCS) => {
        const newCardSpecial: CardSpecial = JSON.parse(JSON.stringify(originalCS));
        newCardSpecial.id = generateLocalId();
        newCardSpecial.card_id = newCardId;

        if (
          isLocallyGeneratedId(originalCS.special_set_id) &&
          originalCS.special_set_id.endsWith(originalForm.id)
        ) {
          const newSpecialSetId = ID_PREFIXES.SPECIAL_SET + newCardId;
          const originalSet = patchState.specialSets.find((s) => s.id === originalCS.special_set_id);
          const newSet = duplicateSkillSet(
            originalSet,
            newSpecialSetId,
            'Special',
            INITIAL_SPECIAL_SKILL,
            passiveSpecialSkillIdGen
          );
          if (newSet) {
            newPatchState.specialSets = [...newPatchState.specialSets, newSet];
            newCardSpecial.special_set_id = newSpecialSetId;
          }
        }
        newPatchState.cardSpecials = [...newPatchState.cardSpecials, newCardSpecial];
      });

      // Update the specific card form in the array
      newPatchState.cardForms = newPatchState.cardForms.map((cf) =>
        cf.id === newCardId ? duplicatedForm : cf
      );

      setPatchState(newPatchState);

      logAnalyticsEvent('duplicate_item', {
        item_type: 'card_form',
        original_id: originalForm.id,
        new_id: newCardId,
      });

      setSelectedCardIndex(patchState.cardForms.length);
      setLastLoadedSlot(null);
    },
    [patchState, settings, setPatchState]
  );

  const handleGenerateSql = useCallback(() => {
    setIsLoadingSql(true);
    try {
      const sql = generateSqlPatch(patchState);
      setGeneratedSql(sql);
      logAnalyticsEvent('generate_sql_patch', { num_card_forms: patchState.cardForms.length });
    } catch (error) {
      console.error('Error generating SQL:', error);
      setGeneratedSql(
        `-- Error generating SQL: ${error instanceof Error ? error.message : String(error)}`
      );
      logAnalyticsEvent('generate_sql_patch_failed');
    } finally {
      setIsLoadingSql(false);
    }
  }, [patchState]);

  const handleSaveToSlot = async (slotId: string, slotName?: string) => {
    if (!LOGIN_SYSTEM_ENABLED || !currentUser) {
      addToast('Login system is disabled or you are not signed in. Cannot save to cloud.', { type: 'warning' });
      return false;
    }
    setIsSavingSlot((prev) => ({ ...prev, [slotId]: true }));
    try {
      await firestoreService.savePatchState(currentUser.uid, slotId, patchState, slotName);
      setLastLoadedSlot(slotId);
      logAnalyticsEvent('save_to_cloud', {
        slot_id: slotId,
        num_card_forms: patchState.cardForms.length,
      });
      addToast(`Patch saved successfully to ${slotName || slotId.replace('s', 'S')}!`, { type: 'success' });
      return true;
    } catch (error) {
      console.error(`Error saving patch to ${slotId}:`, error);
      logAnalyticsEvent('save_to_cloud_failed', { slot_id: slotId });
      addToast(
        `Failed to save patch to ${slotName || slotId.replace('s', 'S')}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { type: 'error' }
      );
      return false;
    } finally {
      setIsSavingSlot((prev) => ({ ...prev, [slotId]: false }));
    }
  };

  const handleLoadFromSlot = async (slotId: string) => {
    if (!LOGIN_SYSTEM_ENABLED || !currentUser) {
      addToast('Login system is disabled or you are not signed in. Cannot load from cloud.', { type: 'warning' });
      return false;
    }
    if (
      window.confirm(
        `Loading from ${slotId.replace('s', 'S')} will overwrite your current unsaved changes. Are you sure?`
      )
    ) {
      setIsPatchLoading(true);
      try {
        const loadedData = await firestoreService.loadPatchDataFromSlot(currentUser.uid, slotId);
        if (loadedData && loadedData.patchData) {
          clearAutoSaveStorage();
          setPatchState((prev) => ({
            ...prev, // Keep existing SQL converter state
            ...synchronizeDerivedCardSkillEntries(loadedData.patchData),
          }));
          setGeneratedSql('');
          setCurrentView('dashboard');
          setLastLoadedSlot(slotId);
          setSelectedCardIndex(0);
          logAnalyticsEvent('load_from_cloud', {
            slot_id: slotId,
            num_card_forms: loadedData.patchData.cardForms.length,
          });
          addToast(`Successfully loaded patch from ${loadedData.name || slotId.replace('s', 'S')}.`, { type: 'success' });
          setShowSaveLoadModal(false);
          return true;
        } else {
          logAnalyticsEvent('load_from_cloud_failed', { slot_id: slotId, reason: 'no_data' });
          addToast(
            `No data found in ${slotId.replace('s', 'S')} or failed to load. Your current work remains unchanged.`,
            { type: 'warning' }
          );
          return false;
        }
      } catch (error) {
        console.error(`Error loading patch from ${slotId}:`, error);
        logAnalyticsEvent('load_from_cloud_failed', { slot_id: slotId, reason: 'error' });
        addToast(
          `Failed to load patch from ${slotId.replace('s', 'S')}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { type: 'error' }
        );
        return false;
      } finally {
        setIsPatchLoading(false);
      }
    }
    return false;
  };

  const handleSavePlanner = async () => {
    if (!LOGIN_SYSTEM_ENABLED || !currentUser) {
      addToast('Login to save your planner slots.', { type: 'warning' });
      return;
    }
    setIsSavingPlanner(true);
    try {
      await firestoreService.savePlannerSlots(currentUser.uid, plannerSlots);
      setPlannerSlots((prev) => prev.map((slot) => ({ ...slot, lastUpdated: Date.now() })));
      addToast('Planner saved successfully!', { type: 'success' });
      logAnalyticsEvent('save_planner');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addToast(`Failed to save planner: ${errorMessage}`, { type: 'error' });
      logAnalyticsEvent('save_planner_failed');
    } finally {
      setIsSavingPlanner(false);
    }
  };

  const handleResetForm = () => {
    if (
      window.confirm(
        'Are you sure you want to reset the form? This will clear all current unsaved data and start fresh.'
      )
    ) {
      clearAutoSaveStorage();
      resetPatchState();
      setGeneratedSql('');
      setCurrentView('dashboard');
      setLastLoadedSlot(null);
      setSelectedCardIndex(0);
      logAnalyticsEvent('reset_form');
      addToast('Form has been reset.', { type: 'info' });
    }
  };

  const anyOperationLoading =
    Object.values(isSavingSlot).some(Boolean) ||
    isPatchLoading ||
    isLoadingSql ||
    isDbLoading ||
    (LOGIN_SYSTEM_ENABLED && isAuthLoading);

  const tabs = [
    { name: 'Dashboard', id: 'dashboard', icon: 'fa-id-card' },
    { name: 'Shared Skill Sets', id: 'globalSkillSets', icon: 'fa-sitemap' },
    // Conditionally render Standby & Finish tab if beta setting is enabled
    ...(settings.enableStandbyFinishSkills
      ? [{ name: 'Standby & Finish', id: 'standbyFinish', icon: 'fa-hourglass-half' }]
      : []),
    { name: 'EZA Details', id: 'ezaDetails', icon: 'fa-bolt' },
    { name: 'Misc Tables', id: 'miscTables', icon: 'fa-table-list' },
    // { name: 'SQL Converter', id: 'sqlConverter', icon: 'fa-exchange-alt' }, // Moved to profile dropdown
    { name: 'Generated SQL', id: 'sqlOutput', icon: 'fa-code' },
  ];

  // Fix: Refactor conditional rendering to use if/else if/else to ensure all paths return a ReactNode.
  if (LOGIN_SYSTEM_ENABLED && isAuthLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-rajdhani"
        style={{ backgroundColor: 'var(--clr-bg-main)', color: 'var(--clr-primary)' }}
      >
        <i className="fas fa-spinner fa-spin text-5xl"></i>
        <p className="ml-4 text-2xl text-[var(--clr-text)]">Loading Application...</p>
      </div>
    );
  } else if (LOGIN_SYSTEM_ENABLED && !currentUser) {
    return <LoginScreen />;
  } else {
  const headerNode = (
    <>
      {/* News Banners */}
      <div className="mb-4">
        <AnimatePresence initial={false}>
          {getActiveBanners(dismissedBannerIds)
            .filter((banner) => !banner.onlyOnLogin)
            .map((banner) => (
              <NewsBanner key={banner.id} banner={banner} onDismiss={handleBannerDismiss} />
            ))}
        </AnimatePresence>
      </div>

      <header className="mb-4 sm:mb-6 p-3 sm:p-4 card relative z-30">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <i className="fas fa-dragon text-2xl sm:text-4xl text-[var(--clr-accent)]"></i>
            <h1 className="text-lg sm:text-2xl font-bold text-header-title tracking-wider">
              Dokkan Patch Maker
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex flex-col items-end">
              <label
                htmlFor="db-upload"
                className={`btn-primary py-1.5 sm:py-2 px-2 sm:px-4 text-xs sm:text-sm ${isDbLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <i className="fas fa-database mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">{isDbLoading ? 'Loading...' : dbInstance ? 'DB Loaded' : 'Select .db'}</span>
                <span className="sm:hidden">{isDbLoading ? '...' : dbInstance ? 'DB' : '.db'}</span>
              </label>
              <input
                type="file"
                id="db-upload"
                ref={fileInputRef}
                className="hidden"
                accept=".db, .sqlite, .sqlite3"
                onChange={handleDbFileChange}
                disabled={anyOperationLoading}
              />
              {dbError && <p className="text-xs text-red-400 mt-1 self-center">{dbError}</p>}
            </div>
            <button
              onClick={openLoadModalForPatch}
              disabled={!dbInstance || anyOperationLoading}
              className="btn-secondary py-1.5 sm:py-2 px-2 sm:px-4 text-xs sm:text-sm disabled:opacity-50 flex items-center"
              title="Load character from database"
            >
              <i className="fas fa-user-plus mr-1 sm:mr-2"></i>
              <span className="hidden sm:inline">Load from DB</span>
            </button>
            {settings.enableReverseSqlImport && (
              <button
                onClick={() => {
                  setShowImportSqlModal(true);
                  logAnalyticsEvent('open_modal', { modal_name: 'import_sql' });
                }}
                disabled={anyOperationLoading}
                className="btn-secondary py-1.5 sm:py-2 px-2 sm:px-4 text-xs sm:text-sm disabled:opacity-50 flex items-center"
                title="Import SQL patch file"
              >
                <i className="fas fa-file-import mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">Import SQL</span>
              </button>
            )}
            <button
              onClick={() => {
                setShowFolderImportModal(true);
                logAnalyticsEvent('open_modal', { modal_name: 'folder_import' });
              }}
              disabled={anyOperationLoading}
              className="btn-secondary py-1.5 sm:py-2 px-2 sm:px-4 text-xs sm:text-sm disabled:opacity-50 flex items-center"
              title="Import card from folder with assets"
            >
              <i className="fas fa-folder-tree mr-1 sm:mr-2"></i>
              <span className="hidden sm:inline">Import from Folder</span>
            </button>

            <button
              onClick={() => {
                setCurrentView('planner');
                logAnalyticsEvent('view_tab', { tab_name: 'cardPlanner' });
              }}
              className={`btn-secondary py-1.5 sm:py-2 px-2 sm:px-4 text-xs sm:text-sm ${currentView === 'planner' ? 'border-[var(--clr-border-focus)] text-main-accent' : ''}`}
              title="Open Card Planner"
            >
              <i className="fas fa-clipboard-list mr-1 sm:mr-2"></i>
              <span className="hidden sm:inline">Card Planner</span>
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="btn-secondary p-1.5 sm:p-2 rounded-md h-[34px] sm:h-[42px] w-[34px] sm:w-[42px] flex items-center justify-center"
              title="Settings"
            >
              <i className="fas fa-cog text-base sm:text-lg text-icon-primary"></i>
            </button>
            {LOGIN_SYSTEM_ENABLED && currentUser ? (
              <div ref={profileDropdownRef} className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center space-x-3 text-sm card p-2 cursor-pointer hover:border-[var(--clr-border-focus)] transition-all"
                >
                  {lastLoadedSlot && (
                    <span className="text-xs px-1.5 sm:px-2 py-1 bg-green-600/80 text-white rounded-md font-semibold backdrop-blur-sm whitespace-nowrap">
                      <span className="hidden sm:inline">Active: </span>{lastLoadedSlot.replace('s', 'S')}
                    </span>
                  )}
                  {!lastLoadedSlot && (
                    <span className="text-xs px-1.5 sm:px-2 py-1 bg-gray-600/80 text-white rounded-md font-semibold backdrop-blur-sm">
                      Unsaved
                    </span>
                  )}
                  {currentUser.photoURL && (
                    <img
                      src={currentUser.photoURL}
                      alt="User"
                      className="w-8 h-8 rounded-full border-2 border-[var(--clr-secondary)]"
                    />
                  )}
                  <span className="text-[var(--clr-text-muted)] hidden md:inline">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <i
                    className={`fas fa-chevron-down text-xs transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                  ></i>
                </button>
                <div
                  className={`absolute top-full right-0 mt-2 w-64 origin-top-right rounded-xl shadow-2xl bg-[var(--clr-bg-card)] border border-[var(--clr-border)] transition-all duration-200 ease-out ${isProfileDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                >
                  <div className="p-2 space-y-2">
                    <button
                      onClick={() => {
                        setCurrentView('sqlConverter');
                        setIsProfileDropdownOpen(false);
                        logAnalyticsEvent('view_tab', { tab_name: 'sqlConverter' });
                      }}
                      className="w-full text-left bg-transparent hover:bg-[var(--clr-primary)] hover:bg-opacity-20 text-[var(--clr-text)] font-semibold py-2 px-3 rounded-md transition-all duration-150 ease-in-out text-sm"
                      disabled={anyOperationLoading}
                    >
                      <i className="fas fa-exchange-alt mr-2 text-[var(--clr-accent)]"></i>
                      SQL Converter
                    </button>
                    <div className="h-px bg-[var(--clr-border)] my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left bg-transparent hover:bg-red-500 hover:bg-opacity-20 text-red-400 font-bold py-2 px-3 rounded-md transition-all duration-150 ease-in-out text-sm"
                      disabled={anyOperationLoading}
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {!LOGIN_SYSTEM_ENABLED && (
                  <span className="text-xs px-2 py-1 bg-yellow-500 text-black rounded-md font-semibold">
                    <i className="fas fa-triangle-exclamation mr-1"></i> LOGIN DISABLED
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );

  const mainContentNode = (
    <MainContent
      isPatchLoading={isPatchLoading}
      currentView={currentView}
      loginSystemEnabled={LOGIN_SYSTEM_ENABLED}
      settings={settings}
      patchState={patchState}
      setPatchState={setPatchState}
      updateCardForm={updateCardForm}
      removeCardForm={removeCardForm}
      duplicateCardForm={duplicateCardForm}
      selectedCardIndex={selectedCardIndex}
      setSelectedCardIndex={setSelectedCardIndex}
      addCardForm={addCardForm}
      anyOperationLoading={anyOperationLoading}
      plannerSlots={plannerSlots}
      setPlannerSlots={setPlannerSlots}
      handleSavePlanner={handleSavePlanner}
      isSavingPlanner={isSavingPlanner}
      isLoadingPlanner={isLoadingPlanner}
      dbInstance={dbInstance}
      openLoadModalForPlanner={openLoadModalForPlanner}
      generatedSql={generatedSql}
    />
  );

  // Common Layout Props
  const layoutProps = {
      currentView,
      setCurrentView,
      tabs,
      settings,
      generatedSql,
      handleGenerateSql,
      isLoadingSql,
      anyOperationLoading,
      handleResetForm,
      loginSystemEnabled: LOGIN_SYSTEM_ENABLED,
      currentUser,
      setShowSaveLoadModal,
      setShowVersionNotesModal,
      setShowReportBugModal,
      lastSavedTime,
  };
  return (
    <>
      <LayoutDock {...layoutProps} headerNode={headerNode}>{mainContentNode}</LayoutDock>

      {/* Global Modals */}
      {showLoadCharacterModal && dbInstance && (
        <LoadCharacterModal
          isOpen={showLoadCharacterModal}
          onClose={() => setShowLoadCharacterModal(false)}
          dbInstance={dbInstance}
          onCharacterSelected={handleCharacterLoaded}
          onCharacterSelectedForPlanner={handleCharacterLoadedForPlanner}
          mode={loadModalMode}
          elementTypes={ELEMENT_TYPES}
          rarityTypes={RARITY_TYPES}
        />
      )}
      {LOGIN_SYSTEM_ENABLED && showSaveLoadModal && currentUser && (
        <SaveLoadModal
          isOpen={showSaveLoadModal}
          onClose={() => setShowSaveLoadModal(false)}
          currentUser={currentUser}
          lastLoadedSlot={lastLoadedSlot}
          onSaveToSlot={handleSaveToSlot}
          onLoadFromSlot={handleLoadFromSlot}
          isSavingSlot={isSavingSlot}
          isGlobalLoading={isPatchLoading}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
        />
      )}
      {showVersionNotesModal && (
        <VersionNotesModal
          isOpen={showVersionNotesModal}
          onClose={() => setShowVersionNotesModal(false)}
        />
      )}
      {showReportBugModal && (
        <ReportBugModal
          isOpen={showReportBugModal}
          onClose={() => setShowReportBugModal(false)}
          currentUserEmail={currentUser?.email}
          appVersion={currentAppVersion}
        />
      )}
      {showSettingsModal && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          settings={settings}
          onSettingsChange={setSettings}
          currentTheme={theme}
          onThemeChange={handleThemeChange}
          themes={THEMES}
        />
      )}
      {showImportSqlModal && (
        <ImportSqlModal
          isOpen={showImportSqlModal}
          onClose={() => setShowImportSqlModal(false)}
          onImport={loadPatchState}
        />
      )}
      {showFolderImportModal && (
        <FolderImportModal
          isOpen={showFolderImportModal}
          onClose={() => setShowFolderImportModal(false)}
          onImport={loadPatchState}
        />
      )}
    </>
  );
  }
};

// Removed default export as it's now a named export above
// export default App;
