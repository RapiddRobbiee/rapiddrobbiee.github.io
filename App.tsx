
import React, { useState, useCallback, useEffect, useRef } from 'react';
// import { GoogleGenAI } from "@google/genai"; // Gemini disabled
import { DokkanPatchState, CardForm, CardUniqueInfo, PassiveSkillSet, LeaderSkillSet, SpecialSet, ActiveSkillSet, OptimalAwakeningGrowth, DokkanID, GeminiTaskType, GeminiRequestPayload, PassiveSkillEffectEntry, EffectPackEntry } from './types';
import { INITIAL_CARD_FORM, generateLocalId, ELEMENT_TYPES, RARITY_TYPES } from './constants';
import { examplePatchState } from './exampleData'; 
import { CharacterFormEditor } from './components/CharacterFormEditor';
import { SqlOutputDisplay } from './components/SqlOutputDisplay';
import { generateSqlPatch } from './services/sqlGenerator';
import { GlobalSkillSetsEditor } from './components/GlobalSkillSetsEditor';
import { EZAEditor } from './components/EZAEditor';
import { MiscTablesEditor }  from './components/MiscTablesEditor';
// import { GeminiInteractionModal } from './components/GeminiInteractionModal'; // Gemini disabled
import { LoadCharacterModal } from './components/LoadCharacterModal'; // New Modal
import * as dbService from './services/databaseService'; // New Service
import type { Database as SqlJsDatabase } from 'sql.js';


// const aiClientApiKey = process.env.API_KEY; // Gemini disabled

const App: React.FC = () => {
  // const [apiKeyError, setApiKeyError] = useState<string | null>(null); // Gemini disabled
  // const [ai, setAi] = useState<GoogleGenAI | null>(null); // Gemini disabled

  const [patchState, setPatchState] = useState<DokkanPatchState>({
    cardForms: [INITIAL_CARD_FORM()],
    cardUniqueInfos: [],
    passiveSkillSets: [],
    leaderSkillSets: [],
    specialSets: [],
    activeSkillSets: [],
    passiveSkillEffects: [],
    effectPacks: [],
    isEZA: false,
  });

  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [isLoadingSql, setIsLoadingSql] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('cardForms');
  
  // Gemini related state - disabled
  // const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  // const [geminiRequest, setGeminiRequest] = useState<GeminiRequestPayload | null>(null);
  // const [geminiTargetUpdater, setGeminiTargetUpdater] = useState<((text: string) => void) | null>(null);

  // Database related state
  const [dbInstance, setDbInstance] = useState<SqlJsDatabase | null>(null);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showLoadCharacterModal, setShowLoadCharacterModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // useEffect(() => { // Gemini disabled
  //   if (!aiClientApiKey) {
  //     setApiKeyError("API_KEY environment variable not set. Gemini features will be disabled.");
  //     console.error("API_KEY environment variable not set.");
  //   } else {
  //     try {
  //       setAi(new GoogleGenAI({ apiKey: aiClientApiKey }));
  //     } catch (error) {
  //       console.error("Error initializing GoogleGenAI:", error);
  //       setApiKeyError("Failed to initialize Gemini AI. Check API Key and network.");
  //     }
  //   }
  // }, []);

  const handleDbFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsDbLoading(true);
    setDbError(null);
    setDbInstance(null);
    try {
      const loadedDb = await dbService.loadDatabase(file);
      setDbInstance(loadedDb);
      alert("Database loaded successfully!");
    } catch (err) {
      console.error("Error loading database:", err);
      setDbError(err instanceof Error ? err.message : "Unknown error loading database.");
      alert(`Error loading database: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsDbLoading(false);
      // Reset file input to allow loading the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCharacterLoaded = (loadedCharacterPatchState: DokkanPatchState) => {
    setPatchState(loadedCharacterPatchState);
    setGeneratedSql(''); // Clear previously generated SQL
    setActiveTab('cardForms'); // Switch to card forms tab
    setShowLoadCharacterModal(false); // Close the modal
    alert(`Character "${loadedCharacterPatchState.cardForms[0]?.name || 'Unknown'}" loaded successfully!`);
  };


  const updateCardForm = useCallback((index: number, updatedForm: CardForm) => {
    setPatchState(prev => ({
      ...prev,
      cardForms: prev.cardForms.map((form, i) => i === index ? updatedForm : form)
    }));
  }, []);

  const addCardForm = useCallback(() => {
    const newFormId = generateLocalId('cardForm');
    const newUniqueInfoId = generateLocalId('uniqueInfo');
    const newPassiveSetId = generateLocalId('passiveSet');
    const newSpecialSetId = generateLocalId('specialSet');
    const newActiveSetId = generateLocalId('activeSet');
    
    const newCardForm: CardForm = {
      ...INITIAL_CARD_FORM(),
      id: newFormId,
      card_unique_info_id: newUniqueInfoId,
      passive_skill_set_id: newPassiveSetId,
      special_set_id_ref: newSpecialSetId,
      active_skill_set_id_ref: newActiveSetId,
    };

    setPatchState(prev => ({
      ...prev,
      cardForms: [...prev.cardForms, newCardForm],
      cardUniqueInfos: [...prev.cardUniqueInfos, { id: newUniqueInfoId, name: `Character Name ${prev.cardUniqueInfos.length + 1}` }],
      passiveSkillSets: [...prev.passiveSkillSets, { id: newPassiveSetId, name: `Passive ${prev.passiveSkillSets.length + 1}`, description: '', skills: [] }],
      specialSets: [...prev.specialSets, { id: newSpecialSetId, name: `Special ${prev.specialSets.length + 1}`, description: '', skills: [], aim_target: 0, increase_rate: 180, lv_bonus: 25, is_inactive: 0 }],
      activeSkillSets: [...prev.activeSkillSets, {id: newActiveSetId, name: `Active ${prev.activeSkillSets.length + 1}`, effect_description: '', condition_description: '', turn:1, exec_limit:1, skills:[]}]
    }));
  }, []);

  const removeCardForm = useCallback((index: number) => {
    setPatchState(prev => ({
      ...prev,
      cardForms: prev.cardForms.filter((_, i) => i !== index)
    }));
  }, []);

  const handleGenerateSql = useCallback(() => {
    setIsLoadingSql(true);
    try {
      const sql = generateSqlPatch(patchState);
      setGeneratedSql(sql);
    } catch (error) {
      console.error("Error generating SQL:", error);
      setGeneratedSql(`-- Error generating SQL: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingSql(false);
    }
  }, [patchState]);

  const handleImportExample = () => {
    const newState = JSON.parse(JSON.stringify(examplePatchState));
    setPatchState(newState);
    setGeneratedSql(''); 
    setActiveTab('cardForms');
    alert("Example data loaded. Please review and adjust as needed.");
  };

  // Gemini disabled
  // const openGeminiModal = (taskType: GeminiTaskType, data: any, updater: (text: string) => void) => {
  //   if (!ai) {
  //     alert("Gemini AI is not initialized. Please check your API_KEY.");
  //     return;
  //   }
  //   setGeminiRequest({ taskType, data });
  //   setGeminiTargetUpdater(() => updater); 
  //   setIsGeminiModalOpen(true);
  // };
  
  const tabs = [
    { name: 'Card Forms', id: 'cardForms', icon: 'fa-id-card' },
    { name: 'Shared Skill Sets', id: 'skillSets', icon: 'fa-sitemap' },
    { name: 'EZA Details', id: 'ezaDetails', icon: 'fa-bolt' },
    { name: 'Misc Tables', id: 'miscTables', icon: 'fa-table-list' },
    { name: 'Generated SQL', id: 'sqlOutput', icon: 'fa-code' },
  ];

  return (
    <div className="min-h-screen p-4 flex flex-col bg-indigo-900 text-indigo-100">
      <header className="mb-6">
        <div className="flex justify-between items-start">
            <h1 className="text-5xl font-bold text-center text-orange-400 tracking-wider font-rajdhani title-animated flex-grow">
            Dokkan Battle Patch Maker
            </h1>
            <div className="w-1/4 flex flex-col items-end space-y-2">
                <label htmlFor="db-upload" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-150 ease-in-out flex items-center justify-center shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-rajdhani text-sm cursor-pointer">
                    <i className="fas fa-database mr-2"></i>
                    {isDbLoading ? 'Loading DB...' : (dbInstance ? 'DB Loaded' : 'Select .db File')}
                </label>
                <input
                    type="file"
                    id="db-upload"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".db, .sqlite, .sqlite3"
                    onChange={handleDbFileChange}
                    disabled={isDbLoading}
                />
                {dbError && <p className="text-xs text-red-400">{dbError}</p>}
            </div>
        </div>
        {/* {apiKeyError && <p className="text-center text-red-400 mt-1 font-rajdhani">{apiKeyError}</p>} Gemini disabled */}
      </header>

      <div className="flex-grow flex">
        <aside className="w-1/5 pr-4">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ease-in-out focus:outline-none font-rajdhani font-semibold text-lg shadow-md hover:shadow-lg
                  ${activeTab === tab.id 
                    ? 'bg-orange-500 text-white transform scale-105 ring-2 ring-orange-300' 
                    : 'bg-indigo-700 hover:bg-indigo-600 hover:text-orange-300'}`}
              >
                <i className={`fas ${tab.icon} mr-3 w-5 text-center`}></i>
                {tab.name}
              </button>
            ))}
          </nav>
           <div className="mt-8 space-y-4">
            <button
                onClick={() => dbInstance ? setShowLoadCharacterModal(true) : alert("Please load a database file first.")}
                disabled={!dbInstance || isDbLoading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out disabled:opacity-60 flex items-center justify-center shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-teal-400 font-rajdhani text-lg"
            >
                <i className="fas fa-user-edit mr-2"></i>
                Load from DB
            </button>
            <button
                onClick={handleGenerateSql}
                disabled={isLoadingSql}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out disabled:opacity-60 flex items-center justify-center shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-400 font-rajdhani text-lg"
            >
                <i className="fas fa-cogs mr-2"></i>
                {isLoadingSql ? 'Generating...' : 'Generate SQL Patch'}
            </button>
            <button
                onClick={handleImportExample}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out flex items-center justify-center shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 font-rajdhani text-lg"
            >
                <i className="fas fa-file-import mr-2"></i>
                Load Example Data
            </button>
          </div>
        </aside>

        <main className="w-4/5 bg-gray-800 p-6 rounded-lg shadow-2xl overflow-y-auto border border-indigo-700" style={{maxHeight: 'calc(100vh - 150px)'}}> {/* Adjusted maxHeight */}
          {activeTab === 'cardForms' && (
            <div key="cardFormsContent" className="content-animated-fade-in">
              <h2 className="text-3xl font-semibold mb-6 text-orange-400 font-rajdhani border-b-2 border-orange-500 pb-2">Card Form Details</h2>
              {patchState.cardForms.map((form, index) => (
                <CharacterFormEditor
                  key={form.id || index}
                  formIndex={index}
                  cardForm={form}
                  updateCardForm={updateCardForm}
                  removeCardForm={removeCardForm}
                  allSkillSets={patchState} 
                  setPatchState={setPatchState} 
                  // openGeminiModal={openGeminiModal} // Gemini disabled
                />
              ))}
              <button
                onClick={addCardForm}
                className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-150 ease-in-out flex items-center shadow-md hover:shadow-lg font-rajdhani text-md"
              >
                <i className="fas fa-plus mr-2"></i> Add Card Form
              </button>
            </div>
          )}

          {activeTab === 'skillSets' && (
            <div key="skillSetsContent" className="content-animated-fade-in">
              <GlobalSkillSetsEditor
                patchState={patchState} 
                setPatchState={setPatchState} 
                // openGeminiModal={openGeminiModal} // Gemini disabled
              />
            </div>
          )}
          
          {activeTab === 'ezaDetails' && (
            <div key="ezaDetailsContent" className="content-animated-fade-in">
             <EZAEditor patchState={patchState} setPatchState={setPatchState} />
            </div>
          )}

          {activeTab === 'miscTables' && (
            <div key="miscTablesContent" className="content-animated-fade-in">
              <MiscTablesEditor patchState={patchState} setPatchState={setPatchState} />
            </div>
          )}

          {activeTab === 'sqlOutput' && (
            <div key="sqlOutputContent" className="content-animated-fade-in">
              <h2 className="text-3xl font-semibold mb-6 text-orange-400 font-rajdhani border-b-2 border-orange-500 pb-2">Generated SQL</h2>
              <SqlOutputDisplay sql={generatedSql} />
            </div>
          )}
        </main>
      </div>

      {/* GeminiInteractionModal rendering disabled */}
      {/* {isGeminiModalOpen && geminiRequest && ai && (
        <GeminiInteractionModal
          ai={ai}
          isOpen={isGeminiModalOpen}
          onClose={() => setIsGeminiModalOpen(false)}
          request={geminiRequest}
          onGeneratedText={(text) => {
            if (geminiTargetUpdater) {
              geminiTargetUpdater(text);
            }
            setIsGeminiModalOpen(false);
          }}
        />
      )} */}
      {dbInstance && showLoadCharacterModal && (
        <LoadCharacterModal
          isOpen={showLoadCharacterModal}
          onClose={() => setShowLoadCharacterModal(false)}
          dbInstance={dbInstance}
          onCharacterSelected={handleCharacterLoaded}
          elementTypes={ELEMENT_TYPES}
          rarityTypes={RARITY_TYPES}
        />
      )}
    </div>
  );
};

export default App;
