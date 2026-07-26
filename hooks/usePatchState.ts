import { useState, useCallback, useMemo } from 'react';
import { DokkanPatchState, CardActiveSkill, CardStandbySkill, DokkanID } from '../types';
import { INITIAL_CARD_FORM } from '../constants';

export const getInitialPatchState = (): DokkanPatchState => ({
  cardForms: [INITIAL_CARD_FORM()],
  cardUniqueInfos: [],
  characters: [],
  passiveSkillSets: [],
  leaderSkillSets: [],
  specialSets: [],
  activeSkillSets: [],
  cardSpecials: [],
  cardActiveSkills: [],
  cardStandbySkills: [],
  passiveSkillEffects: [],
  effectPacks: [],
  standbySkillSets: [],
  finishSkillSets: [],
  standbySkillSetFinishSkillSetRelations: [],
  finishSpecials: [],
  battleParams: [],
  skillCausalities: [],
  subTargetTypeSets: [],
  subTargetTypes: [],
  ultimateSpecials: [],
  specialViews: [],
  cardAwakeningRoutes: [],
  isEZA: false,
  sqlConverterInput: '',
  sqlConverterOutput: '',
});

export const synchronizeDerivedCardSkillEntries = (
  currentState: DokkanPatchState
): DokkanPatchState => {
  // Merge: preserve existing entries from SQL import / manual load,
  // then overlay derived entries from card forms that have refs set.
  const existingActiveMap = new Map<DokkanID, CardActiveSkill>();
  for (const entry of currentState.cardActiveSkills) {
    existingActiveMap.set(entry.card_id, entry);
  }
  const existingStandbyMap = new Map<DokkanID, CardStandbySkill>();
  for (const entry of currentState.cardStandbySkills) {
    existingStandbyMap.set(entry.card_id, entry);
  }

  for (const cardForm of currentState.cardForms) {
    const cardId = cardForm.id;

    // Active Skills
    const activeSetId = cardForm.active_skill_set_id_ref;
    if (activeSetId && activeSetId.trim() !== '') {
      const expectedId = `${cardId}${activeSetId}`;
      existingActiveMap.set(cardId, {
        id: expectedId,
        card_id: cardId,
        active_skill_set_id: activeSetId,
      });
    }

    // Standby Skills
    const standbySetId = cardForm.standby_skill_set_id_ref;
    if (standbySetId && standbySetId.trim() !== '') {
      const expectedId = `${cardId}${standbySetId}`;
      existingStandbyMap.set(cardId, {
        id: expectedId,
        card_id: cardId,
        standby_skill_set_id: standbySetId,
      });
    }
  }

  return {
    ...currentState,
    cardActiveSkills: Array.from(existingActiveMap.values()),
    cardStandbySkills: Array.from(existingStandbyMap.values()),
  };
};

export const usePatchState = () => {
  const [patchState, setPatchState] = useState<DokkanPatchState>(getInitialPatchState());

  const resetPatchState = useCallback(() => {
    setPatchState(getInitialPatchState());
  }, []);

  const loadPatchState = useCallback((newState: DokkanPatchState) => {
    const synchronizedState = synchronizeDerivedCardSkillEntries(newState);
    setPatchState(synchronizedState);
  }, []);

  return useMemo(
    () => ({
      patchState,
      setPatchState,
      resetPatchState,
      loadPatchState,
    }),
    [patchState, resetPatchState, loadPatchState]
  );
};
