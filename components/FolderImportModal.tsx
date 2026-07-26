import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DokkanPatchState } from '../types';
import {
  scanCardFolders,
  loadCardAssets,
  readCardSql,
  CardFolderMeta,
  CardAsset,
} from '../services/folderImportService';
import { parseSqlPatch } from '../services/sqlParser';
import { useToast } from '../context/ToastContext';
import { logAnalyticsEvent } from '../services/analyticsService';

interface FolderImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (state: DokkanPatchState) => void;
}

type ViewState = 'prompt' | 'scanning' | 'browse' | 'detail';

const BADGE_COLORS: Record<string, string> = {
  Card: 'bg-blue-600',
  EZA: 'bg-yellow-600',
  SEZA: 'bg-orange-600',
  LR: 'bg-purple-600',
  F2P: 'bg-green-600',
};

export const FolderImportModal: React.FC<FolderImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const { addToast } = useToast();
  const [view, setView] = useState<ViewState>('prompt');
  const [rootName, setRootName] = useState('');
  const [cards, setCards] = useState<CardFolderMeta[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardFolderMeta | null>(null);
  const [cardAssets, setCardAssets] = useState<CardAsset | null>(null);
  const [sqlContent, setSqlContent] = useState<string | null>(null);
  const [activeCardIdIndex, setActiveCardIdIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const abortRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      abortRef.current = false;
      setView('prompt');
      setCards([]);
      setSelectedCard(null);
      setCardAssets(null);
      setSqlContent(null);
      setError(null);
      setSearchTerm('');
    } else {
      abortRef.current = true;
    }
  }, [isOpen]);

  const handleSelectFolder = useCallback(async () => {
    try {
      if (typeof window.showDirectoryPicker !== 'function') {
        setError(
          'Your browser does not support folder selection. Please use Chrome or Edge.'
        );
        return;
      }

      setError(null);
      setView('scanning');
      setIsLoading(true);
      abortRef.current = false;

      const handle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'documents',
      });

      if (abortRef.current) return;

      setRootName(handle.name);

      const foundCards = await scanCardFolders(handle);

      if (abortRef.current) return;

      setCards(foundCards);
      setView('browse');
      logAnalyticsEvent('folder_import_scan', { card_count: foundCards.length });
      addToast(`Found ${foundCards.length} card${foundCards.length !== 1 ? 's' : ''}`, {
        type: 'success',
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled the picker
        setView('prompt');
        return;
      }
      console.error('Folder scan error:', err);
      setError(err instanceof Error ? err.message : 'Failed to scan folder.');
      setView('prompt');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const handleCardClick = useCallback(
    async (card: CardFolderMeta) => {
      setSelectedCard(card);
      setCardAssets(null);
      setSqlContent(null);
      setActiveCardIdIndex(0);
      setView('detail');
      setIsLoading(true);

      try {
        // Load SQL
        const sql = await readCardSql(card.handle);
        setSqlContent(sql);

        // Load assets for the first card ID
        if (card.cardIds.length > 0) {
          const assets = await loadCardAssets(card.handle, card.cardIds[0]);
          setCardAssets(assets);
        }
      } catch (err) {
        console.error('Error loading card details:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleSwitchCardVariant = useCallback(
    async (index: number) => {
      if (!selectedCard || index < 0 || index >= selectedCard.cardIds.length) return;
      setActiveCardIdIndex(index);
      setIsLoading(true);
      try {
        const assets = await loadCardAssets(selectedCard.handle, selectedCard.cardIds[index]);
        setCardAssets(assets);
      } catch (err) {
        console.error('Error loading card variant:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedCard]
  );

  const handleImport = useCallback(() => {
    if (!sqlContent) {
      addToast('No SQL found for this card.', { type: 'error' });
      return;
    }

    try {
      const parsedState = parseSqlPatch(sqlContent);
      const hasData =
        parsedState.cardForms.length > 0 ||
        parsedState.passiveSkillSets.length > 0 ||
        parsedState.leaderSkillSets.length > 0;

      if (!hasData) {
        throw new Error('No valid Dokkan data found in the SQL.');
      }

      logAnalyticsEvent('folder_import_card', {
        card_name: selectedCard?.displayName,
        card_count: parsedState.cardForms.length,
      });

      onImport(parsedState);
      addToast(
        `Imported "${selectedCard?.displayName}" — ${parsedState.cardForms.length} card form${parsedState.cardForms.length !== 1 ? 's' : ''}.`,
        { type: 'success' }
      );
      onClose();
    } catch (err) {
      console.error('SQL parse error:', err);
      addToast(
        `Failed to parse SQL: ${err instanceof Error ? err.message : 'Unknown error'}`,
        { type: 'error' }
      );
    }
  }, [sqlContent, selectedCard, onImport, onClose, addToast]);

  const handleBackToBrowse = () => {
    setSelectedCard(null);
    setCardAssets(null);
    setSqlContent(null);
    setView('browse');
  };

  const filteredCards = searchTerm
    ? cards.filter(
        (c) =>
          c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
          c.path.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : cards;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm font-rajdhani modal-backdrop">
      <div className="modal-card p-6 w-full max-w-6xl max-h-[92vh] flex flex-col rounded-xl shadow-2xl modal-content">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-2xl font-bold modal-title section-title pb-1">
            {view === 'detail'
              ? selectedCard?.displayName || 'Card Detail'
              : 'Import Card from Folder'}
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--clr-text-muted)] hover:text-[var(--clr-accent)] text-2xl"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* ── PROMPT VIEW ── */}
        {view === 'prompt' && (
          <div className="flex-grow flex flex-col items-center justify-center text-center gap-6">
            <i
              className="fas fa-folder-open text-6xl text-[var(--clr-accent)] opacity-50"
            ></i>
            <div>
              <p className="text-xl text-[var(--clr-text-accent)] mb-2">
                Select your custom cards folder
              </p>
              <p className="text-sm text-[var(--clr-text-muted)] max-w-md">
                Choose the root folder containing your Dokkan custom cards. The app
                will scan all subfolders for card patches with SQL and assets.
              </p>
            </div>
            <button
              onClick={handleSelectFolder}
              className="btn-primary py-3 px-8 text-lg rounded-lg flex items-center gap-2"
            >
              <i className="fas fa-folder-plus"></i> Select Folder
            </button>
            {error && (
              <p className="text-[var(--clr-danger)] text-sm p-3 bg-red-900 bg-opacity-50 rounded max-w-md">
                {error}
              </p>
            )}
          </div>
        )}

        {/* ── SCANNING VIEW ── */}
        {view === 'scanning' && (
          <div className="flex-grow flex flex-col items-center justify-center gap-4">
            <i className="fas fa-spinner fa-spin text-4xl text-[var(--clr-accent)]"></i>
            <p className="text-lg text-[var(--clr-text-accent)]">
              Scanning "{rootName}" for cards...
            </p>
          </div>
        )}

        {/* ── BROWSE VIEW ── */}
        {view === 'browse' && (
          <>
            {/* Search + stats */}
            <div className="flex items-center gap-4 mb-4 flex-shrink-0">
              <div className="relative flex-1 max-w-sm">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--clr-text-muted)] text-sm"></i>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search cards..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg bg-[var(--clr-bg-card)] border border-[var(--clr-border)] text-[var(--clr-text-accent)] text-sm focus:border-[var(--clr-accent)] outline-none"
                />
              </div>
              <span className="text-sm text-[var(--clr-text-muted)] whitespace-nowrap">
                {filteredCards.length} of {cards.length} cards
              </span>
              <button
                onClick={handleSelectFolder}
                className="btn-secondary py-1.5 px-3 text-sm rounded-lg whitespace-nowrap"
              >
                <i className="fas fa-folder mr-1"></i> Change Folder
              </button>
            </div>

            {/* Card grid */}
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
              {filteredCards.length === 0 ? (
                <p className="text-center text-[var(--clr-text-muted)] italic mt-8">
                  {searchTerm ? 'No cards match your search.' : 'No cards found in this folder.'}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredCards.map((card) => (
                    <div
                      key={card.path}
                      onClick={() => handleCardClick(card)}
                      className="bg-[var(--clr-bg-card)] rounded-xl overflow-hidden cursor-pointer border border-[var(--clr-border)] hover:border-[var(--clr-accent)] hover:shadow-lg hover:shadow-[var(--clr-accent)]/10 transition-all group"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-[4/3] bg-[var(--clr-bg-main)] flex items-center justify-center overflow-hidden">
                        {card.thumbnailUrl ? (
                          <img
                            src={card.thumbnailUrl}
                            alt={card.displayName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <i className="fas fa-image text-3xl text-[var(--clr-text-muted)] opacity-30"></i>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <p className="text-sm font-semibold text-[var(--clr-text-accent)] truncate leading-tight">
                          {card.displayName}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {card.patchTypes.slice(0, 2).map((pt) => (
                            <span
                              key={pt}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold text-white ${BADGE_COLORS[pt] || 'bg-gray-600'}`}
                            >
                              {pt}
                            </span>
                          ))}
                          {card.cardIds.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--clr-text-muted)] bg-[var(--clr-bg-main)]">
                              {card.cardIds.length} form{card.cardIds.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── DETAIL VIEW ── */}
        {view === 'detail' && selectedCard && (
          <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
            {/* Left column: Card Preview */}
            <div className="lg:w-[420px] flex-shrink-0 flex flex-col gap-4">
              {/* Card art preview */}
              <div className="aspect-[4/3] bg-[var(--clr-bg-main)] rounded-xl overflow-hidden relative border border-[var(--clr-border)] flex items-center justify-center">
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin text-2xl text-[var(--clr-accent)]"></i>
                ) : cardAssets ? (
                  <div className="relative w-full h-full">
                    {/* Background layer */}
                    {cardAssets.bgUrl && (
                      <img
                        src={cardAssets.bgUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    {/* Character layer */}
                    {cardAssets.characterUrl && (
                      <img
                        src={cardAssets.characterUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    )}
                    {/* Effect layer */}
                    {cardAssets.effectUrl && (
                      <img
                        src={cardAssets.effectUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-70"
                      />
                    )}
                    {/* Circle frame */}
                    {cardAssets.circleUrl && (
                      <img
                        src={cardAssets.circleUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    )}
                    {/* No assets fallback */}
                    {!cardAssets.bgUrl && !cardAssets.characterUrl && (
                      <div className="flex items-center justify-center w-full h-full">
                        {cardAssets.thumbUrl ? (
                          <img
                            src={cardAssets.thumbUrl}
                            alt={selectedCard.displayName}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : selectedCard.thumbnailUrl ? (
                          <img
                            src={selectedCard.thumbnailUrl}
                            alt={selectedCard.displayName}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <i className="fas fa-image text-5xl text-[var(--clr-text-muted)] opacity-30"></i>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <i className="fas fa-image text-5xl text-[var(--clr-text-muted)] opacity-30"></i>
                )}
              </div>

              {/* Card ID variant switcher */}
              {selectedCard.cardIds.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedCard.cardIds.map((id, idx) => (
                    <button
                      key={id}
                      onClick={() => handleSwitchCardVariant(idx)}
                      className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                        idx === activeCardIdIndex
                          ? 'bg-[var(--clr-accent)] text-white'
                          : 'bg-[var(--clr-bg-card)] text-[var(--clr-text-muted)] hover:bg-[var(--clr-bg-main)] border border-[var(--clr-border)]'
                      }`}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              )}

              {/* Card info */}
              <div className="bg-[var(--clr-bg-card)] rounded-xl p-4 border border-[var(--clr-border)]">
                <p className="text-lg font-bold text-[var(--clr-text-accent)]">
                  {selectedCard.displayName}
                </p>
                {selectedCard.description && (
                  <p className="text-sm text-[var(--clr-text-muted)] mt-1">
                    {selectedCard.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedCard.patchTypes.map((pt) => (
                    <span
                      key={pt}
                      className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${BADGE_COLORS[pt] || 'bg-gray-600'}`}
                    >
                      {pt}
                    </span>
                  ))}
                  {selectedCard.tags.slice(0, 6).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-xs bg-[var(--clr-bg-main)] text-[var(--clr-text-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {selectedCard.authors.length > 0 && (
                  <p className="text-xs text-[var(--clr-text-muted)] mt-2">
                    By {selectedCard.authors.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Right column: SQL + import */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <h4 className="text-sm font-semibold text-[var(--clr-text-muted)] uppercase tracking-wider">
                  SQL Preview
                </h4>
                <span className="text-xs text-[var(--clr-text-muted)] font-mono">
                  {sqlContent ? `${sqlContent.split('\n').length} lines` : ''}
                </span>
              </div>

              <div className="flex-1 bg-[#0d1117] rounded-xl border border-[var(--clr-border)] overflow-y-auto custom-scrollbar min-h-[200px]">
                {sqlContent ? (
                  <pre className="p-4 text-xs font-mono text-[#c9d1d9] whitespace-pre-wrap break-all">
                    {sqlContent}
                  </pre>
                ) : isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <i className="fas fa-spinner fa-spin text-[var(--clr-accent)]"></i>
                  </div>
                ) : (
                  <p className="p-4 text-sm text-[var(--clr-text-muted)] italic">
                    No SQL file found in this card folder.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 flex-shrink-0">
                <button
                  onClick={handleBackToBrowse}
                  className="btn-secondary py-2 px-4 rounded-lg text-sm"
                >
                  <i className="fas fa-arrow-left mr-1"></i> Back to Cards
                </button>
                <button
                  onClick={handleImport}
                  disabled={!sqlContent || isLoading}
                  className="btn-primary py-2 px-6 rounded-lg text-sm flex items-center gap-2"
                >
                  <i className="fas fa-download"></i> Import Card
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
