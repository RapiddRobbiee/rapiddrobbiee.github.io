// dokkan-patch-maker/__mocks__/sql.js.ts
import { vi } from 'vitest';

// console.log('Manual __mocks__/sql.js.ts mock is being used'); // For debugging

// Define mocks for the Database methods that your services/databaseService actually uses
export const mockDatabaseRun = vi.fn((sql, params) => {
  // console.log('Mock DB run:', sql, params);
  return this; // Return chainable this if original does, or void
});
export const mockDatabaseExec = vi.fn((sql, params) => {
  // console.log('Mock DB exec:', sql, params);
  return []; // Default to returning an empty array (no results)
});
export const mockDatabaseExport = vi.fn(() => new Uint8Array());
export const mockDatabaseClose = vi.fn();
export const mockDatabaseCreateFunction = vi.fn(); // If used by your databaseService

const mockDbInstance = {
  run: mockDatabaseRun,
  exec: mockDatabaseExec,
  export: mockDatabaseExport,
  close: mockDatabaseClose,
  create_function: mockDatabaseCreateFunction,
};

// This is the mock for the 'Database' class/constructor exported by sql.js
export const Database = vi.fn(() => mockDbInstance);

// This mocks the default export 'initSqlJs' from sql.js
const mockInitSqlJs = vi.fn().mockResolvedValue({
  Database: Database, // Ensure the initSqlJs result provides the mocked Database
  // Add other properties returned by actual initSqlJs if your databaseService uses them
});
export default mockInitSqlJs;
