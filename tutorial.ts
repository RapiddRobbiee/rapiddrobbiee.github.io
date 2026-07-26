export interface TutorialStep {
  title: string;
  icon: string;
  description: string;
  tips?: string[];
  visual?: string;
}

export const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to Dokkan Patch Maker',
    icon: 'fa-dragon',
    description:
      'Dokkan Patch Maker is a comprehensive tool for creating, editing, and exporting custom patches for Dokkan Battle. With an intuitive interface, you can load character data from a local database, modify every aspect of cards and skills, plan new units, and generate ready-to-use SQL for your patches.',
    tips: [
      'This tool is mostly designed for experienced Dokkan modders who understand the database structure/general workflow but anyone can use it. ',
      'All changes are made locally — nothing is sent to any server until you choose to save to the cloud.',
      'You can switch between themes in Settings to customize your visual experience.',
      
    ],
  },
  {
    title: 'Step 1: Load Your Database',
    icon: 'fa-database',
    description:
      'Before you can do anything, you need to load a local .db file (SQLite database) containing the Dokkan Battle card data. Click the "Select .db" button in the top bar and choose your database file — typically named something like "database.db" or "cards.db".',
    tips: [
      'The database must be a valid SQLite file with the Dokkan Battle schema.',
      'Once loaded, the button changes to "DB Loaded" indicating success.',
      'If an error occurs, a red error message will appear below the button.',
      'Loading a large database may take a moment — wait for the spinner to finish.',
    ],
    visual: '📂 .db → 🔍 Analyzed → ✅ Ready',
  },
  {
    title: 'Step 2: Understanding the Workspace Layout',
    icon: 'fa-th-large',
    description:
      'The app has three layout modes accessible via Settings. The default "Dock" layout shows a sidebar on the left (or on top on mobile) with tabs representing each section of your patch workflow. The main area displays the currently active tab\'s content.',
    tips: [
      'Sub-tabs (accessible via user dropdown) provide additional tools like the SQL Converter.',
      'The "Unsaved" / "Active: S1" badge in the header shows your current save slot.',
    ],
    visual: '🧭 Sidebar → Tab Selection → Content Panel',
  },
  {
    title: 'Step 3: Loading a Character',
    icon: 'fa-user-plus',
    description:
      'Click "Load from DB" in the top bar to open the character search modal. Here you can browse and filter the entire database — search by character name, filter by element, rarity, category, or link skill. Select a character and choose either to import the card directly or create a new EZA version with all new IDs.',
    tips: [
      'The "Load from DB" button is only active after a database is loaded.',
      'Use the search bar and filters to quickly find specific characters.',
      'Elements include Super/Extreme variants for precise filtering.',
      'Importing creates a new card in your patch workspace with copies of all related data.',
      '"Create EZA" generates fresh IDs throughout, perfect for making extreme Z-awakenings.',
      'For characters with transformations, exchanges, or tag mechanics, all related cards are imported.',
    ],
    visual: '🔍 Search → 🎯 Select → 📥 Import → ✏️ Edit',
  },
  {
    title: 'Step 4: The Dashboard',
    icon: 'fa-tachometer-alt',
    description:
      'The Dashboard is your central overview. It shows all loaded cards at a glance with their IDs, names, rarities, and elements. You can rearrange cards, remove unwanted ones, or click any card to jump to its detailed editor. The dashboard also shows a summary of your current patch progress.',
    tips: [
      'Cards with IDs ending in 0 and 1 are visually grouped as Alpha/Beta pairs.',
      'Each card shows its current editing status — modified cards are highlighted.',
      'Click a card to open its full editor in the Patch Workspace.',
      'Use the duplicate button to quickly create variants of existing cards.',
      'Removing a card also cleans up all its associated data.',
    ],
  },
  {
    title: 'Step 5: Editing Card Details',
    icon: 'fa-id-card',
    description:
      'Select a card from the Dashboard to open the Card Form Editor. Here you can modify every aspect of a card: base stats (HP, ATK, DEF), leader skill, passive skill, super attacks, active skills, link skills, categories, and awakening paths. Changes are tracked in real-time and reflected in the patch state.',
    tips: [
      'Categories and link skills use searchable dropdowns for easy selection.',
      'Synchronized Card 0/1 editing copies changes between paired cards when enabled in Settings.',
      'Use "Import Skills from DB" to pull individual skills from other characters in the database.',
    ],
    visual: '📊 Stats → 🔧 Skills → 🏷️ Categories → ✅ Ready',
  },
  {
    title: 'Step 6: Global Skill Sets',
    icon: 'fa-layer-group',
    description:
      'The Global Skill Sets tab manages shared skill data across all cards in your patch. This includes shared passive skill effects, leader skill effects, link skill configurations, and special attack effect packs. Changes here affect any card referencing these global sets.',
    tips: [
      'Skill sets can be imported from existing database characters using the Import button.',
      'You can choose to append effects to existing sets or fully replace them.',
      'The Causality Editor (beta) provides a visual tree-based interface for complex skill conditions.',
      'Reference IDs allow reusing complex condition chains across multiple skills.',
      'Changes to global sets automatically propagate to all referencing cards.',
    ],
    visual: '🌐 Global Sets → 🔗 Referenced by Cards → 🔄 Auto-Sync',
  },
  {
    title: 'Step 7: Standby & Finish Skills',
    icon: 'fa-hourglass-half',
    description:
      'Still in beta.',
    tips: [
      'Still in beta',
    ],
  },
  {
    title: 'Step 8: EZA (Extreme Z-Awakening) Editor',
    icon: 'fa-arrow-up',
    description:
      'The EZA tab lets you configure Extreme Z-Awakening data for selected cards. Set the awakening growth row ID, configure stat boosts, leader skill upgrades, passive skill enhancements, and super attack level increases. EZAs are linked to their base card via the Optimal Awakening Growth (OAG) system.',
    tips: [
      'EZA data is automatically linked to the base card ID in the OAG table.',
      '"Create EZA from this Character" duplicates all card data with fresh IDs.',
      'The EZA editor auto-syncs the OAG row ID when the base card ID changes.',
      'Make sure passive and leader skill IDs are included in OAG reference lines.',
    ],
    visual: '📈 Base Card → 🔼 EZA Boost → 🏆 Upgraded Card',
  },
  {
    title: 'Step 9: Miscellaneous Tables',
    icon: 'fa-table',
    description:
      'The Misc Tables editor provides direct access to auxiliary database tables: passive skill effects, effect packs, character unique abilities, card unique abilities, special attack effects, ultimate specials, special views, subtarget types, and more.',
    tips: [
      'Tables are organized into logical sections for easier navigation.',
      'Each table entry shows its ID and key fields with inline editing.',
      'Changes here are included in the final SQL output just like card edits.',
      'The subtarget type sets editor handles targeting behavior for skills.',
    ],
    visual: '🔢 SQL Tables → ✏️ Direct Edit → 🗃️ Included in Output',
  },
  {
    title: 'Step 10: The Card Planner',
    icon: 'fa-clipboard-list',
    description:
      'The Card Planner is a dedicated space for designing new cards before adding them to your patch. Create multiple planner slots, name them, and design complete card concepts with stats, skills, and abilities. Planner slots can be added, deleted, renamed (double-click), and reordered with drag-and-drop animations.',
    tips: [
      'Planner slots are independent from the main patch workspace — plan freely without affecting your patch.',
      'Double-click a slot name to rename it (e.g., "LR Goku Concept").',
      'Characters can be loaded from the database directly into a planner slot.',
      'Planner data is saved to localStorage and persists between sessions.',
      'Save individual slots to keep your concepts organized and revisit them later.',
      'Use the planner to design EZAs, new TURs, or completely original cards.',
    ],
    visual: '📝 Plan → 🎨 Design → 📤 Add to Patch',
  },
  {
    title: 'Step 11: Generating SQL Output',
    icon: 'fa-file-code',
    description:
      'Once your patch is complete, navigate to the SQL Output tab and click "Generate SQL Patch" (in the sidebar). This produces a complete SQL patch file containing all INSERT and UPDATE statements for every modified table. The output is ready to be applied to your private server\'s database.',
    tips: [
      'All IDs are validated and cleaned before generation to ensure compatibility.',
      'Warning comments are included for any potential issues (missing column definitions, etc.).',
      'You can copy the entire SQL output to clipboard or download it directly.',
      'Test your SQL on a backup database before deploying to a live server.',
      'The Auto-Generate SQL setting in Settings generates SQL automatically when switching tabs.',
    ],
    visual: '📄 Generate → 🔍 Validate → 📋 Copy/Download → 🚀 Deploy',
  },
  {
    title: 'Step 12: Saving & Loading Your Work',
    icon: 'fa-cloud-upload-alt',
    description:
      'Your patch progress can be saved to cloud slots for backup and sharing. Up to 4 save slots are available. Additionally, auto-save to localStorage runs every 30 seconds and on page close, with automatic restoration on your next visit. JSON export/import provides local backup options.',
    tips: [
      'Cloud saves are linked to your account.',
      'Each save slot has a timestamp and custom name for easy identification.',
      'Auto-save indicator at the bottom of the sidebar shows last save time.',
      'Export to JSON for offline backups or sharing patches with other users.',
      'Import from JSON to restore a previously exported patch.',
      'Local auto-save is automatic — no action needed.',
    ],
    visual: '💾 Auto-Save (30s) → ☁️ Cloud Slots → 📤 JSON Export',
  },
  {
    title: 'Step 13: Importing from Other Sources',
    icon: 'fa-file-import',
    description:
      'Beyond loading from the database, you can import data from other sources. The "Import SQL" feature (enable in Settings → Beta Features) lets you import existing SQL patch files and reconstruct the patch state — perfect for continuing work on old patches. "Import from Folder" lets you load card data from a structured folder with assets.',
    tips: [
      'Reverse SQL Import reconstructs the full patch state from a SQL file.',
      'Folder import expects a specific folder structure with card JSON and asset files.',
      'Importing from JSON restores a previously exported patch state exactly.',
      'Skills can be imported from any character in the database, not just your loaded cards.',
    ],
  },
  {
    title: 'Step 14: Settings & Customization',
    icon: 'fa-sliders-h',
    description:
      'The Settings modal (gear icon in the top bar) lets you customize the app. Choose from multiple themes (Modern, Eclipse, Classic, Shenron, Buu, Vegeta, Super Saiyan, Frieza, Cell, Zamasu, Black Frieza, Cosmic Rift, Dragon Radar, Destroyer, Crimson, Maple), toggle beta features, enable auto-save, and configure workspace preferences.',
    tips: [
      'Theme changes apply instantly and are persisted across sessions.',
      'Beta features include: Standby/Finish Skills editor, Visual Causality Editor, Reverse SQL Import.',
      'The "Sync Card 0/1 Edits" option automatically mirrors changes between paired cards.',
      'Auto-Generate SQL saves time by running generation on every tab switch.',
      'Settings are saved to localStorage and restored on your next visit.',
    ],
    visual: '🎨 16 Themes → ⚙️ Preferences → 🔧 Beta Features',
  },
  {
    title: 'Tips & Best Practices',
    icon: 'fa-lightbulb',
    description:
      'Here are some expert recommendations for getting the most out of Dokkan Patch Maker:',
    tips: [
      'Always test your SQL output on a backup/offline database before deploying to a live server.',
      'Keep your local .db file updated with the latest game data for accurate imports.',
      'Use descriptive save slot names to track different patch versions or experiments.',
      'The Card Planner is great for prototyping — design there first, then add to your patch.',
      'When making EZAs, use the "Create EZA" import option to automatically generate fresh IDs.',
      'For characters with transformations, import the base form first — related cards are loaded automatically.',
      'The Visual Causality Editor (beta) makes complex skill conditions much easier to build and understand.',
      'If SQL generation produces warnings, address them before deploying — they may indicate missing data.',
      'Export your patch to JSON regularly as an additional backup layer.',
      'Report bugs via the Report button in the sidebar — this helps improve the tool for everyone.',
      'When importing skills from other characters, use "Append" mode to add effects without losing existing ones.',
    ],
    visual: '💡 Expert Tips → 🚀 Better Patches → 😎 Happy Modding',
  },
];
