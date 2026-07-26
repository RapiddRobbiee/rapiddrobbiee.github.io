# Dokkan Legacy Card SQL Studio

This is a standalone app in its own folder and does not change the original project code.

## Why this version is different

The app now mirrors the original project architecture:

- Card creation builds a linked bundle (card, character, unique info, passive/leader/special/active/standby sets, and junction rows)
- SQL generation uses the same style as the original project:
  - `INSERT OR REPLACE`
  - table-specific column order
  - default/null handling by column and table
  - category relation row generation from `category_ids`
  - 7-link-skill expansion (`link_skill1_id` through `link_skill7_id`)

## Run

Open `index.html` in a browser.

## Core files

- `dokkanModel.js`: card bundle construction and patch state shape
- `sqlGenerator.js`: legacy-aware SQL generation logic
- `app.js`: UI bindings and state synchronization
