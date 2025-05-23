import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register, login } from './authService'; 
import { UserRegistrationData, LoginCredentials, User, UserWithToken } from '../types';
import bcrypt from 'bcryptjs'; 
import * as jose from 'jose'; 

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  hashSync: vi.fn((password, salt) => `hashed_${password}_${salt}`),
  compareSync: vi.fn((password, hash) => hash.includes(password) && hash.startsWith('hashed_') && password && password.length > 0),
}));

// Mock jose
const mockSignJWTInstance = {
  setProtectedHeader: vi.fn().mockReturnThis(),
  setIssuedAt: vi.fn().mockReturnThis(),
  setExpirationTime: vi.fn().mockReturnThis(),
  sign: vi.fn().mockResolvedValue('mocked.jwt.token'),
};
vi.mock('jose', async () => {
  const actualJose = await vi.importActual('jose');
  return {
    ...actualJose,
    SignJWT: vi.fn(() => mockSignJWTInstance),
  };
});

// These will be the functions we assert against for DB interactions
const mockServiceDbRun = vi.fn();
const mockServiceDbExec = vi.fn(() => []); // Default to no results
const mockServiceSaveUserAuthDB = vi.fn().mockResolvedValue(undefined);

vi.mock('../databaseService', () => {
  console.log('authService.test.ts: Mocking ../databaseService'); // For debugging
  return {
    getUserAuthDB: vi.fn().mockResolvedValue({
      run: mockServiceDbRun,
      exec: mockServiceDbExec,
      // Add other DB methods if authService directly uses them (e.g., export, close)
      // For now, only run and exec are directly used by the authService logic being tested.
      // export: vi.fn().mockReturnValue(new Uint8Array()), 
      // close: vi.fn(),
    }),
    saveUserAuthDB: mockServiceSaveUserAuthDB,
    // initializeSqlJs is not mocked here, relying on the __mocks__/sql.js.ts to prevent original execution
  };
});


beforeEach(() => {
  vi.clearAllMocks(); 
  
  // Reset specific mock behaviors if needed (e.g., if a test changes a return value)
  mockServiceDbExec.mockReset().mockReturnValue([]); // Ensure it's reset to default
  mockServiceDbRun.mockReset();
  mockServiceSaveUserAuthDB.mockReset().mockResolvedValue(undefined);

  // Reset bcryptjs mocks if their behavior is changed per test (not typical for these)
  (bcrypt.hashSync as vi.Mock).mockClear().mockImplementation((password, salt) => `hashed_${password}_${salt}`);
  (bcrypt.compareSync as vi.Mock).mockClear().mockImplementation((password, hash) => hash.includes(password) && hash.startsWith('hashed_') && password && password.length > 0);

  // Reset jose SignJWT mock parts
  mockSignJWTInstance.setProtectedHeader.mockClear().mockReturnThis();
  mockSignJWTInstance.setIssuedAt.mockClear().mockReturnThis();
  mockSignJWTInstance.setExpirationTime.mockClear().mockReturnThis();
  mockSignJWTInstance.sign.mockClear().mockResolvedValue('mocked.jwt.token');
});

// Test suites for register and login
describe('authService', () => {
  describe('register', () => {
    const registrationData: UserRegistrationData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      mockServiceDbExec
        .mockReturnValueOnce([]) // No existing user
        .mockReturnValueOnce([{ 
          columns: ['id', 'username', 'email', 'role', 'created_at', 'updated_at'],
          values: [[1, registrationData.username, registrationData.email, 'user', new Date().toISOString(), new Date().toISOString()]],
        }]);

      const result = await register(registrationData);

      expect(mockServiceDbExec).toHaveBeenCalledWith("SELECT id FROM users WHERE username = ? OR email = ?", [registrationData.username, registrationData.email]);
      expect(bcrypt.hashSync).toHaveBeenCalledWith(registrationData.password, 10);
      expect(mockServiceDbRun).toHaveBeenCalledWith(
        "INSERT INTO users (username, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          registrationData.username,
          registrationData.email,
          `hashed_${registrationData.password}_10`,
          'user',
          expect.any(String), 
          expect.any(String), 
        ]
      );
      expect(mockServiceSaveUserAuthDB).toHaveBeenCalled();
      expect(mockServiceDbExec).toHaveBeenCalledWith("SELECT id, username, email, role, created_at, updated_at FROM users WHERE username = ?", [registrationData.username]);
      
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        username: registrationData.username,
        email: registrationData.email,
        role: 'user',
      }));
    });

    it('should throw an error if username or email already exists', async () => {
      mockServiceDbExec.mockReturnValueOnce([{ 
        columns: ['id'], 
        values: [[1]] 
      }]); 

      await expect(register(registrationData)).rejects.toThrow('Username or email already exists.');
      expect(mockServiceDbRun).not.toHaveBeenCalled();
      expect(mockServiceSaveUserAuthDB).not.toHaveBeenCalled();
    });
    
    it('should handle database error during user existence check (general error)', async () => {
        mockServiceDbExec.mockImplementationOnce(() => { throw new Error('DB check failed'); });
        await expect(register(registrationData)).rejects.toThrow('DB check failed'); // Error is re-thrown
    });
    
    it('should handle database error during user insertion', async () => {
        mockServiceDbExec.mockReturnValueOnce([]); // No existing user
        mockServiceDbRun.mockImplementationOnce(() => { throw new Error('DB insert failed'); });
        await expect(register(registrationData)).rejects.toThrow('Failed to register user. DB insert failed');
    });

    it('should handle failure to retrieve user after registration', async () => {
        mockServiceDbExec
            .mockReturnValueOnce([]) // No existing user
            .mockReturnValueOnce([]); // Failed to retrieve new user
        
        await expect(register(registrationData)).rejects.toThrow('Failed to retrieve new user after registration.');
    });
  });

  describe('login', () => {
    const loginCredentials: LoginCredentials = {
      usernameOrEmail: 'testuser',
      password: 'password123',
    };
    const mockUserDbRow = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashed_password123_10', 
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should login a user successfully and return user with token', async () => {
      mockServiceDbExec.mockReturnValueOnce([{
        columns: ['id', 'username', 'email', 'password_hash', 'role', 'created_at', 'updated_at'],
        values: [Object.values(mockUserDbRow)],
      }]);
      (bcrypt.compareSync as vi.Mock).mockReturnValueOnce(true);

      const result = await login(loginCredentials);

      expect(mockServiceDbExec).toHaveBeenCalledWith("SELECT id, username, email, password_hash, role, created_at, updated_at FROM users WHERE username = ? OR email = ?", [loginCredentials.usernameOrEmail, loginCredentials.usernameOrEmail]);
      expect(bcrypt.compareSync).toHaveBeenCalledWith(loginCredentials.password, mockUserDbRow.password_hash);
      expect(jose.SignJWT).toHaveBeenCalledWith({ userId: mockUserDbRow.id, username: mockUserDbRow.username, role: mockUserDbRow.role });
      expect(mockSignJWTInstance.sign).toHaveBeenCalled();
      
      expect(result.user).toEqual(expect.objectContaining({
        id: mockUserDbRow.id,
        username: mockUserDbRow.username,
        email: mockUserDbRow.email,
        role: mockUserDbRow.role,
      }));
      expect(result.access_token).toBe('mocked.jwt.token');
    });

    it('should throw an error if user not found', async () => {
      mockServiceDbExec.mockReturnValueOnce([]); 
      await expect(login(loginCredentials)).rejects.toThrow('Invalid credentials or user not found.');
      expect(bcrypt.compareSync).not.toHaveBeenCalled();
    });
        
    it('should throw an error for DB error during login user query (general error)', async () => {
        mockServiceDbExec.mockImplementationOnce(() => { throw new Error('DB query failed'); });
        await expect(login(loginCredentials)).rejects.toThrow('Error during login process.');
    });

    it('should throw an error if password does not match', async () => {
      mockServiceDbExec.mockReturnValueOnce([{
        columns: ['id', 'username', 'email', 'password_hash', 'role', 'created_at', 'updated_at'],
        values: [Object.values(mockUserDbRow)],
      }]);
      (bcrypt.compareSync as vi.Mock).mockReturnValueOnce(false);

      await expect(login(loginCredentials)).rejects.toThrow('Invalid credentials or user not found.');
    });
  });
});
