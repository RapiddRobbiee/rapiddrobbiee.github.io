import React, { useState, useEffect, useCallback } from 'react';
import type { Database as SqlJsDatabase } from 'sql.js';
import { CardBasicInfo, DokkanPatchState, DokkanID, OptimalAwakeningGrowth } from '../types';
import * as dbService from '../services/databaseService';
import { FormInput, FormSelect } from './FormControls';
import {
  ELEMENT_TYPE_OPTIONS,
  RARITY_TYPE_OPTIONS,
  ELEMENT_TYPES,
  generateLocalId,
  CATEGORY_SELECT_OPTIONS,
  LINK_SKILL_SELECT_OPTIONS,
  CATEGORIES,
  LINK_SKILLS,
} from '../constants';
import { logAnalyticsEvent } from '../services/analyticsService';
import { SearchableSelect } from './SearchableSelect';

interface LoadCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbInstance: SqlJsDatabase;
  onCharacterSelected: (patchState: DokkanPatchState) => void;
  onCharacterSelectedForPlanner: (cardId: DokkanID) => void;
  mode: 'patch' | 'planner';
  elementTypes: { [key: number]: string }; // This will be the expanded ELEMENT_TYPES
  rarityTypes: { [key: number]: string };
}

const idFilterOptions = [
  { label: 'All Cards', value: 'all' },
  { label: 'Base Cards (ID starts with 1)', value: 'base' },
  { label: 'Other/Transformed (ID not 1..)', value: 'transformed' },
];

const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <div className="skill-chip">
    <span className="truncate max-w-xs">{label}</span>
    <button
      onClick={onRemove}
      className="ml-2 text-[var(--clr-danger)] hover:text-red-300 text-xs p-1 rounded-full transition-colors"
    >
      <i className="fas fa-times"></i>
    </button>
  </div>
);

export const LoadCharacterModal: React.FC<LoadCharacterModalProps> = ({
  isOpen,
  onClose,
  dbInstance,
  onCharacterSelected,
  onCharacterSelectedForPlanner,
  mode,
  elementTypes,
  rarityTypes,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CardBasicInfo[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardBasicInfo | null>(null);
  const [ezaCheckData, setEzaCheckData] = useState<OptimalAwakeningGrowth | null>(null);
  const [showEzaChoice, setShowEzaChoice] = useState<boolean>(false);

  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<'search' | 'confirm' | 'eza_setup'>('search');
  const [newEzaBaseId, setNewEzaBaseId] = useState<DokkanID>('');

  // Filter states
  const [selectedElement, setSelectedElement] = useState<string>(''); // Empty string for "All"
  const [selectedRarity, setSelectedRarity] = useState<string>(''); // Empty string for "All"
  const [selectedIdFilter, setSelectedIdFilter] = useState<'all' | 'base' | 'transformed'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLinkSkills, setSelectedLinkSkills] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const performSearch = useCallback(async () => {
    if (!dbInstance) return;

    setIsLoadingSearch(true);
    setError(null);
    try {
      const elementVal = selectedElement ? parseInt(selectedElement) : null;
      const rarityVal = selectedRarity ? parseInt(selectedRarity) : null;

      logAnalyticsEvent('search_character_db', {
        search_term: searchTerm,
        element: elementVal,
        rarity: rarityVal,
        id_filter: selectedIdFilter,
        category_count: selectedCategories.length,
        link_skill_count: selectedLinkSkills.length,
      });

      const results = await dbService.searchCharactersByName(
        dbInstance,
        searchTerm,
        elementVal,
        rarityVal,
        selectedIdFilter,
        selectedCategories.length > 0 ? selectedCategories : null,
        selectedLinkSkills.length > 0 ? selectedLinkSkills : null
      );
      setSearchResults(results);
      if (results.length === 0) {
        setError('No characters found matching your search criteria.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search characters.');
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  }, [
    dbInstance,
    searchTerm,
    selectedElement,
    selectedRarity,
    selectedIdFilter,
    selectedCategories,
    selectedLinkSkills,
  ]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedElement !== '' ||
    selectedRarity !== '' ||
    selectedIdFilter !== 'all' ||
    selectedCategories.length > 0 ||
    selectedLinkSkills.length > 0;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (hasActiveFilters) {
        performSearch();
      } else {
        setSearchResults([]);
        setError(null);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [
    searchTerm,
    selectedElement,
    selectedRarity,
    selectedIdFilter,
    selectedCategories,
    selectedLinkSkills,
    performSearch,
  ]);

  const handleBackToSearch = () => {
    setSelectedCard(null);
    setShowEzaChoice(false);
    setEzaCheckData(null);
    setError(null);
    setView('search');
  };

  const loadCharacter = async (cardId: DokkanID, loadEza: boolean) => {
    if (mode === 'planner') {
      onCharacterSelectedForPlanner(cardId);
      return;
    }
    setIsLoadingDetails(true);
    setError(null);
    try {
      logAnalyticsEvent('load_character_version', { card_id: cardId, with_eza: loadEza });
      const characterPatchState = await dbService.getCharacterDetails(dbInstance, cardId, {
        loadEza,
      });
      if (characterPatchState) {
        onCharacterSelected(characterPatchState);
        onClose();
      } else {
        setError(`Could not load details for character ID: ${cardId}.`);
      }
    } catch (err) {
      console.error('Load details error:', err);
      setError(
        err instanceof Error ? err.message : `Failed to load details for character ID: ${cardId}.`
      );
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCharacterClick = async (card: CardBasicInfo) => {
    if (mode === 'planner') {
      onCharacterSelectedForPlanner(card.id);
      return;
    }
    setSelectedCard(card);
    setView('confirm');
    setError(null);
    setEzaCheckData(null);
    setShowEzaChoice(false);
  };

  const handleNormalImport = async () => {
    if (!selectedCard) return;
    setIsLoadingDetails(true);
    setError(null);
    try {
      const ezaData = await dbService.checkCharacterEZA(dbInstance, selectedCard.id);
      if (ezaData) {
        setEzaCheckData(ezaData);
        setShowEzaChoice(true);
      } else {
        await loadCharacter(selectedCard.id, false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check for EZA data.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEzaSetup = () => {
    if (!selectedCard) return;
    logAnalyticsEvent('create_eza_from_character_start', { original_card_id: selectedCard.id });
    setView('eza_setup');
    const localIdBase = String(generateLocalId()).slice(0, -1);
    setNewEzaBaseId(localIdBase);
  };

  const handleCreateEzaAndLoad = async () => {
    if (!selectedCard || !newEzaBaseId.trim()) {
      setError('Please provide a new base ID for the EZA.');
      return;
    }
    const baseId = newEzaBaseId.trim();
    if (/[01]$/.test(baseId)) {
      setError("Please provide the base ID without the final '0' or '1'.");
      return;
    }

    setIsLoadingDetails(true);
    setError(null);
    try {
      logAnalyticsEvent('create_eza_from_character_confirm', {
        original_card_id: selectedCard.id,
        new_base_id: baseId,
      });
      const ezaPatchState = await dbService.createEzaFromCharacter(
        dbInstance,
        selectedCard.id,
        baseId
      );
      if (ezaPatchState) {
        onCharacterSelected(ezaPatchState);
        onClose();
      } else {
        setError(`Could not create EZA data for character ID: ${selectedCard.id}.`);
      }
    } catch (err) {
      console.error('Create EZA error:', err);
      setError(err instanceof Error ? err.message : `Failed to create EZA data.`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (!isOpen) return null;

  const elementOptionsForFilter = [{ label: 'All Elements', value: '' }, ...ELEMENT_TYPE_OPTIONS];
  const rarityOptionsForFilter = [{ label: 'All Rarities', value: '' }, ...RARITY_TYPE_OPTIONS];

  const renderCardInfoSnippet = (card: CardBasicInfo) => (
    <div className="p-3 my-4 bg-[var(--clr-bg-card)] bg-opacity-60 rounded-lg shadow-inner border border-[var(--clr-border)] text-center">
      <p className="font-semibold text-[var(--clr-accent)] text-lg">
        {card.name}{' '}
        <span className="text-sm text-[var(--clr-text-muted)] font-normal">
          {card.title ? `(${card.title})` : ''}
        </span>
      </p>
      <p className="text-xs text-[var(--clr-text-muted)] font-roboto-mono">ID: {card.id}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm font-rajdhani modal-backdrop">
      <div className="modal-card p-6 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl modal-content">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold modal-title section-title pb-1">
            Load Character from Database
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--clr-text-muted)] hover:text-[var(--clr-accent)] text-2xl"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {isLoadingDetails && (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-center text-[var(--clr-accent)] my-4 text-xl">
              <i className="fas fa-spinner fa-spin mr-2"></i>Loading...
            </p>
          </div>
        )}

        {!isLoadingDetails && view === 'search' && (
          <>
            <FormInput
              label="Search Character Name or ID"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="e.g., Goku, Vegeta, 1000010..."
              className="mb-4"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
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
                label="Card Type Filter"
                value={selectedIdFilter}
                onChange={(val) => setSelectedIdFilter(val as 'all' | 'base' | 'transformed')}
                options={idFilterOptions}
              />
            </div>

            <div className="mb-4">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-sm text-[var(--clr-secondary)] hover:text-blue-300 transition-colors w-full text-left p-1"
              >
                Advanced Filters{' '}
                <i
                  className={`fas fa-chevron-down text-xs transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
                ></i>
              </button>
              {showAdvancedFilters && (
                <div className="p-4 mt-2 bg-[var(--clr-bg-main)]/40 rounded-lg border border-[var(--clr-border)] space-y-4">
                  <div>
                    <SearchableSelect
                      label="Add Category Filter"
                      options={CATEGORY_SELECT_OPTIONS}
                      value={''}
                      onChange={(catId) => {
                        if (catId && !selectedCategories.includes(String(catId)))
                          setSelectedCategories([...selectedCategories, String(catId)]);
                      }}
                      placeholder="Select a category..."
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCategories.map((catId) => (
                        <FilterChip
                          key={catId}
                          label={CATEGORIES.find((c) => c.id === catId)?.name || catId}
                          onRemove={() =>
                            setSelectedCategories(selectedCategories.filter((id) => id !== catId))
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <SearchableSelect
                      label="Add Link Skill Filter"
                      options={LINK_SKILL_SELECT_OPTIONS}
                      value={''}
                      onChange={(linkId) => {
                        if (linkId && !selectedLinkSkills.includes(String(linkId)))
                          setSelectedLinkSkills([...selectedLinkSkills, String(linkId)]);
                      }}
                      placeholder="Select a link skill..."
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedLinkSkills.map((linkId) => (
                        <FilterChip
                          key={linkId}
                          label={LINK_SKILLS.find((l) => l.id === linkId)?.name || linkId}
                          onRemove={() =>
                            setSelectedLinkSkills(selectedLinkSkills.filter((id) => id !== linkId))
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isLoadingSearch && (
              <p className="text-center text-[var(--clr-accent)] my-4">
                <i className="fas fa-spinner fa-spin mr-2"></i>Searching...
              </p>
            )}

            {error && (
              <p className="text-[var(--clr-danger)] text-sm text-center my-4 p-2 bg-red-900 bg-opacity-50 rounded">
                {error}
              </p>
            )}

            <div className="flex-grow overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {searchResults.map((char) => {
                const baseElementDisplay = char.element % 10;
                const elementColorClass =
                  baseElementDisplay === 0
                    ? 'bg-blue-500'
                    : baseElementDisplay === 1
                      ? 'bg-green-500'
                      : baseElementDisplay === 2
                        ? 'bg-purple-500'
                        : baseElementDisplay === 3
                          ? 'bg-red-500'
                          : baseElementDisplay === 4
                            ? 'bg-orange-500'
                            : 'bg-gray-500';

                return (
                  <div
                    key={char.id}
                    className="p-3 bg-[var(--clr-bg-card)] hover:bg-[var(--clr-bg-main)]/80 rounded-lg shadow-md cursor-pointer transition-all flex justify-between items-center border border-transparent hover:border-[var(--clr-border-focus)]"
                    onClick={() => !isLoadingDetails && handleCharacterClick(char)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && !isLoadingDetails && handleCharacterClick(char)
                    }
                    aria-label={`Load character ${char.name || char.title || char.id}`}
                  >
                    <div>
                      <p className="font-semibold text-[var(--clr-accent)] text-lg">
                        {char.name}{' '}
                        <span className="text-sm text-[var(--clr-text-muted)] font-normal">
                          {char.title ? `(${char.title})` : ''}
                        </span>
                      </p>
                      <p className="text-xs text-[var(--clr-text-muted)] font-roboto-mono">
                        ID: {char.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${elementColorClass}`}
                      >
                        {elementTypes[char.element] || '???'}
                      </span>
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-600 text-white">
                        {rarityTypes[char.rarity] || '???'}
                      </span>
                    </div>
                  </div>
                );
              })}
              {searchResults.length === 0 && !isLoadingSearch && hasActiveFilters && !error && (
                <p className="text-center text-[var(--clr-text-muted)] italic">
                  No results. Try adjusting your search or filters.
                </p>
              )}
            </div>
          </>
        )}

        {!isLoadingDetails && view === 'confirm' && selectedCard && (
          <div className="flex-grow flex flex-col justify-center items-center text-center">
            <h4 className="text-xl font-semibold text-[var(--clr-text-accent)]">
              Selected Character
            </h4>
            {renderCardInfoSnippet(selectedCard)}
            <p className="text-[var(--clr-text-muted)] mb-6">
              How would you like to import this character?
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full">
              <button
                onClick={handleNormalImport}
                className="flex-1 btn-secondary py-3 px-6 rounded-lg text-lg"
              >
                Import Character
              </button>
              <button onClick={handleEzaSetup} className="flex-1 btn-primary py-3 px-6 text-lg">
                <i className="fas fa-bolt mr-2"></i>Create EZA from this Character
              </button>
            </div>
            <button
              onClick={handleBackToSearch}
              className="mt-8 text-sm text-[var(--clr-secondary)] hover:text-[var(--clr-primary)] transition-colors"
            >
              <i className="fas fa-arrow-left mr-1"></i> Back to Search
            </button>
          </div>
        )}

        {!isLoadingDetails && view === 'eza_setup' && selectedCard && (
          <div className="flex-grow flex flex-col justify-center items-center text-center">
            <h4 className="text-xl font-semibold text-[var(--clr-text-accent)]">Create New EZA</h4>
            {renderCardInfoSnippet(selectedCard)}
            <p className="text-[var(--clr-text-muted)] mb-4 max-w-lg">
              Enter a new, unique Base Card ID for this EZA version (e.g., 190000). The application
              will then create the '...0' and '...1' card versions, duplicate skills, and set up the
              EZA relationship.
            </p>
            <div className="w-full max-w-sm mb-6">
              <FormInput
                label="New EZA Base ID (without final 0/1)"
                value={newEzaBaseId}
                onChange={setNewEzaBaseId}
                placeholder="e.g., 190000"
                className="text-center"
              />
            </div>
            {error && (
              <p className="text-[var(--clr-danger)] text-sm my-2 p-2 bg-red-900 bg-opacity-50 rounded">
                {error}
              </p>
            )}
            <div className="flex space-x-4">
              <button
                onClick={() => setView('confirm')}
                className="btn-secondary py-2 px-5 rounded-md"
              >
                Back
              </button>
              <button
                onClick={handleCreateEzaAndLoad}
                disabled={!newEzaBaseId.trim()}
                className="btn-primary py-2 px-5 rounded-md"
              >
                Create EZA & Load
              </button>
            </div>
          </div>
        )}

        {!isLoadingDetails && showEzaChoice && selectedCard && ezaCheckData && (
          <div className="flex-grow flex flex-col justify-center items-center text-center">
            <i
              className="fas fa-bolt text-5xl text-[var(--clr-warning)] mb-4"
              style={{ filter: 'drop-shadow(0 0 8px var(--clr-warning))' }}
            ></i>
            <h4 className="text-xl font-semibold text-[var(--clr-text-accent)]">
              Official EZA Detected!
            </h4>
            <p className="text-[var(--clr-text-muted)] mb-6">
              This character has an official Extreme Z-Awakening.
              <br />
              Which version would you like to load?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => loadCharacter(selectedCard.id, false)}
                className="btn-secondary py-3 px-6 rounded-lg text-lg"
              >
                Load Non-EZA Version
              </button>
              <button
                onClick={() => loadCharacter(selectedCard.id, true)}
                className="btn-primary py-3 px-6 text-lg"
              >
                <i className="fas fa-bolt mr-2"></i>Load Official EZA Version
              </button>
            </div>
            <button
              onClick={() => setView('confirm')}
              className="mt-8 text-sm text-[var(--clr-secondary)] hover:text-[var(--clr-primary)] transition-colors"
            >
              <i className="fas fa-arrow-left mr-1"></i> Back
            </button>
          </div>
        )}

        {view === 'search' && (
          <div className="mt-6 pt-4 border-t border-[var(--clr-border)] flex justify-end">
            <button
              onClick={onClose}
              className="btn-secondary py-2 px-5 rounded-md"
              disabled={isLoadingDetails}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
