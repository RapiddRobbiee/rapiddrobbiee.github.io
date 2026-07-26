import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Database as SqlJsDatabase } from 'sql.js';
import {
  DokkanID,
  CardBasicInfo,
  TargetSkillSetType,
  AnySkill,
  AnySkillSet,
  SpecialSet,
} from '../types';
import * as dbService from '../services/databaseService';
import { FormInput, FormSelect, FormCheckbox } from './FormControls'; // Added FormCheckbox
import {
  ELEMENT_TYPES,
  RARITY_TYPES,
  ELEMENT_TYPE_OPTIONS,
  RARITY_TYPE_OPTIONS,
} from '../constants';
import { useToast } from '../context/ToastContext';

interface ImportSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbInstance: SqlJsDatabase;
  targetSkillSetType: TargetSkillSetType;
  onSkillsImported: (importData: {
    type: 'set' | 'skills';
    data: AnySkillSet | AnySkill[];
  }) => void;
}

type ImportType = 'set' | 'skills';

const idFilterOptions = [
  { label: 'All Cards', value: 'all' },
  { label: 'Base Cards (ID starts with 1)', value: 'base' },
  { label: 'Other/Transformed (ID not 1...)', value: 'transformed' },
];

export const ImportSkillsModal: React.FC<ImportSkillsModalProps> = ({
  isOpen,
  onClose,
  dbInstance,
  targetSkillSetType,
  onSkillsImported,
}) => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CardBasicInfo[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardBasicInfo | null>(null);
  const [fetchedSkillSet, setFetchedSkillSet] = useState<AnySkillSet | null>(null);
  const [fetchedSpecialSets, setFetchedSpecialSets] = useState<SpecialSet[] | null>(null);
  const [selectedSpecialSetToImport, setSelectedSpecialSetToImport] = useState<SpecialSet | null>(
    null
  );
  const [importType, setImportType] = useState<ImportType>('skills'); // 'skills' (append) or 'set' (replace content)

  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedElement, setSelectedElement] = useState<string>('');
  const [selectedRarity, setSelectedRarity] = useState<string>('');
  const [selectedIdFilter, setSelectedIdFilter] = useState<'all' | 'base' | 'transformed'>('all');

  const resetLocalState = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedCard(null);
    setFetchedSkillSet(null);
    setFetchedSpecialSets(null);
    setSelectedSpecialSetToImport(null);
    setImportType('skills');
    setIsLoadingSearch(false);
    setIsLoadingDetails(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetLocalState();
    }
  }, [isOpen, resetLocalState]);

  const performSearch = useCallback(async () => {
    if (!dbInstance || !searchTerm.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }
    setIsLoadingSearch(true);
    setError(null);
    setSelectedCard(null);
    setFetchedSkillSet(null);
    setFetchedSpecialSets(null);
    setSelectedSpecialSetToImport(null);

    try {
      const elementVal = selectedElement ? parseInt(selectedElement) : null;
      const rarityVal = selectedRarity ? parseInt(selectedRarity) : null;
      // Fix: Pass null for categoryFilter and linkSkillFilter arguments to match function signature.
      const results = await dbService.searchCharactersByName(
        dbInstance,
        searchTerm,
        elementVal,
        rarityVal,
        selectedIdFilter,
        null,
        null
      );
      setSearchResults(results);
      if (results.length === 0) setError('No characters found.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search characters.');
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  }, [dbInstance, searchTerm, selectedElement, selectedRarity, selectedIdFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length > 0) performSearch();
      else if (searchTerm.length === 0) {
        setSearchResults([]);
        setError(null);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, performSearch]);

  const handleSelectCharacter = async (card: CardBasicInfo) => {
    setSelectedCard(card);
    setIsLoadingDetails(true);
    setError(null);
    setFetchedSkillSet(null);
    setFetchedSpecialSets(null);
    setSelectedSpecialSetToImport(null);

    try {
      const result = await dbService.getCharacterSkillSet(dbInstance, card.id, targetSkillSetType);
      if (targetSkillSetType === 'specialSets') {
        const specialSetsResult = result as SpecialSet[] | null;
        setFetchedSpecialSets(specialSetsResult);
        if (!specialSetsResult || specialSetsResult.length === 0) {
          setError(`No Special Attack Sets found for ${card.name}.`);
        } else if (specialSetsResult.length === 1) {
          // If only one special set, auto-select it
          setSelectedSpecialSetToImport(specialSetsResult[0]);
        }
      } else {
        setFetchedSkillSet(result as AnySkillSet | null);
        if (!result) {
          setError(
            `No ${getSkillSetDisplayName(targetSkillSetType, false)} found for ${card.name}.`
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load skills for ${card.name}.`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleImportConfirm = () => {
    let dataToImport: AnySkillSet | AnySkill[] | undefined;
    const actualImportType: ImportType = importType;

    if (targetSkillSetType === 'specialSets') {
      if (!selectedSpecialSetToImport) {
        addToast('Please select a Special Attack Set to import.', { type: 'warning' });
        return;
      }
      dataToImport =
        importType === 'set' ? selectedSpecialSetToImport : selectedSpecialSetToImport.skills;
    } else {
      if (!fetchedSkillSet) {
        addToast('No skill set data loaded to import.', { type: 'warning' });
        return;
      }
      dataToImport = importType === 'set' ? fetchedSkillSet : fetchedSkillSet.skills;
    }

    if (
      dataToImport &&
      (importType === 'set' || (Array.isArray(dataToImport) && dataToImport.length > 0))
    ) {
      onSkillsImported({ type: actualImportType, data: dataToImport });
      onClose();
    } else {
      addToast('No skills available in the selected set to import, or set data is missing.', { type: 'warning' });
    }
  };

  if (!isOpen) return null;

  const elementOptionsForFilter = [{ label: 'All Elements', value: '' }, ...ELEMENT_TYPE_OPTIONS];
  const rarityOptionsForFilter = [{ label: 'All Rarities', value: '' }, ...RARITY_TYPE_OPTIONS];

  const getSkillSetDisplayName = (type: TargetSkillSetType, plural: boolean = true) => {
    const baseName = type
      .replace(/([A-Z])/g, ' $1')
      .replace('Skill Sets', 'Skill Set')
      .trim();
    return plural ? baseName + 's' : baseName;
  };

  const canConfirmImport = () => {
    if (isLoadingDetails || !!error) return false;
    if (targetSkillSetType === 'specialSets') {
      if (!selectedSpecialSetToImport) return false;
      return (
        importType === 'set' ||
        (selectedSpecialSetToImport.skills && selectedSpecialSetToImport.skills.length > 0)
      );
    } else {
      if (!fetchedSkillSet) return false;
      return importType === 'set' || (fetchedSkillSet.skills && fetchedSkillSet.skills.length > 0);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-start justify-center pt-20 p-4 z-[9999] backdrop-blur-sm font-rajdhani modal-backdrop">
      <div className="modal-card p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col modal-content">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold modal-title">
            Import {getSkillSetDisplayName(targetSkillSetType)}
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--clr-text-muted)] hover:text-[var(--clr-accent)] text-2xl"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Step 1: Search and Select Character */}
        {!selectedCard && (
          <>
            <FormInput
              label="Search Character Name or ID"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="e.g., Goku, 1000010..."
              className="mb-2"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <FormSelect
                label="Element"
                value={selectedElement}
                onChange={setSelectedElement}
                options={elementOptionsForFilter}
              />
              <FormSelect
                label="Rarity"
                value={selectedRarity}
                onChange={setSelectedRarity}
                options={rarityOptionsForFilter}
              />
              <FormSelect
                label="Card Type"
                value={selectedIdFilter}
                onChange={(val) => setSelectedIdFilter(val as any)}
                options={idFilterOptions}
              />
            </div>
            {isLoadingSearch && (
              <p className="text-[var(--clr-accent)] text-sm my-2 text-center">
                <i className="fas fa-spinner fa-spin mr-1"></i>Searching...
              </p>
            )}
            <div className="flex-grow overflow-y-auto pr-2 space-y-1.5 custom-scrollbar max-h-60 mb-3">
              {searchResults.map((char) => (
                <div
                  key={char.id}
                  onClick={() => handleSelectCharacter(char)}
                  className="p-2.5 bg-[var(--clr-bg-card)] hover:bg-[var(--clr-bg-main)]/80 rounded-md shadow-sm cursor-pointer flex justify-between items-center border border-[var(--clr-border)] hover:border-[var(--clr-border-focus)]"
                >
                  <div>
                    <p className="font-medium text-[var(--clr-accent)]">
                      {char.name}{' '}
                      <span className="text-xs text-[var(--clr-text-muted)]">
                        {char.title || ''}
                      </span>
                    </p>
                    <p className="text-xs text-[var(--clr-text-muted)] font-roboto-mono">
                      ID: {char.id}
                    </p>
                  </div>
                  <div className="text-xs">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-white text-[10px] ${ELEMENT_TYPES[char.element]?.toLowerCase().includes('agl') ? 'bg-blue-500' : ELEMENT_TYPES[char.element]?.toLowerCase().includes('teq') ? 'bg-green-500' : ELEMENT_TYPES[char.element]?.toLowerCase().includes('int') ? 'bg-purple-500' : ELEMENT_TYPES[char.element]?.toLowerCase().includes('str') ? 'bg-red-500' : ELEMENT_TYPES[char.element]?.toLowerCase().includes('phy') ? 'bg-orange-500' : 'bg-gray-500'}`}
                    >
                      {ELEMENT_TYPES[char.element] || '???'}
                    </span>
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-gray-600 text-white text-[10px]">
                      {RARITY_TYPES[char.rarity] || '???'}
                    </span>
                  </div>
                </div>
              ))}
              {searchResults.length === 0 && !isLoadingSearch && searchTerm && !error && (
                <p className="text-[var(--clr-text-muted)] italic text-sm text-center">
                  No results.
                </p>
              )}
            </div>
          </>
        )}

        {/* Step 2: Confirm Skill Set and Import */}
        {selectedCard && (
          <div className="mt-1 flex-grow flex flex-col">
            <h4 className="text-lg font-semibold text-[var(--clr-accent)] mb-1">
              Selected Character:{' '}
              <span className="text-[var(--clr-text)]">
                {selectedCard.name} ({selectedCard.id})
              </span>
            </h4>
            {isLoadingDetails && (
              <p className="text-[var(--clr-accent)] my-2 text-sm">
                <i className="fas fa-spinner fa-spin mr-1"></i>Loading skill details...
              </p>
            )}

            <div className="my-3">
              <FormCheckbox
                label="Import full skill set (replaces current set's name, description, etc., and all its skills, but keeps current set ID)"
                checked={importType === 'set'}
                onChange={(checked) => setImportType(checked ? 'set' : 'skills')}
                className="text-sm"
              />
              <p className="text-xs text-[var(--clr-text-muted)] ml-6">
                If unchecked, only skill effects will be appended to the current set.
              </p>
            </div>

            {targetSkillSetType === 'specialSets' && fetchedSpecialSets && !isLoadingDetails && (
              <div className="my-2">
                <FormSelect
                  label={`Available Special Attack Sets for ${selectedCard.name}`}
                  value={selectedSpecialSetToImport?.id || ''}
                  onChange={(val) =>
                    setSelectedSpecialSetToImport(
                      fetchedSpecialSets.find((s) => s.id === val) || null
                    )
                  }
                  options={[
                    { label: 'Select a Special Set...', value: '' },
                    ...fetchedSpecialSets.map((s) => ({
                      label: `${s.name || 'Unnamed Special Set'} (ID: ${s.id}, ${s.skills?.length || 0} effects)`,
                      value: s.id,
                    })),
                  ]}
                  isOptional={false}
                />
                {selectedSpecialSetToImport && (
                  <div className="mt-1 p-2 bg-[var(--clr-bg-card)]/40 rounded text-xs text-[var(--clr-text-muted)] border border-[var(--clr-border)]">
                    <p>Name: {selectedSpecialSetToImport.name || 'N/A'}</p>
                    <p>
                      Causality Desc: {selectedSpecialSetToImport.causality_description || 'N/A'}
                    </p>
                    <p>Effects: {selectedSpecialSetToImport.skills?.length || 0}</p>
                  </div>
                )}
              </div>
            )}

            {targetSkillSetType !== 'specialSets' && fetchedSkillSet && !isLoadingDetails && (
              <div className="my-2 p-3 bg-[var(--clr-bg-card)]/50 rounded-md border border-[var(--clr-border)]">
                <p className="text-md font-medium text-[var(--clr-text)]">
                  {getSkillSetDisplayName(targetSkillSetType, false)}:{' '}
                  <span className="text-[var(--clr-accent)]">
                    {fetchedSkillSet.name || 'Unnamed Set'}
                  </span>{' '}
                  (ID: {fetchedSkillSet.id})
                </p>
                <p className="text-sm text-[var(--clr-text-muted)]">
                  Contains {fetchedSkillSet.skills?.length || 0} skill effect(s).
                </p>
                {importType === 'set' && (
                  <p className="text-xs text-[var(--clr-warning)] mt-1">
                    Full set content (name, description, etc.) will be imported.
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="text-[var(--clr-danger)] text-sm my-2 bg-[var(--clr-danger)]/20 p-2 rounded">
                {error}
              </p>
            )}

            <div className="mt-auto pt-3 border-t border-[var(--clr-border)] flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedCard(null);
                  setFetchedSkillSet(null);
                  setFetchedSpecialSets(null);
                  setError(null);
                }}
                className="btn-secondary py-2 px-4 text-sm"
              >
                <i className="fas fa-arrow-left mr-1"></i> Back to Search
              </button>
              <button
                onClick={handleImportConfirm}
                disabled={!canConfirmImport()}
                className="btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-download mr-1"></i> Confirm Import
              </button>
            </div>
          </div>
        )}

        {!selectedCard && (
          <div className="mt-auto pt-4 border-t border-[var(--clr-border)] flex justify-end">
            <button onClick={onClose} className="btn-secondary py-2 px-5">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
