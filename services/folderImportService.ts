/**
 * Folder Import Service
 *
 * Scans a local directory for Dokkan card patches using the File System Access API.
 * Each card is expected to be in a subfolder containing:
 *   - thumbnail.png
 *   - metadata.json (optional)
 *   - files/diff.sql (the SQL patch)
 *   - files/character/card/<cardId>/ (card assets)
 *   - files/character/thumb/ (thumbnail assets)
 */

export interface CardFolderMeta {
  /** The directory handle for the card folder */
  handle: FileSystemDirectoryHandle;
  /** Folder name */
  name: string;
  /** Full relative path from the root */
  path: string;
  /** Card display name from metadata.json (or folder name) */
  displayName: string;
  /** Description from metadata.json */
  description: string;
  /** UUID from metadata.json */
  uuid: string;
  /** Patch tags from metadata.json */
  tags: string[];
  /** Patch types (Card, EZA, etc.) */
  patchTypes: string[];
  /** Authors */
  authors: string[];
  /** Thumbnail blob URL */
  thumbnailUrl: string | null;
  /** Thumbnail file handle for later use */
  thumbnailHandle: FileSystemFileHandle | null;
  /** Card IDs found in the character/card/ subdirectory */
  cardIds: string[];
}

export interface CardAsset {
  cardId: string;
  /** URL for the full card sprite sheet */
  spriteUrl: string | null;
  /** URL for the background art */
  bgUrl: string | null;
  /** URL for the character art */
  characterUrl: string | null;
  /** URL for the circle frame */
  circleUrl: string | null;
  /** URL for the cut-in art */
  cutinUrl: string | null;
  /** URL for the effect overlay */
  effectUrl: string | null;
  /** URL for the card piece */
  pieceUrl: string | null;
  /** URL for the special cut-in */
  spCutinUrl: string | null;
  /** URL for the thumb */
  thumbUrl: string | null;
}

// Helper: read a file from a directory handle and return a blob URL
const fileToBlobUrl = async (
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<string | null> => {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
};

// Helper: read a JSON file from a directory handle
const readJsonFile = async <T = unknown>(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<T | null> => {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

// Helper: read a text file from a directory handle
const readTextFile = async (
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<string | null> => {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
};

// Helper: list subdirectories of a directory handle
const getSubdirectories = async (
  dirHandle: FileSystemDirectoryHandle
): Promise<{ name: string; handle: FileSystemDirectoryHandle }[]> => {
  const dirs: { name: string; handle: FileSystemDirectoryHandle }[] = [];
  try {
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'directory') {
        dirs.push({ name, handle: handle as FileSystemDirectoryHandle });
      }
    }
  } catch {
    // Ignore errors reading entries
  }
  return dirs;
};

/**
 * Scan the root directory for all card folders.
 * A card folder is one that contains a "files" subdirectory and/or a "thumbnail.png".
 */
export const scanCardFolders = async (
  rootHandle: FileSystemDirectoryHandle
): Promise<CardFolderMeta[]> => {
  const cards: CardFolderMeta[] = [];
  const pending: { handle: FileSystemDirectoryHandle; path: string }[] = [
    { handle: rootHandle, path: '' },
  ];

  while (pending.length > 0) {
    const current = pending.shift()!;
    const subdirs = await getSubdirectories(current.handle);

    for (const dir of subdirs) {
      const fullPath = current.path ? `${current.path}/${dir.name}` : dir.name;

      // Check if this directory looks like a card folder
      const hasFiles = await hasEntry(dir.handle, 'files', 'directory');
      const hasThumb = await hasEntry(dir.handle, 'thumbnail.png', 'file');

      // Skip known non-card directories
      const skipNames = [
        '0.templates', 'templates',
        '7.tools', 'tools',
        '8.old', 'old',
        '9.plans', 'plans',
        'websitebackupmay2025',
        'hdintroinv2',
      ];
      const dirNameLower = dir.name.toLowerCase();

      if (hasFiles || hasThumb) {
        // Looks like a card folder — extract metadata
        const meta = await readJsonFile<Record<string, unknown>>(dir.handle, 'metadata.json');
        const thumbHandle = await getFileHandleSafe(dir.handle, 'thumbnail.png');

        const thumbnailUrl = thumbHandle
          ? URL.createObjectURL(await thumbHandle.getFile())
          : null;

        // Find card IDs from files/character/card/
        const cardIds: string[] = [];
        try {
          const filesHandle = await dir.handle.getDirectoryHandle('files');
          try {
            const charHandle = await filesHandle.getDirectoryHandle('character');
            try {
              const cardHandle = await charHandle.getDirectoryHandle('card');
              for await (const [name, h] of cardHandle.entries()) {
                if (h.kind === 'directory' && /^\d+$/.test(name)) {
                  cardIds.push(name);
                }
              }
            } catch { /* no card dir */ }
          } catch { /* no character dir */ }
        } catch { /* no files dir */ }

        cards.push({
          handle: dir.handle,
          name: dir.name,
          path: fullPath,
          displayName: (meta?.Name as string) || dir.name,
          description: (meta?.Description as string) || '',
          uuid: meta?.UUID != null ? String(meta.UUID) : '',
          tags: Array.isArray(meta?.['Patch Tags']) ? (meta?.['Patch Tags'] as string[]) : [],
          patchTypes: Array.isArray(meta?.['Patch Types']) ? (meta?.['Patch Types'] as string[]) : [],
          authors: Array.isArray(meta?.Authors) ? (meta.Authors as string[]) : [],
          thumbnailUrl,
          thumbnailHandle: thumbHandle,
          cardIds,
        });
      } else if (!skipNames.some((skip) => dirNameLower.includes(skip.toLowerCase()))) {
        // Not a card folder and not a known skip folder — recurse deeper
        pending.push({ handle: dir.handle, path: fullPath });
      }
    }
  }

  return cards;
};

/**
 * Load all card asset URLs for a given card folder and card ID.
 */
export const loadCardAssets = async (
  cardHandle: FileSystemDirectoryHandle,
  cardId: string
): Promise<CardAsset> => {
  const assets: CardAsset = {
    cardId,
    spriteUrl: null,
    bgUrl: null,
    characterUrl: null,
    circleUrl: null,
    cutinUrl: null,
    effectUrl: null,
    pieceUrl: null,
    spCutinUrl: null,
    thumbUrl: null,
  };

  try {
    const filesHandle = await cardHandle.getDirectoryHandle('files');
    try {
      const charHandle = await filesHandle.getDirectoryHandle('character');

      // Card assets in character/card/<cardId>/
      try {
        const cardDir = await charHandle.getDirectoryHandle('card');
        try {
          const idDir = await cardDir.getDirectoryHandle(cardId);
          assets.spriteUrl = await fileToBlobUrl(idDir, `${cardId}.png`);
          assets.bgUrl = await fileToBlobUrl(idDir, `card_${cardId}_bg.png`);
          assets.characterUrl = await fileToBlobUrl(idDir, `card_${cardId}_character.png`);
          assets.circleUrl = await fileToBlobUrl(idDir, `card_${cardId}_circle.png`);
          assets.cutinUrl = await fileToBlobUrl(idDir, `card_${cardId}_cutin.png`);
          assets.effectUrl = await fileToBlobUrl(idDir, `card_${cardId}_effect.png`);
          assets.pieceUrl = await fileToBlobUrl(idDir, `card_${cardId}_piece.png`);
          assets.spCutinUrl = await fileToBlobUrl(idDir, `card_${cardId}sp_cutin_1.png`);
        } catch { /* no specific card dir */ }
      } catch { /* no card dir */ }

      // Thumbnail in character/thumb/
      try {
        const thumbDir = await charHandle.getDirectoryHandle('thumb');
        assets.thumbUrl = await fileToBlobUrl(thumbDir, `card_${cardId}_thumb.png`);
      } catch { /* no thumb dir */ }
    } catch { /* no character dir */ }
  } catch { /* no files dir */ }

  return assets;
};

/**
 * Read the diff.sql file from a card folder.
 */
export const readCardSql = async (
  cardHandle: FileSystemDirectoryHandle
): Promise<string | null> => {
  try {
    const filesHandle = await cardHandle.getDirectoryHandle('files');
    return await readTextFile(filesHandle, 'diff.sql');
  } catch {
    return null;
  }
};

// ── Internal helpers ──

const hasEntry = async (
  dirHandle: FileSystemDirectoryHandle,
  name: string,
  kind: 'file' | 'directory'
): Promise<boolean> => {
  try {
    if (kind === 'file') {
      await dirHandle.getFileHandle(name);
    } else {
      await dirHandle.getDirectoryHandle(name);
    }
    return true;
  } catch {
    return false;
  }
};

const getFileHandleSafe = async (
  dirHandle: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemFileHandle | null> => {
  try {
    return await dirHandle.getFileHandle(name);
  } catch {
    return null;
  }
};
