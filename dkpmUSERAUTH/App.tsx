
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import * as authService from './services/authService';
import { DokkanPatchState, CardForm, CardUniqueInfo, PassiveSkillSet, LeaderSkillSet, SpecialSet, ActiveSkillSet, OptimalAwakeningGrowth, DokkanID, GeminiTaskType, GeminiRequestPayload, PassiveSkillEffectEntry, EffectPackEntry, CardSpecial } from './types';
import { INITIAL_CARD_FORM, generateLocalId, ELEMENT_TYPES, RARITY_TYPES, ID_PREFIXES, isLocallyGeneratedId, INITIAL_CARD_SPECIAL } from './constants';
import { examplePatchState } from './exampleData'; 
import { CharacterFormEditor } from './components/CharacterFormEditor';
import { SqlOutputDisplay } from './components/SqlOutputDisplay';
import { generateSqlPatch } from './services/sqlGenerator';
import { GlobalSkillSetsEditor } from './components/GlobalSkillSetsEditor';
import { EZAEditor } from './components/EZAEditor';
import { MiscTablesEditor }  from './components/MiscTablesEditor';
// import { GeminiInteractionModal } from './components/GeminiInteractionModal'; // Gemini disabled
import { LoadCharacterModal } from './components/LoadCharacterModal'; 
import * as dbService from './services/databaseService'; 
import type { Database as SqlJsDatabase } from 'sql.js';
import { LoginScreen } from './components/LoginScreen';


// const aiClientApiKey = process.env.API_KEY; // Gemini disabled

// Google Sign-In client library (GSI) global declaration is no longer needed
// declare global {
//   interface Window {
//     google: any; 
//   }
// }

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [patchState, setPatchState] = useState<DokkanPatchState>({
    cardForms: [INITIAL_CARD_FORM()],
    cardUniqueInfos: [],
    passiveSkillSets: [],
    leaderSkillSets: [],
    specialSets: [],
    activeSkillSets: [],
    cardSpecials: [],
    passiveSkillEffects: [],
    effectPacks: [],
    isEZA: false,
  });

  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [isLoadingSql, setIsLoadingSql] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('cardForms');
  
  const [dbInstance, setDbInstance] = useState<SqlJsDatabase | null>(null);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showLoadCharacterModal, setShowLoadCharacterModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    authService.initializeFirebaseApp(); // Initialize Firebase
    const unsubscribe = authService.onAuthChange(user => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe(); // Cleanup subscription
  }, []);

  const handleSignOut = async () => {
    try {
      await authService.logout();
      // setCurrentUser(null) will be handled by onAuthChange
      alert("Signed out successfully.");
    } catch (error) {
      console.error("Sign out error:", error);
      alert(`Failed to sign out: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
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
      alert("Database loaded successfully!");
    } catch (err) {
      console.error("Error loading database:", err);
      setDbError(err instanceof Error ? err.message : "Unknown error loading database.");
      alert(`Error loading database: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsDbLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCharacterLoaded = (loadedCharacterPatchState: DokkanPatchState) => {
    setPatchState(loadedCharacterPatchState);
    setGeneratedSql(''); 
    setActiveTab('cardForms'); 
    setShowLoadCharacterModal(false); 
    alert(`Character "${loadedCharacterPatchState.cardForms[0]?.name || 'Unknown'}" loaded successfully!`);
  };


  const updateCardForm = useCallback((index: number, updatedForm: CardForm) => {
    setPatchState(prev => {
      const oldForm = prev.cardForms[index];
      let newPatchState = { ...prev };
      const updatedCardForms = prev.cardForms.map((form, i) => i === index ? updatedForm : form);
      newPatchState.cardForms = updatedCardForms;

      if (oldForm.id !== updatedForm.id && isLocallyGeneratedId(oldForm.id)) {
        const oldCardId = oldForm.id;
        const newCardId = updatedForm.id;

        const oldUniqueInfoId = ID_PREFIXES.CARD_UNIQUE_INFO + oldCardId;
        if (isLocallyGeneratedId(oldUniqueInfoId)) {
            const newUniqueInfoId = ID_PREFIXES.CARD_UNIQUE_INFO + newCardId;
            newPatchState.cardUniqueInfos = prev.cardUniqueInfos.map(cui =>
                cui.id === oldUniqueInfoId ? { ...cui, id: newUniqueInfoId } : cui
            );
            if (updatedForm.card_unique_info_id === oldUniqueInfoId) {
                 updatedForm.card_unique_info_id = newUniqueInfoId;
            }
        }
        const skillSetTypesToUpdate: {
            key: keyof DokkanPatchState; 
            idField: keyof CardForm; 
            prefix: typeof ID_PREFIXES[keyof typeof ID_PREFIXES];
        }[] = [
            { key: 'passiveSkillSets', idField: 'passive_skill_set_id', prefix: ID_PREFIXES.PASSIVE_SKILL_SET },
            { key: 'leaderSkillSets', idField: 'leader_skill_set_id', prefix: ID_PREFIXES.LEADER_SKILL_SET },
            { key: 'activeSkillSets', idField: 'active_skill_set_id_ref', prefix: ID_PREFIXES.ACTIVE_SKILL_SET },
            { key: 'specialSets', idField: 'id', prefix: ID_PREFIXES.SPECIAL_SET } 
        ];

        skillSetTypesToUpdate.forEach(skillInfo => {
            const oldSetId = skillInfo.prefix + oldCardId;
            if (isLocallyGeneratedId(oldSetId)) {
                const newSetId = skillInfo.prefix + newCardId;
                (newPatchState[skillInfo.key] as Array<{id: DokkanID}>) = 
                    (prev[skillInfo.key] as Array<{id: DokkanID}>).map(set =>
                        set.id === oldSetId ? { ...set, id: newSetId } : set
                    );
                
                if (skillInfo.idField !== 'id' && (updatedForm[skillInfo.idField] as string) === oldSetId) {
                    (updatedForm[skillInfo.idField] as string) = newSetId;
                }
                if (skillInfo.key === 'specialSets') {
                    newPatchState.cardSpecials = newPatchState.cardSpecials.map(cs => 
                        cs.special_set_id === oldSetId && cs.card_id === oldCardId
                            ? { ...cs, special_set_id: newSetId, card_id: newCardId } 
                            : cs.card_id === oldCardId 
                                ? {...cs, card_id: newCardId }
                                : cs
                    );
                }
            }
        });
        
        newPatchState.cardSpecials = newPatchState.cardSpecials.map(cs => 
            cs.card_id === oldCardId ? { ...cs, card_id: newCardId } : cs
        );

        if (prev.isEZA && prev.optimalAwakeningGrowth && prev.baseCardIdForEZA === oldCardId) {
            const oldOagId = ID_PREFIXES.OPTIMAL_AWAKENING_GROWTH_ID + oldCardId;
            const oldOagTypeId = ID_PREFIXES.OPTIMAL_AWAKENING_GROWTH_TYPE_ID + oldCardId;
            let updatedOag = { ...prev.optimalAwakeningGrowth };

            if (isLocallyGeneratedId(oldOagId)) {
                updatedOag.id = ID_PREFIXES.OPTIMAL_AWAKENING_GROWTH_ID + newCardId;
            }
            if (isLocallyGeneratedId(oldOagTypeId)) {
                updatedOag.growth_type_id = ID_PREFIXES.OPTIMAL_AWAKENING_GROWTH_TYPE_ID + newCardId;
            }
            newPatchState.optimalAwakeningGrowth = updatedOag;
            if (updatedForm.hasOwnProperty('optimal_awakening_grow_type') && (updatedForm as any).optimal_awakening_grow_type === oldOagTypeId) {
                (updatedForm as any).optimal_awakening_grow_type = updatedOag.growth_type_id;
            }
        }
         newPatchState.cardForms = prev.cardForms.map((form, i) => i === index ? updatedForm : form);
      }
      return newPatchState;
    });
  }, []);

  const addCardForm = useCallback(() => {
    const newCardFormId = generateLocalId();
    
    const newUniqueInfoId = ID_PREFIXES.CARD_UNIQUE_INFO + newCardFormId;
    const newPassiveSetId = ID_PREFIXES.PASSIVE_SKILL_SET + newCardFormId;
    const newLeaderSetId = ID_PREFIXES.LEADER_SKILL_SET + newCardFormId;
    const newActiveSetId = ID_PREFIXES.ACTIVE_SKILL_SET + newCardFormId;
    const newSpecialSetId = ID_PREFIXES.SPECIAL_SET + newCardFormId;

    const newCardForm: CardForm = {
      ...INITIAL_CARD_FORM(),
      id: newCardFormId,
      name: `New Card ${newCardFormId}`,
      card_unique_info_id: newUniqueInfoId,
      passive_skill_set_id: newPassiveSetId,
      leader_skill_set_id: newLeaderSetId,
      active_skill_set_id_ref: newActiveSetId,
    };

    const newUniqueInfo: CardUniqueInfo = { id: newUniqueInfoId, name: `Character Name for ${newCardFormId}` };
    const newPassiveSet: PassiveSkillSet = { id: newPassiveSetId, name: `Passive for ${newCardFormId}`, description: '', skills: [] };
    const newLeaderSet: LeaderSkillSet = { id: newLeaderSetId, name: `Leader for ${newCardFormId}`, description: '', skills: [] };
    const newActiveSet: ActiveSkillSet = { id: newActiveSetId, name: `Active for ${newCardFormId}`, effect_description: '', condition_description: '', turn: 1, exec_limit: 1, skills: [] };
    const newSpecialSet: SpecialSet = { id: newSpecialSetId, name: `Special for ${newCardFormId}`, description: '', skills: [], aim_target: 0, increase_rate: 180, lv_bonus: 25, is_inactive: 0 };
    
    const newDefaultCardSpecial = INITIAL_CARD_SPECIAL(newCardFormId, newSpecialSetId);

    setPatchState(prev => ({
      ...prev,
      cardForms: [...prev.cardForms, newCardForm],
      cardUniqueInfos: [...prev.cardUniqueInfos, newUniqueInfo],
      passiveSkillSets: [...prev.passiveSkillSets, newPassiveSet],
      leaderSkillSets: [...prev.leaderSkillSets, newLeaderSet],
      activeSkillSets: [...prev.activeSkillSets, newActiveSet],
      specialSets: [...prev.specialSets, newSpecialSet],
      cardSpecials: [...prev.cardSpecials, newDefaultCardSpecial],
    }));
  }, []);

  const removeCardForm = useCallback((index: number, cardIdToRemove: DokkanID) => {
    setPatchState(prev => {
        const updatedCardSpecials = prev.cardSpecials.filter(cs => cs.card_id !== cardIdToRemove);
        return {
            ...prev,
            cardForms: prev.cardForms.filter((_, i) => i !== index),
            cardSpecials: updatedCardSpecials,
        };
    });
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
  
  const tabs = [
    { name: 'Card Forms', id: 'cardForms', icon: 'fa-id-card' },
    { name: 'Shared Skill Sets', id: 'skillSets', icon: 'fa-sitemap' },
    { name: 'EZA Details', id: 'ezaDetails', icon: 'fa-bolt' },
    { name: 'Misc Tables', id: 'miscTables', icon: 'fa-table-list' },
    { name: 'Generated SQL', id: 'sqlOutput', icon: 'fa-code' },
  ];

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-900 text-orange-400 font-rajdhani">
        <i className="fas fa-spinner fa-spin text-5xl"></i>
        <p className="ml-4 text-2xl">Loading Application...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen p-4 flex flex-col bg-indigo-900 text-indigo-100">
      <header className="mb-6">
        
        <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
  <i
    className="fas fa-dragon text-6xl text-orange-400 p-3 bg-orange-500 bg-opacity-20 rounded-full shadow-lg"
    style={{ textShadow: '0 0 10px rgba(251, 146, 60, 0.7)' }}
  ></i>
  <h1 className="text-5xl font-bold text-orange-400 tracking-wider font-rajdhani title-animated">
    Dokkan Patch Maker
  </h1>
</div>
                        <div className="flex items-center space-x-4">
                 {currentUser && (
                    <div className="flex items-center space-x-3 text-sm">
                        {currentUser.photoURL && <img src={currentUser.photoURL} alt="User" className="w-8 h-8 rounded-full"/>}
                        <span className="text-indigo-200 hidden md:inline">{currentUser.displayName || currentUser.email}</span>
                        <button 
                            onClick={handleSignOut}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-lg transition-all duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 font-rajdhani text-xs"
                            title="Sign Out"
                        >
                            <i className="fas fa-sign-out-alt"></i>
                            <span className="ml-1 hidden lg:inline">Sign Out</span>
                        </button>
                    </div>
                )}
                <div className="flex flex-col items-end">
                    <label htmlFor="db-upload" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-150 ease-in-out flex items-center justify-center shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-rajdhani text-sm cursor-pointer h-[38px]">
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
                    {dbError && <p className="text-xs text-red-400 mt-1 self-center">{dbError}</p>}
                </div>
            </div>
        </div>
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

        <main className="w-4/5 bg-gray-800 p-6 rounded-lg shadow-2xl overflow-y-auto border border-indigo-700" style={{maxHeight: 'calc(100vh - 180px)'}}>
          {activeTab === 'cardForms' && (
            <div key="cardFormsContent" className="content-animated-fade-in">
              <h2 className="text-3xl font-semibold mb-6 text-orange-400 font-rajdhani border-b-2 border-orange-500 pb-2">Card Form Details</h2>
              {patchState.cardForms.map((form, index) => (
                <CharacterFormEditor
                  key={form.id || index}
                  formIndex={index}
                  cardForm={form}
                  updateCardForm={updateCardForm}
                  removeCardForm={(idx) => removeCardForm(idx, form.id)} 
                  patchState={patchState} 
                  setPatchState={setPatchState}
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
<div className="flex flex-col space-y-1">
  <p className="text-indigo-300 text-center italic font-rajdhani text-sm">
    Made by @RapiddRobbiee
  </p>
  <p className="text-indigo-300 italic text-right font-rajdhani text-sm">
    v0.1
  </p>
</div>
   
    </div>
  );
};

export default App;