import React, { useState, useRef } from 'react';
import { parseSqlPatch } from '../services/sqlParser';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { XMarkIcon, ArrowUpTrayIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { DokkanPatchState } from '../types';

interface ImportSqlModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (state: DokkanPatchState) => void;
}

export const ImportSqlModal: React.FC<ImportSqlModalProps> = ({ isOpen, onClose, onImport }) => {
    const [sqlInput, setSqlInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { theme } = useAppContext();
    const { addToast } = useToast();

    if (!isOpen) return null;

    const handleParse = () => {
        setError(null);
        setIsParsing(true);

        // Small timeout to let UI render the loading state
        setTimeout(() => {
            try {
                if (!sqlInput.trim()) {
                    throw new Error("Please enter SQL code or upload a file.");
                }

                const newState = parseSqlPatch(sqlInput);

                // Basic validation: check if we got any cards or skills
                const hasData = newState.cardForms.length > 0 ||
                    newState.passiveSkillSets.length > 0 ||
                    newState.leaderSkillSets.length > 0;

                if (!hasData) {
                    throw new Error("No valid Dokkan data found in the SQL. Ensure it contains standard INSERT statements for 'cards', 'passive_skill_sets', etc.");
                }

                onImport(newState);
                addToast(`Successfully imported patch! Loaded ${newState.cardForms.length} cards.`, { type: 'success' });
                onClose();
                setSqlInput('');
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : "An unknown error occurred during parsing.");
            } finally {
                setIsParsing(false);
            }
        }, 100);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setSqlInput(content);
        };
        reader.readAsText(file);
    };

    // Theme classes
    const isDark = theme !== 'classic'; // Assuming classic is light-ish, others dark
    const bgColor = isDark ? 'bg-gray-800' : 'bg-white';
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className={`${bgColor} ${textColor} w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]`}>

                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <ClipboardDocumentListIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Reverse SQL Import</h2>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Reconstruct your patch from a .sql file
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg hover:bg-gray-500/10 transition-colors`}
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">

                    {/* Info Alert */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-400">
                        <p className="font-semibold mb-1">How this works:</p>
                        <p>
                            Paste the content of a <code>patch.sql</code> file below. The tool will parse the <code>INSERT</code> statements
                            and rebuild the visual editor state.
                        </p>
                        <p className="mt-2 text-xs opacity-80">
                            * Only supports standard SQL format generated by this tool. Complex custom SQL may fail.
                        </p>
                    </div>

                    {/* File Upload */}
                    <div className="flex justify-end">
                        <input
                            type="file"
                            accept=".sql,.txt"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${borderColor} hover:bg-gray-500/10 transition-colors text-sm font-medium`}
                        >
                            <ArrowUpTrayIcon className="w-4 h-4" />
                            Upload .sql File
                        </button>
                    </div>

                    {/* Text Area */}
                    <textarea
                        value={sqlInput}
                        onChange={(e) => setSqlInput(e.target.value)}
                        placeholder="INSERT INTO &quot;main&quot;.&quot;cards&quot; ..."
                        className={`w-full h-64 p-4 rounded-lg border ${borderColor} bg-black/20 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none`}
                        spellCheck={false}
                    />

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
                            <strong>Parsing Error:</strong> {error}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className={`p-6 border-t ${borderColor} flex justify-end gap-3`}>
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleParse}
                        disabled={isParsing || !sqlInput.trim()}
                        className={`px-6 py-2 rounded-lg font-bold text-white transition-all
              ${isParsing || !sqlInput.trim()
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                            }`}
                    >
                        {isParsing ? 'Parsing...' : 'Import Patch'}
                    </button>
                </div>

            </div>
        </div>
    );
};
