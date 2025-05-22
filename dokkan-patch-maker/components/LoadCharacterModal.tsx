
import React, { useState, useEffect, useCallback } from 'react';
import type { Database as SqlJsDatabase } from 'sql.js';
import { CardBasicInfo, DokkanPatchState, DokkanID } from '../types';
import * as dbService from '../services/databaseService';
import { FormInput, FormSelect } from './FormControls';
import { ELEMENT_TYPE_OPTIONS, RARITY_TYPE_OPTIONS, ELEMENT_TYPES } from '../constants';

interface LoadCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbInstance: SqlJsDatabase;
  onCharacterSelected: (patchState: DokkanPatchState) => void;
  elementTypes: { [key: number]: string }; // This will be the expanded ELEMENT_TYPES
  rarityTypes: { [key: number]: string };
}

const idFilterOptions = [
    { label: "All Cards", value: "all" },
    { label: "Base Cards (ID starts with 1)", value: "base" },
    { label: "Other/Transformed (ID not 1..)", value: "transformed" },
];

export const LoadCharacterModal: React.FC<LoadCharacterModalProps> = ({
  isOpen,
  onClose,
  dbInstance,
  onCharacterSelected,
  elementTypes, 
  rarityTypes,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CardBasicInfo[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedElement, setSelectedElement] = useState<string>(""); // Empty string for "All"
  const [selectedRarity, setSelectedRarity] = useState<string>("");   // Empty string for "All"
  const [selectedIdFilter, setSelectedIdFilter] = useState<'all' | 'base' | 'transformed'>("all");

  const performSearch = useCallback(async () => {
    if (!dbInstance) return;
    // Only search if there's a term or if filters are active (to allow browsing by filter)
    // For now, require a search term to initiate. Can be changed later.
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setError(null); // Clear error if search term is cleared
      return;
    }

    setIsLoadingSearch(true);
    setError(null);
    try {
      const elementVal = selectedElement ? parseInt(selectedElement) : null;
      const rarityVal = selectedRarity ? parseInt(selectedRarity) : null;

      const results = await dbService.searchCharactersByName(
        dbInstance, 
        searchTerm,
        elementVal,
        rarityVal,
        selectedIdFilter
      );
      setSearchResults(results);
      if (results.length === 0) {
        setError("No characters found matching your search criteria.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Failed to search characters.");
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  }, [dbInstance, searchTerm, selectedElement, selectedRarity, selectedIdFilter]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Trigger search if search term has min length OR if filters are active and term is not empty
      if (searchTerm.length > 0) { 
        performSearch();
      } else if (searchTerm.length === 0) {
        setSearchResults([]); // Clear results if search term is cleared
        setError(null);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedElement, selectedRarity, selectedIdFilter, performSearch]);

  const handleSelectCharacter = async (cardId: DokkanID) => {
    setIsLoadingDetails(true);
    setError(null);
    try {
      const characterPatchState = await dbService.getCharacterDetails(dbInstance, cardId);
      if (characterPatchState) {
        onCharacterSelected(characterPatchState);
        onClose(); 
      } else {
        setError(`Could not load details for character ID: ${cardId}.`);
      }
    } catch (err) {
      console.error("Load details error:", err);
      setError(err instanceof Error ? err.message : `Failed to load details for character ID: ${cardId}.`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (!isOpen) return null;

  // Use the globally defined ELEMENT_TYPE_OPTIONS for consistency
  const elementOptionsForFilter = [{label: "All Elements", value: ""}, ...ELEMENT_TYPE_OPTIONS];
  const rarityOptionsForFilter = [{label: "All Rarities", value: ""}, ...RARITY_TYPE_OPTIONS];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm font-rajdhani">
      <div className="bg-indigo-900 p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border-2 border-orange-500">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-orange-400">Load Character from Database</h3>
          <button onClick={onClose} className="text-indigo-300 hover:text-orange-400 text-2xl">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <FormInput
          label="Search Character Name or ID"
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="e.g., Goku, Vegeta, 1000010..."
          className="mb-4"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <FormSelect
                label="Element"
                value={selectedElement}
                onChange={(val) => setSelectedElement(val)}
                options={elementOptionsForFilter}
            />
            <FormSelect
                label="Rarity"
                value={selectedRarity}
                onChange={(val) => setSelectedRarity(val)}
                options={rarityOptionsForFilter}
            />
            <FormSelect
                label="Card Type Filter"
                value={selectedIdFilter}
                onChange={(val) => setSelectedIdFilter(val as 'all' | 'base' | 'transformed')}
                options={idFilterOptions}
            />
        </div>


        {isLoadingSearch && <p className="text-center text-indigo-300 my-4"><i className="fas fa-spinner fa-spin mr-2"></i>Searching...</p>}
        {isLoadingDetails && <p className="text-center text-indigo-300 my-4"><i className="fas fa-spinner fa-spin mr-2"></i>Loading character details...</p>}
        {error && <p className="text-red-400 text-sm text-center my-4 p-2 bg-red-900 bg-opacity-50 rounded">{error}</p>}

        <div className="flex-grow overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {searchResults.map((char) => {
            const baseElementDisplay = char.element % 10; // 0 for AGL, 1 for TEQ etc.
            const elementColorClass = 
                (baseElementDisplay === 0) ? 'bg-blue-500' :    // AGL (0, 10, 20)
                (baseElementDisplay === 1) ? 'bg-green-500' :  // TEQ (1, 11, 21)
                (baseElementDisplay === 2) ? 'bg-purple-500' : // INT (2, 12, 22)
                (baseElementDisplay === 3) ? 'bg-red-500' :    // STR (3, 13, 23)
                (baseElementDisplay === 4) ? 'bg-orange-500' : // PHY (4, 14, 24)
                'bg-gray-500'; // Default/Unknown

            return (
                <div
                  key={char.id}
                  className="p-3 bg-indigo-800 hover:bg-indigo-700 rounded-lg shadow-md cursor-pointer transition-all flex justify-between items-center border border-indigo-700 hover:border-orange-500"
                  onClick={() => !isLoadingDetails && handleSelectCharacter(char.id)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoadingDetails && handleSelectCharacter(char.id)}
                  aria-label={`Load character ${char.name || char.title || char.id}`}
                >
                  <div>
                    <p className="font-semibold text-orange-300 text-lg">
                      {char.name} <span className="text-sm text-indigo-300 font-normal">{char.title ? `(${char.title})` : ''}</span>
                    </p>
                    <p className="text-xs text-indigo-400 font-roboto-mono">ID: {char.id}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${elementColorClass}`}>
                      {elementTypes[char.element] || '???'} 
                    </span>
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-600 text-white">
                      {rarityTypes[char.rarity] || '???'}
                    </span>
                  </div>
                </div>
            );
          })}
           {searchResults.length === 0 && !isLoadingSearch && searchTerm && !error && (
             <p className="text-center text-indigo-300 italic">No results. Try adjusting your search or filters.</p>
           )}
        </div>

        <div className="mt-6 pt-4 border-t border-indigo-700 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-indigo-100 rounded-md transition-colors font-semibold shadow-md hover:shadow-lg"
            disabled={isLoadingDetails}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
