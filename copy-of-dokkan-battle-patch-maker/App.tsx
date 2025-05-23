
import React, { useState, useCallback, useEffect, useRef } from 'react';
// import { GoogleGenAI } from "@google/genai"; // Gemini disabled
import { DokkanPatchState, CardForm, CardUniqueInfo, PassiveSkillSet, LeaderSkillSet, SpecialSet, ActiveSkillSet, OptimalAwakeningGrowth, DokkanID, GeminiTaskType, GeminiRequestPayload, PassiveSkillEffectEntry, EffectPackEntry, CardSpecial } from './types';
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
import { LoginScreen } from './components/LoginScreen';


// const aiClientApiKey = process.env.API_KEY; // Gemini disabled

// Add TypeScript declaration for the Google Sign-In client library
declare global {
  interface Window {
    google: any; 
  }
}

// Helper function to parse JWT (simplified, no signature verification)
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT', e);
    return null;
  }
}

interface GoogleUser {
  name?: string;
  email?: string;
  picture?: string;
}

// IMPORTANT: Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = '467611877502-befjj3lrkf3j2g0m4tnjcfq5ghvgrjmg.apps.googleusercontent.com';
const isPlaceholderClientId = GOOGLE_CLIENT_ID === '467611877502-befjj3lrkf3j2g0m4tnjcfq5ghvgrjmg.apps.googleusercontent.com';


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
    cardSpecials: [], // Added for multiple special attacks
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

  // Google Sign-In state
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [isGoogleAuthInitialized, setIsGoogleAuthInitialized] = useState<boolean>(false);


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

  const handleCredentialResponse = useCallback((response: any /* google.accounts.id.CredentialResponse */) => {
    const decodedToken: any = parseJwt(response.credential);
    if (decodedToken) {
      setGoogleUser({
        name: decodedToken.name,
        email: decodedToken.email,
        picture: decodedToken.picture,
      });
    } else {
      console.error('Failed to decode JWT token from Google.');
      // setApiKeyError("Failed to process Google Sign-In response."); // Consider a different error state
    }
  }, []);


  const initializeGoogleSignIn = useCallback(() => {
    if (isGoogleAuthInitialized || typeof window.google === 'undefined' || !window.google.accounts || !window.google.accounts.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,
        use_fedcm_for_prompt: false // Disable FedCM for OneTap to avoid NotAllowedError if Permissions-Policy isn't effective
      });
      setIsGoogleAuthInitialized(true);
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
      // You could set an error state here to inform the user
    }
  }, [isGoogleAuthInitialized, handleCredentialResponse]);

  useEffect(() => {
    // GIS script is loaded async defer, so we need to ensure it's ready.
    const gsiScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (gsiScript) {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        // Already loaded
        initializeGoogleSignIn();
      } else {
        // Wait for it to load
        (gsiScript as HTMLScriptElement).onload = () => {
          initializeGoogleSignIn();
        };
      }
    } else {
      console.error("Google GSI script not found. Ensure it's in index.html.");
    }
  }, [initializeGoogleSignIn]);


  const handleSignOut = () => {
    setGoogleUser(null);
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
      // If you want to revoke the token:
      // window.google.accounts.id.revoke(userEmail, () => {});
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
    setPatchState(prev => ({
      ...prev,
      cardForms: prev.cardForms.map((form, i) => i === index ? updatedForm : form)
    }));
  }, []);

  const addCardForm = useCallback(() => {
    const newFormId = generateLocalId('cardForm');
    const newUniqueInfoId = generateLocalId('uniqueInfo');
    const newPassiveSetId = generateLocalId('passiveSet');
    const newActiveSetId = generateLocalId('activeSet');
    
    const newCardForm: CardForm = {
      ...INITIAL_CARD_FORM(),
      id: newFormId,
      card_unique_info_id: newUniqueInfoId,
      passive_skill_set_id: newPassiveSetId,
      active_skill_set_id_ref: newActiveSetId,
    };

    setPatchState(prev => ({
      ...prev,
      cardForms: [...prev.cardForms, newCardForm],
      cardUniqueInfos: [...prev.cardUniqueInfos, { id: newUniqueInfoId, name: `Character Name ${prev.cardUniqueInfos.length + 1}` }],
      passiveSkillSets: [...prev.passiveSkillSets, { id: newPassiveSetId, name: `Passive ${prev.passiveSkillSets.length + 1}`, description: '', skills: [] }],
      activeSkillSets: [...prev.activeSkillSets, {id: newActiveSetId, name: `Active ${prev.activeSkillSets.length + 1}`, effect_description: '', condition_description: '', turn:1, exec_limit:1, skills:[]}]
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

  if (!googleUser) {
    return (
      <LoginScreen 
        isGoogleAuthInitialized={isGoogleAuthInitialized}
        googleClientIdWarning={isPlaceholderClientId}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col bg-indigo-900 text-indigo-100">
      <header className="mb-6">
        <div className="flex justify-between items-center">
            <h1 className="text-5xl font-bold text-orange-400 tracking-wider font-rajdhani title-animated">
                Dokkan Battle Patch Maker
            </h1>
            <div className="flex items-center space-x-4">
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

                {googleUser && ( 
                    <div className="flex items-center space-x-2 bg-indigo-700 bg-opacity-50 p-1 pr-2 rounded-lg shadow-md h-[38px]">
                        {googleUser.picture && <img src={googleUser.picture} alt={googleUser.name || 'User'} className="w-7 h-7 rounded-full border-2 border-orange-400" />}
                        <div className="flex flex-col items-start">
                          <span className="text-xs text-indigo-100 font-rajdhani font-semibold truncate max-w-[100px] sm:max-w-[150px]" title={googleUser.name || googleUser.email}>{googleUser.name || googleUser.email}</span>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-md transition-colors duration-150 ease-in-out shadow-sm hover:shadow-md focus:outline-none focus:ring-1 focus:ring-red-300"
                            aria-label="Sign out"
                        >
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                )}
            </div>
        </div>
        {/* {apiKeyError && <p className="text-center text-red-400 mt-1 font-rajdhani">{apiKeyError}</p>} Gemini disabled */}
        { isPlaceholderClientId && 
          <p className="text-center text-yellow-400 text-xs mt-1 font-rajdhani bg-yellow-900 bg-opacity-50 p-1 rounded-md">
            <i className="fas fa-exclamation-triangle mr-1"></i> Developer Note: Google Sign-In requires a valid Client ID. Please replace the placeholder in App.tsx.
          </p>
        }
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

        <main className="w-4/5 bg-gray-800 p-6 rounded-lg shadow-2xl overflow-y-auto border border-indigo-700" style={{maxHeight: 'calc(100vh - 180px)'}}> {/* Adjusted maxHeight for new header */}
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
