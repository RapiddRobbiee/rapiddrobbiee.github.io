
import React, { useState, useEffect, useCallback } from 'react';
// import { GoogleGenAI, GenerateContentResponse } from "@google/genai"; // Gemini disabled - Ensure library is not loaded
import { GeminiRequestPayload, GeminiTaskType, PassiveSkill, LeaderSkill } from '../types';
import { EFFICACY_TYPES, CAUSALITY_TYPES } from '../constants'; // For context

interface GeminiInteractionModalProps {
  ai: any; // Changed GoogleGenAI to any as import is commented out
  isOpen: boolean;
  onClose: () => void;
  request: GeminiRequestPayload;
  onGeneratedText: (text: string) => void;
}

export const GeminiInteractionModal: React.FC<GeminiInteractionModalProps> = ({ ai, isOpen, onClose, request, onGeneratedText }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptText, setPromptText] = useState('');
  const [userInput, setUserInput] = useState(''); // For tasks requiring user input

  const generatePrompt = useCallback((taskType: GeminiTaskType, data: any, currentUserInput: string): string => {
    let context = '';
    const efficacyTypesContext = `Efficacy Types Reference (ID: Name):\n${Object.entries(EFFICACY_TYPES).map(([id, info]) => `${id}: ${info.name}`).join('\n')}\n\n`;
    const causalityTypesContext = `Causality Types Reference (ID: Name):\n${Object.entries(CAUSALITY_TYPES).map(([id, info]) => `${id}: ${info.name}`).join('\n')}\n\n`;

    switch (taskType) {
      case GeminiTaskType.GENERATE_PASSIVE_DESCRIPTION:
        const passiveSkills = data as PassiveSkill[];
        const effectsString = passiveSkills.map(p => `- Effect Type ${p.efficacy_type} (Values: ${p.eff_value1}, ${p.eff_value2}, ${p.eff_value3}), Timing: ${p.exec_timing_type}, Target: ${p.target_type}, Condition: ${p.causality_conditions || 'Always'}`).join('\n');
        context += efficacyTypesContext + causalityTypesContext;
        return `You are a Dokkan Battle game text writer. Given the following passive skill effects for a character, write a concise and engaging in-game description. Format it like official Dokkan Battle passive descriptions, using semicolons to separate clauses and appropriate Dokkan terminology (e.g., "ATK & DEF +150%", "high chance to perform a critical hit", "Ki +3").\n\nEffects:\n${effectsString}\n\nExample Style: "ATK & DEF +200%; plus an additional ATK & DEF +100% when performing a Super Attack if facing only 1 enemy and if that enemy's HP is 50% or less when the character performs a Super Attack, plus an additional ATK +100% and high chance of performing a critical hit."\n\nGenerate ONLY the description text.`;
      
      case GeminiTaskType.GENERATE_LEADER_DESCRIPTION:
        const leaderSkills = data as LeaderSkill[];
        const leaderEffectsString = leaderSkills.map(ls => `- Effect Type ${ls.efficacy_type} (Values: ${ls.efficacy_values}), Target: ${ls.target_type} (Sub-target: ${ls.sub_target_type_set_id || 'N/A'}), Condition: ${ls.causality_conditions || 'Always'}`).join('\n');
        context += efficacyTypesContext + causalityTypesContext;
        return `You are a Dokkan Battle game text writer. Given the following leader skill effects, write an official-style Dokkan Battle leader skill description. Include category names if specified in sub_target_type_set_id (assume IDs map to known categories), Ki boosts, and percentage boosts for HP, ATK, & DEF.\n\nEffects:\n${leaderEffectsString}\n\nExample Style: "'Time Travelers' Category Ki +3 and HP, ATK & DEF +170%; or Super Class Ki +3 and HP, ATK & DEF +130%."\n\nGenerate ONLY the description text.`;

      case GeminiTaskType.SUGGEST_CAUSALITY_JSON:
        context += causalityTypesContext;
        return `${context}The user wants to create a causality condition for a Dokkan Battle skill. Their requirement is: "${currentUserInput}".\nTranslate this requirement into the Dokkan Battle \`causality_conditions\` JSON format: \`{"source":"...","compiled":[...]}\`.\nRefer to the causality types above. For example, "HP is above 50%" might use type 1. "Elapsed turn 3" might use type 5. "HP > 50% AND turn > 3" would be \`{"source":"1&5","compiled":["&",["type",1,[50]],["type",5,[3]]]}\` (assuming causality ID 1 is HP> and causality ID 5 is turn>). Provide only the JSON string.`;

      case GeminiTaskType.SUGGEST_EFFICACY_TYPE:
         context += efficacyTypesContext;
        return `${context}The user wants to find a Dokkan Battle efficacy type for the following effect: "${currentUserInput}".\nBased on the efficacy types reference, suggest the most relevant Efficacy Type ID. Provide only the ID number.`;
      
      default:
        return "No specific prompt for this task type.";
    }
  }, []); // Empty dependency array as it only uses args and constants

  useEffect(() => {
    if (request) {
      // Pass empty string for currentUserInput for the initial prompt template
      setPromptText(generatePrompt(request.taskType, request.data, ''));
      setUserInput(''); // Reset user input when request changes
    }
  }, [request, generatePrompt]);

  const handleSubmit = async () => {
    if (!ai || !promptText) return; // ai would be null if Gemini is fully disabled
    setIsLoading(true);
    setError(null);
    try {
        // Regenerate with current userInput for the API call
        const currentPrompt = generatePrompt(request.taskType, request.data, userInput); 
        // The following line would cause an error as `ai.models` would not exist.
        // This component should not be callable if Gemini is disabled.
        // For safety, we check `ai.models` before calling.
        if (ai && ai.models && typeof ai.models.generateContent === 'function') {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17', 
                contents: currentPrompt,
            });
          
          const text = response.text;
          if (text) {
            onGeneratedText(text.trim());
          } else {
            setError("No text generated by AI.");
          }
        } else {
             setError("AI client is not properly initialized or available.");
        }
    } catch (e) {
      console.error("Gemini API error:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred with Gemini API.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const requiresUserInput = request.taskType === GeminiTaskType.SUGGEST_CAUSALITY_JSON || request.taskType === GeminiTaskType.SUGGEST_EFFICACY_TYPE;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-indigo-800 p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border-2 border-orange-500 font-rajdhani">
        <h3 className="text-2xl font-bold mb-4 text-orange-400">Gemini AI Helper</h3>
        <div className="flex-grow overflow-y-auto mb-4 pr-2">
            <p className="text-sm text-indigo-300 mb-2">Review and adjust the prompt if needed:</p>
            <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={10}
            className="w-full bg-indigo-700 bg-opacity-60 border border-indigo-600 text-indigo-100 rounded-md p-3 text-xs font-roboto-mono focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
            />
            {requiresUserInput && (
                <div className="mt-4">
                    <label className="block text-sm font-medium text-orange-300 mb-1">
                        Describe your requirement:
                    </label>
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="w-full bg-indigo-700 bg-opacity-60 border border-indigo-600 text-indigo-100 rounded-md py-2 px-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder-indigo-400"
                        placeholder={
                            request.taskType === GeminiTaskType.SUGGEST_CAUSALITY_JSON 
                            ? "e.g., HP below 30% OR an AGL enemy exists" 
                            : "e.g., increase attack and defense"
                        }
                    />
                </div>
            )}
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-indigo-700">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-indigo-100 rounded-md transition-colors font-semibold shadow-md hover:shadow-lg"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="py-2 px-5 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors disabled:opacity-60 font-semibold shadow-md hover:shadow-lg"
            disabled={isLoading || (requiresUserInput && !userInput.trim())}
          >
            {isLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Processing...</> : <><i className="fas fa-paper-plane mr-2"></i>Generate</>}
          </button>
        </div>
      </div>
    </div>
  );
};