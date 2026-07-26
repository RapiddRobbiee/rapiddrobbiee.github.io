import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../services/authService';
import * as firestoreService from '../services/firestoreService';
import { useToast } from '../context/ToastContext';

interface SlotInfo {
  updatedAt: Date | null;
  exists: boolean;
  name?: string;
  isLoading: boolean;
}

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  lastLoadedSlot: string | null;
  onSaveToSlot: (slotId: string, slotName?: string) => Promise<boolean>;
  onLoadFromSlot: (slotId: string) => Promise<boolean>;
  isSavingSlot: Record<string, boolean>; // Object to track saving state per slot
  isGlobalLoading: boolean;
  onExportJson: () => void;
  onImportJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SLOT_IDS = ['slot1', 'slot2', 'slot3', 'slot4'];

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  lastLoadedSlot,
  onSaveToSlot,
  onLoadFromSlot,
  isSavingSlot,
  isGlobalLoading,
  onExportJson,
  onImportJson,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const [slotsInfo, setSlotsInfo] = useState<Record<string, SlotInfo>>({
    slot1: { updatedAt: null, exists: false, isLoading: false },
    slot2: { updatedAt: null, exists: false, isLoading: false },
    slot3: { updatedAt: null, exists: false, isLoading: false },
    slot4: { updatedAt: null, exists: false, isLoading: false },
  });

  const [slotNames, setSlotNames] = useState<Record<string, string>>({
    slot1: 'Slot 1',
    slot2: 'Slot 2',
    slot3: 'Slot 3',
    slot4: 'Slot 4',
  });

  const [isEditingName, setIsEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlotMetadata = useCallback(async () => {
    if (!currentUser) return;
    setIsFetchingMetadata(true);
    setError(null);
    try {
      const promises = SLOT_IDS.map((id) =>
        firestoreService.getSlotMetadata(currentUser.uid, id)
      );
      const results = await Promise.all(promises);

      const newInfos: Record<string, SlotInfo> = {};
      const newNames: Record<string, string> = {};

      results.forEach((meta, index) => {
        const id = SLOT_IDS[index];
        newInfos[id] = {
          updatedAt: meta.updatedAt,
          exists: meta.exists,
          name: meta.name,
          isLoading: false,
        };
        newNames[id] = meta.name || `Slot ${index + 1}`;
      });

      setSlotsInfo(newInfos);
      setSlotNames(newNames);
    } catch (err) {
      console.error('Error fetching slot metadata:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch slot information.');
    } finally {
      setIsFetchingMetadata(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchSlotMetadata();
    }
  }, [isOpen, currentUser, fetchSlotMetadata]);

  const handleSave = async (slotId: string) => {
    setSlotsInfo((prev) => ({ ...prev, [slotId]: { ...prev[slotId], isLoading: true } }));
    setError(null);
    const success = await onSaveToSlot(slotId, slotNames[slotId]);
    if (success) {
      fetchSlotMetadata();
    }
    setSlotsInfo((prev) => ({ ...prev, [slotId]: { ...prev[slotId], isLoading: false } }));
  };

  const handleLoad = async (slotId: string) => {
    setSlotsInfo((prev) => ({ ...prev, [slotId]: { ...prev[slotId], isLoading: true } }));
    setError(null);
    await onLoadFromSlot(slotId);
    setSlotsInfo((prev) => ({ ...prev, [slotId]: { ...prev[slotId], isLoading: false } }));
  };

  const startEditingName = (slotId: string) => {
    setIsEditingName(slotId);
    setTempName(slotNames[slotId]);
  };

  const saveName = async (slotId: string) => {
    if (tempName.trim()) {
      const newName = tempName.trim();
      setSlotNames((prev) => ({ ...prev, [slotId]: newName }));

      // Persist to Firestore if user is logged in
      if (currentUser) {
        try {
          setIsEditingName(null); // Close edit mode immediately for better UX
          // Check if slot exists before trying to rename
          if (slotsInfo[slotId].exists) {
            setSlotsInfo((prev) => ({ ...prev, [slotId]: { ...prev[slotId], isLoading: true } }));
            await firestoreService.renameSlot(currentUser.uid, slotId, newName);
            await fetchSlotMetadata(); // Refresh metadata to ensure sync
          }
        } catch (error) {
          console.error("Failed to persist name:", error);
          addToast("Failed to save name to cloud. Please ensure you are connected.", { type: 'error' });
        } finally {
          setSlotsInfo((prev) => ({ ...prev, [slotId]: { ...prev[slotId], isLoading: false } }));
        }
      }
    }
    setIsEditingName(null);
  };

  const cancelEditingName = () => {
    setIsEditingName(null);
    setTempName('');
  };

  if (!isOpen) return null;

  const renderSlot = (slotId: string) => {
    const slotInfo = slotsInfo[slotId];
    const isSavingThisSlot = isSavingSlot[slotId] || false;
    const isActive = lastLoadedSlot === slotId;
    const displayName = slotNames[slotId];

    return (
      <div
        key={slotId}
        className={`p-4 rounded-lg shadow-md transition-colors ${isActive
          ? 'bg-[var(--clr-success)]/10 border-2 border-[var(--clr-success)]'
          : 'bg-[var(--clr-bg-card)] border border-[var(--clr-border)]'
          }`}
      >
        <div className="flex justify-between items-start mb-2">
          {isEditingName === slotId ? (
            <div className="flex items-center space-x-2 w-full mr-2">
              <input
                autoFocus
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName(slotId);
                  if (e.key === 'Escape') cancelEditingName();
                }}
                className="flex-1 bg-[var(--clr-bg-surface)] text-[var(--clr-text-main)] border border-[var(--clr-border)] rounded px-2 py-1 text-sm"
              />
              <button onClick={() => saveName(slotId)} className="text-[var(--clr-success)] hover:text-green-400">
                <i className="fas fa-check"></i>
              </button>
              <button onClick={cancelEditingName} className="text-[var(--clr-danger)] hover:text-red-400">
                <i className="fas fa-times"></i>
              </button>
            </div>
          ) : (
            <h4
              className={`text-xl font-semibold flex items-center ${isActive ? 'text-[var(--clr-success)]' : 'text-[var(--clr-accent)]'
                } font-rajdhani truncate`}
            >
              {displayName}
              {isActive && (
                <span className="text-xs px-2 py-0.5 bg-[var(--clr-success)] text-white rounded-md ml-2 flex-shrink-0">
                  ACTIVE
                </span>
              )}
              <button
                onClick={() => startEditingName(slotId)}
                className="ml-2 text-[var(--clr-text-muted)] hover:text-[var(--clr-accent)] text-xs"
                title="Rename Slot"
              >
                <i className="fas fa-pencil-alt"></i>
              </button>
            </h4>
          )}
        </div>

        {isFetchingMetadata ? (
          <p className="text-sm text-[var(--clr-text-muted)] italic">
            <i className="fas fa-spinner fa-spin mr-1"></i>Loading info...
          </p>
        ) : (
          <>
            <p className="text-xs text-[var(--clr-text-muted)] mb-1">
              Last Saved:{' '}
              {slotInfo.updatedAt
                ? slotInfo.updatedAt.toLocaleString()
                : slotInfo.exists
                  ? 'Unknown'
                  : 'Empty'}
            </p>
            {!slotInfo.exists && !slotInfo.updatedAt && (
              <p className="text-xs text-[var(--clr-warning)] italic mb-3">This slot is empty.</p>
            )}
          </>
        )}

        <div className="flex space-x-3 mt-3">
          <button
            onClick={() => handleSave(slotId)}
            disabled={isSavingThisSlot || isGlobalLoading || isFetchingMetadata || slotInfo.isLoading}
            className="flex-1 btn-primary py-2 px-3 text-sm flex items-center justify-center"
          >
            {isSavingThisSlot || slotInfo.isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>Save
              </>
            )}
          </button>
          <button
            onClick={() => handleLoad(slotId)}
            disabled={!slotInfo.exists || isGlobalLoading || isFetchingMetadata || slotInfo.isLoading}
            className="flex-1 btn-secondary py-2 px-3 text-sm flex items-center justify-center"
          >
            {slotInfo.isLoading && !isSavingThisSlot ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>Loading...
              </>
            ) : (
              <>
                <i className="fas fa-cloud-download-alt mr-2"></i>Load
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm font-rajdhani modal-backdrop">
      <div className="modal-card p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col modal-content">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold modal-title">Cloud Save Slots</h3>
          <button
            onClick={onClose}
            className="text-[var(--clr-text-muted)] hover:text-[var(--clr-accent)] text-2xl"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && (
          <p className="text-[var(--clr-danger)] text-sm mb-4 bg-[var(--clr-danger)]/20 p-2 rounded-md">
            {error}
          </p>
        )}

        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {SLOT_IDS.map(id => renderSlot(id))}
          </div>

          <div className="p-4 rounded-lg border-2 border-dashed border-[var(--clr-border)] bg-[var(--clr-bg-card)]/50">
            <h4 className="text-xl font-semibold mb-2 text-[var(--clr-accent)] font-rajdhani flex items-center">
              <i className="fas fa-hdd mr-2 opacity-70"></i> Local Backup
            </h4>
            <p className="text-xs text-[var(--clr-text-muted)] mb-4">
              Save your patch data to a local JSON file or restore from one.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onExportJson}
                disabled={isGlobalLoading}
                className="flex-1 btn-primary py-2.5 px-3 text-sm flex items-center justify-center font-bold shadow-md hover:shadow-lg"
              >
                <i className="fas fa-file-export mr-2"></i> Export JSON
              </button>
              <button
                onClick={handleImportClick}
                disabled={isGlobalLoading}
                className="flex-1 btn-secondary py-2.5 px-3 text-sm flex items-center justify-center shadow-sm hover:shadow-md"
              >
                <i className="fas fa-file-import mr-2"></i> Import JSON
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onImportJson}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--clr-border)] flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary py-2 px-5 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
