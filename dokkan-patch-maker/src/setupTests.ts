// In dokkan-patch-maker/src/setupTests.ts
import { vi } from 'vitest';

vi.mock('sql.js', async () => {
  // It's important that this mock is established before databaseService.ts is imported anywhere.
  console.log('Global sql.js mock applied from setupTests.ts'); // For debugging if the mock runs
  const actualSqlJs = await vi.importActual('sql.js'); // Get actual for other named exports if needed

  const mockDatabaseInstance = {
    run: vi.fn((sql, params) => {
      // console.log('Mock DB run:', sql, params);
      return mockDatabaseInstance; // Return chainable this or the instance itself
    }),
    exec: vi.fn((sql, params) => {
      // console.log('Mock DB exec:', sql, params);
      // Default to no results; specific tests will override this
      return []; 
    }),
    export: vi.fn().mockReturnValue(new Uint8Array()),
    close: vi.fn(),
    create_function: vi.fn(), // Add if used
  };
  
  return {
    ...actualSqlJs, // Spread actual to keep any other named exports
    default: vi.fn().mockResolvedValue({ // Mocks the default export initSqlJs
      Database: vi.fn(() => mockDatabaseInstance), // Mocks new SQL.Database()
    }),
  };
});

// Also ensure localStorage is mocked as it was in previous attempts, good for consistency
const localStorageMockStore: { [key: string]: string } = {};
const localStorageMock = {
    getItem: (key: string) => localStorageMockStore[key] || null,
    setItem: (key: string, value: string) => {
        localStorageMockStore[key] = value.toString();
    },
    removeItem: (key: string) => {
        delete localStorageMockStore[key];
    },
    clear: () => {
        for (const key in localStorageMockStore) {
            delete localStorageMockStore[key];
        }
    },
    get length() {
        return Object.keys(localStorageMockStore).length;
    },
    key(index: number) {
        const keys = Object.keys(localStorageMockStore);
        return keys[index] || null;
    }
};
vi.stubGlobal('localStorage', localStorageMock);

console.log('setupTests.ts: Global mocks for sql.js and localStorage applied.');
