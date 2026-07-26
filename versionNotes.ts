export interface VersionNoteEntry {
  version: string;
  date: string;
  notes: string[]; // Array of strings, each string is a bullet point
}

export const versionNotes: VersionNoteEntry[] = [
  {
    version: 'v0.4.0',
    date: '2026-07-26',
    notes: [
      'Dramatically improved the "Create EZA from this Character" feature. It now properly loads units with more than 1 character (Tags, Exchange etc).',
      'Auto-Save: Patch state is now automatically saved to localStorage every 30 seconds and on page close. Automatically restored on your next visit with a notification toast. A save status indicator is shown at the bottom of the sidebar.',
      'Alpha/Beta Card Pairing: Cards with IDs ending in 0 and 1 are now automatically grouped together in the Patch Workspace with a visual "Card 0 + Card 1" badge.',
      'Sync Card 0/1 Edits Setting: When enabled, editing a card whose ID ends in 0 or 1 automatically copies changes to its paired counterpart.',
      'Card Planner is in the process of getting a overhaul, bugs are expected.',
      'Enhanced View Transitions.',
      'Enhanced Toast Notifications.',
      'Skill-Level Import from Database: Import individual skills or full skill sets directly into your existing sets with replace/append options.',
      'Advanced Database Search: Character search now supports filters for element (including super/extreme variants), rarity, base vs transformed forms, categories, and link skills.',
      'User Profile Dropdown: Signed-in users now see a profile dropdown in the header with their photo, display name, and sign-out button.',
      'Settings Persistence: All app settings are now saved to localStorage and restored on your next visit.',
      'Planner-Only Character Loading: Characters can now be loaded from the database directly into a Card Planner slot, separate from the patch workspace.',
      'EZA Auto-Sync: The EZA editor now automatically syncs the Optimal Awakening Growth row ID when the base card ID changes.',
      'Card Planner Slot Management: Planner slots can now be added, deleted, renamed (double-click), and reordered with animated transitions.',
      'Visual Polish.',
    ],
  },

  {
    version: 'v0.3.0b',
    date: '2026-07-23',
    notes: [
      'Added beta build at /beta.',
   


    ],
  },
  {
    version: 'v0.2.4',
    date: '2026-01-18',
    notes: [
      'Removed the is_usm column from the effect_packs misc table editor.',
      'Moved the Standby & Finish Skills tab to the beta settings.',


    ],
  },
  {
    version: 'v0.2.3',
    date: '2025-12-17',
    notes: [
      'Organized Misc Tables Editor into sections.',
      'Added support for character and card uniques in the misc table editor.',
      'Added 2 more Save Slots for a total of 4 Save Slots in the Save Load Modal.',
      'Added support for naming save slots in the Save Load Modal.',
    ],
  },
  {
    version: 'v0.2.2',
    date: '2025-11-29',
    notes: [
      'Added support for is_usm in the effect_packs misc table editor.',
    ],
  },
  {
    version: 'v0.2.1',
    date: '2025-11-25',
    notes: [
      'Added support for ultimate_specials and special_views in the misc table editor.',
      'Local ID Generator: Added saving of local ID ranges to localStorage.',
      'Fixed a skill_causality bug where sql generation was generating everything in local storage.',
    ],
  },
  {
    version: 'v0.2.0',
    date: '2025-11-24',
    notes: [
      'Added support for subtarget types and subtarget type sets in the misc table editor.',
    ],
  },
  {
    version: 'v0.1.95',
    date: '2025-11-22',
    notes: [
      'Slight UI Adjustments',
      'Visual Causality Editor (Beta): Adjusted how the editor handles inline conditions. Now to confirm a condition, the user must click the confirm button which will make the condition a reference ID.',
      'Visual Causality Editor (Beta): Extended support for the visual causality editor to Card Form Special Attacks, Standby/Finish Skill Sets, and Active Skill Sets.',
      'Changed the starting ID range for Causality Conditions to 10,000 for cleaner ID generation.',
    ],
  },
  {
    version: 'v0.1.91',
    date: '2025-11-22',
    notes: [
      'Fixed an incorrect Version Notes entry.',
    ],
  },
  {
    version: 'v0.1.9',
    date: '2025-11-22',
    notes: [
      'Reverse SQL Import (Beta): Added a new experimental feature to import SQL patch files and reconstruct the patch state in the editor.',
    ],
  },
  {
    version: 'v0.1.86',
    date: '2025-11-21',
    notes: [
      'Updated News Banner System: Added support for banners to only show on the login screen.',
    ],
  },
  {
    version: 'v0.1.85',
    date: '2025-11-21',
    notes: [
      'Updated News Banner System: Extended support of banners to the login screen.',
      'Started working on potential rebrand of the app.',
    ],
  },
  {
    version: 'v0.1.8',
    date: '2025-11-20',
    notes: [
      'Visual Causality Editor (Beta): Added a new interactive editor for causality conditions with support for logical operators (AND/OR/NOT), inline conditions, and reference IDs.',
      'Beta Features Toggle: The visual causality editor can be enabled in Settings → Beta Features. Defaults to the traditional text field for stability.',
      'Causality Reference System: Implemented support for creating and managing skill_causality references, allowing complex conditions to be reused across multiple skills.',
      'Patch-Based Workflow: New causalities are now created as part of the patch state with generated local IDs, ensuring proper SQL export without database conflicts.',
      'Input Stability Fixes: Resolved focus loss issues in text inputs throughout the causality editor for a smoother editing experience.',
      'News Banner System: Introduced a configurable announcement system with time-based display, multiple styles (info, warning, success, announcement, urgent), dismissible functionality, and localStorage persistence.',
    ],
  },
  {
    version: 'v0.1.71',
    date: '2025-11-20',
    notes: [
      'Fixed Import Modal Positioning: The "Import from DB" modal now appears at the top of the screen and is always visible, regardless of how long the skill editing section is.',
    ],
  },
  {
    version: 'v0.1.7',
    date: '2025-11-19',
    notes: [
      'Added JSON Import/Export: Users can now export their patch data to a local JSON file and import it back, allowing for easy backups and sharing.',
    ],
  },
  {
    version: 'v0.1.65',
    date: '2025-11-19',
    notes: [
      'Sticky Navbar Setting: Added a setting to toggle the sticky navigation bar. Defaults to disabled.',
    ],
  },
  {
    version: 'v0.1.5 & v0.1.6',
    date: '2025-11-19',
    notes: [
      'UI Modernization: Complete overhaul of the application UI, improved layout, and better visual hierarchy.',
      'Improved Inputs: Standardized input fields with better focus states, labels, and validation feedback.',
      'Responsive Design: Improved responsiveness across different screen sizes.',
      'Overall code cleanup and organization.',
    ],
  },

  {
    version: 'v0.1.45',
    date: '2025-10-20',
    notes: ["Added Missing Category 'Mission Execution' (ID: 97)"],
  },
  {
    version: 'v0.1.35',
    date: '2025-09-09',
    notes: ['Fixed Card Planner saving bug.'],
  },
  {
    version: 'v0.1.1',
    date: '2025-09-07',
    notes: [
      'Fixed a major bug where transformations were not being imported if the character transforms via an active skill. This issue has been resolved.',
      "Fixed a major inconsistency with the 'Create EZA from this Character' option. The feature now correctly duplicates all complex skills, including Standby Skills, Finish Skills, and all supporting table data, making it as thorough as a standard character import.",
    ],
  },
  {
    version: 'v0.1.0',
    date: '2025-07-03',
    notes: [
      'Added-a search bar to the top of most list drop down menus that are heavily populated, you can now search for specific items with names or IDs if applicable.',
      'Added a Card Planner section where users can plan new cards/EZAs in a seperate section with multiple slots and a save button to save their progress.',
      'Added an option when importing a card from the database to allow the user to either import the card itself or to create a new version of that card with all new IDs perfect for making a quick EZA.',
      'Fixed bugs releated to EZAs not applying.',
    ],
  },
  {
    version: 'v0.0.95',
    date: '2025-06-29',
    notes: [
      'Major visual overhaul, including a new UI, a new color scheme, and a new font.',
      'Added a new theme button at the top right of the page with serval themes to choose from.',
    ],
  },
  {
    version: 'v0.0.9',
    date: '2025-06-28',
    notes: [
      'Added SQL Converter feature where users can convert their OLD SQL Patches with the description field in the passives to the new format, leaving Itemized Passives untouched.',
      'Fixed bugs releated to importing units that have an EZA from the database. When the user imports a unit that has an EZA, a new window will prompt the user to ask if they want to import the EZA version or the Pre EZA version of that card.',
    ],
  },
  {
    version: 'v0.0.8',
    date: '2025-05-28',
    notes: [
      'Added Import From DB feature where users can import specific skills and sets from others cards in the database. Users can also choose to fully replace skill sets and their effects or simply append the effects to their existing sets.',
      'Added Duplicate feature where users can duplicate Skills/Sets/Cards.',
      'Reworked and fully implemented Report Bug feature.',
      'Fixed bugs related to not null entries.',
    ],
  },
  {
    version: 'v0.0.7',
    date: '2025-05-27',
    notes: [
      'Fixed an mistake where EZA sql generation was generating redundant lines.',
      'Fixed an issue where Passive and Leader skills ids were not being added to OAG lines.',
      'Moved Version Notes button to the side where other buttons are.',
      'Added framework for Report Bug feature.',
    ],
  },
  {
    version: 'v0.0.65',
    date: '2025-05-27',
    notes: [
      'Fixed an issue where Active Skills were not being consistently generated correctly, card_active_skills were sometimes missing from generated sql.',
    ],
  },
  {
    version: 'v0.0.6',
    date: '2025-05-25',
    notes: [
      'Added "Version Notes" feature.',
      'Fixed issue where Active Skills were not being properly generated via sql, card_active_skills table was missing.',
    ],
  },
  {
    version: 'v0.0.5',
    date: '2025-05-25',
    notes: [
      'Added automatic Passive Skill formatting, Passives should now automatically be coloured and have the up icon where applicable. (other icons still have to be manually added)',
      'Fixed an issue where OAG sql querys were being generated with a created_at and updated_at column. (they dont exist in the db)',
      'Fixed an issue where EZAs were not being correctly applied to cards. (EZA ID was not being applied to the cards table)',
    ],
  },
  {
    version: 'v0.0.4',
    date: '2025-05-24',
    notes: [
      'Added cloud saving, users can now save patches to cloud slots. (2 slots per user)',
      'Added support for Transformations. when a unit is loaded via the database, if they have a transformation (or exchange or standby/finishskills) that card should also be loaded in the card forms.',
      'Added support for standby and finish skills (should work in theory although not tested)',
      'Added Reset Form button, this will clear all current unsaved data and start fresh.',
      'Removed Load Example data button, this was used by me in early testing no reason to keep it around.',
      'Fixed card id entry so that it doesnt unfocus upon each entry',
      'Fixed sql generation so that it doesnt include incorrect id formats (upon testing, sql generation works and loads into the game assuming the patch was made correctly)',
    ],
  },
  {
    version: 'v0.0.3',
    date: '2025-05-24',
    notes: [
      'Initial early access version of Dokkan Patch Maker.',
      'Core functionality for creating Card Forms, Skills, and generating SQL implemented.',
      'Firebase authentication added.',
      'Ability to load character data from a local .db file.',
      'Basic EZA support and miscellaneous table editors (Passive Skill Effects, Effect Packs) included.',
    ],
  },
];

export const currentAppVersion = versionNotes[0].version;
