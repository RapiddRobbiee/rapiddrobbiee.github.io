import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllUsers, updateUserRole, deleteUser } from './userService';
import { User } from '../types';

// Mock databaseService
const mockDbRun = vi.fn();
const mockDbExec = vi.fn();
const mockSaveUserAuthDB = vi.fn().mockResolvedValue(undefined);
const mockCloseDb = vi.fn(); // Mock for db.close() if used


vi.mock('../databaseService', () => ({
  // This mock for initializeSqlJs is for any direct calls from the service.
  // The one inside databaseService.ts should use the globally mocked 'sql.js'.
  initializeSqlJs: vi.fn().mockResolvedValue({ 
    Database: vi.fn(() => ({
        run: mockDbRun,
        exec: mockDbExec,
        export: vi.fn().mockReturnValue(new Uint8Array()),
        close: mockCloseDb,
    }))
  }),
  getUserAuthDB: vi.fn().mockResolvedValue({
    run: mockDbRun,
    exec: mockDbExec,
    export: vi.fn().mockReturnValue(new Uint8Array()),
    close: mockCloseDb,
  }),
  saveUserAuthDB: mockSaveUserAuthDB,
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mocks for DB operations that might have specific return values per test
    mockDbRun.mockClear();
    mockDbExec.mockClear().mockReturnValue([]); // Default to empty results
    mockSaveUserAuthDB.mockClear().mockResolvedValue(undefined);
    mockCloseDb.mockClear();
  });

  describe('getAllUsers', () => {
    it('should return a list of users', async () => {
      const mockUsersData = [
        [1, 'admin', 'admin@example.com', 'admin', '2023-01-01T00:00:00.000Z', '2023-01-01T00:00:00.000Z'],
        [2, 'user1', 'user1@example.com', 'user', '2023-01-02T00:00:00.000Z', '2023-01-02T00:00:00.000Z'],
      ];
      mockDbExec.mockReturnValueOnce([{
        columns: ['id', 'username', 'email', 'role', 'created_at', 'updated_at'],
        values: mockUsersData,
      }]);

      const result = await getAllUsers();

      expect(mockDbExec).toHaveBeenCalledWith("SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY username ASC");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({ id: 1, username: 'admin', role: 'admin' }));
      expect(result[1]).toEqual(expect.objectContaining({ id: 2, username: 'user1', role: 'user' }));
    });

    it('should return an empty array if no users are found', async () => {
      mockDbExec.mockReturnValueOnce([{ columns: [], values: [] }]);
      const result = await getAllUsers();
      expect(result).toEqual([]);
    });
    
    it('should return an empty array if results are present but values are empty', async () => {
      mockDbExec.mockReturnValueOnce([{ columns: ['id', 'username'], values: [] }]);
      const result = await getAllUsers();
      expect(result).toEqual([]);
    });

    it('should return an empty array if no results are returned (e.g. table does not exist)', async () => {
        mockDbExec.mockReturnValueOnce([]); // No results array
        const result = await getAllUsers();
        expect(result).toEqual([]);
    });

    it('should throw an error if database query fails for a reason other than "no such table"', async () => {
      mockDbExec.mockImplementationOnce(() => { throw new Error('Generic DB Error'); });
      await expect(getAllUsers()).rejects.toThrow('Failed to retrieve users.');
    });
  });

  describe('updateUserRole', () => {
    const userIdToUpdate = 1;
    const newRole = 'admin';
    const mockUserData = {
      id: userIdToUpdate,
      username: 'testuser',
      email: 'test@example.com',
      role: 'user', // Original role
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    };
     const mockUpdatedUserData = {
      ...mockUserData,
      role: newRole,
      updated_at: new Date().toISOString(), // Expect updated timestamp
    };


    it('should update user role successfully', async () => {
      // Mock for user existence check
      mockDbExec.mockReturnValueOnce([{ columns: ['id'], values: [[userIdToUpdate]] }]);
      // Mock for fetching updated user
      mockDbExec.mockReturnValueOnce([{
        columns: ['id', 'username', 'email', 'role', 'created_at', 'updated_at'],
        values: [[mockUpdatedUserData.id, mockUpdatedUserData.username, mockUpdatedUserData.email, mockUpdatedUserData.role, mockUpdatedUserData.created_at, mockUpdatedUserData.updated_at]],
      }]);

      const result = await updateUserRole(userIdToUpdate, newRole);

      expect(mockDbExec).toHaveBeenCalledWith("SELECT id FROM users WHERE id = ?", [userIdToUpdate]);
      expect(mockDbRun).toHaveBeenCalledWith("UPDATE users SET role = ? WHERE id = ?", [newRole, userIdToUpdate]);
      expect(mockSaveUserAuthDB).toHaveBeenCalled();
      expect(mockDbExec).toHaveBeenCalledWith("SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?", [userIdToUpdate]);
      expect(result.role).toBe(newRole);
      expect(result.id).toBe(userIdToUpdate);
    });

    it('should throw an error if user to update is not found', async () => {
      mockDbExec.mockReturnValueOnce([]); // Simulate user not found for existence check
      
      await expect(updateUserRole(userIdToUpdate, newRole)).rejects.toThrow(`User with id ${userIdToUpdate} not found.`);
      expect(mockDbRun).not.toHaveBeenCalled();
      expect(mockSaveUserAuthDB).not.toHaveBeenCalled();
    });

    it('should throw an error if fetching updated user fails', async () => {
      mockDbExec.mockReturnValueOnce([{ columns: ['id'], values: [[userIdToUpdate]] }]); // User exists
      mockDbExec.mockReturnValueOnce([]); // Failed to fetch updated user
      
      await expect(updateUserRole(userIdToUpdate, newRole)).rejects.toThrow('Failed to retrieve user after role update.');
      expect(mockDbRun).toHaveBeenCalledWith("UPDATE users SET role = ? WHERE id = ?", [newRole, userIdToUpdate]);
      expect(mockSaveUserAuthDB).toHaveBeenCalled();
    });
    
    it('should handle DB error during user existence check', async () => {
        mockDbExec.mockImplementationOnce(() => { throw new Error('DB check failed'); });
        await expect(updateUserRole(userIdToUpdate, newRole)).rejects.toThrow('Failed to update role for user 1.'); // General error message
    });

    it('should handle DB error during update operation', async () => {
        mockDbExec.mockReturnValueOnce([{ columns: ['id'], values: [[userIdToUpdate]] }]); // User exists
        mockDbRun.mockImplementationOnce(() => { throw new Error('DB update failed'); });
        await expect(updateUserRole(userIdToUpdate, newRole)).rejects.toThrow('Failed to update role for user 1.'); // General error message
    });
  });

  describe('deleteUser', () => {
    const userIdToDelete = 1;

    it('should delete a user successfully', async () => {
      mockDbExec.mockReturnValueOnce([{ columns: ['id'], values: [[userIdToDelete]] }]); // User exists

      await deleteUser(userIdToDelete);

      expect(mockDbExec).toHaveBeenCalledWith("SELECT id FROM users WHERE id = ?", [userIdToDelete]);
      expect(mockDbRun).toHaveBeenCalledWith("DELETE FROM users WHERE id = ?", [userIdToDelete]);
      expect(mockSaveUserAuthDB).toHaveBeenCalled();
    });

    it('should not throw an error if user to delete is not found (and return silently)', async () => {
      mockDbExec.mockReturnValueOnce([]); // Simulate user not found

      await expect(deleteUser(userIdToDelete)).resolves.toBeUndefined();
      
      expect(mockDbExec).toHaveBeenCalledWith("SELECT id FROM users WHERE id = ?", [userIdToDelete]);
      expect(mockDbRun).not.toHaveBeenCalled();
      expect(mockSaveUserAuthDB).not.toHaveBeenCalled();
    });
    
    it('should handle "no such table" error gracefully during existence check', async () => {
        mockDbExec.mockImplementationOnce(() => {
            const error = new Error('no such table: users');
            throw error;
        });
        await expect(deleteUser(userIdToDelete)).resolves.toBeUndefined();
    });

    it('should throw an error for other DB errors during existence check', async () => {
        mockDbExec.mockImplementationOnce(() => { throw new Error('Generic DB Error'); });
        await expect(deleteUser(userIdToDelete)).rejects.toThrow('Failed to delete user 1.');
    });
    
    it('should throw an error if DB run operation fails', async () => {
      mockDbExec.mockReturnValueOnce([{ columns: ['id'], values: [[userIdToDelete]] }]); // User exists
      mockDbRun.mockImplementationOnce(() => { throw new Error('DB delete failed'); });

      await expect(deleteUser(userIdToDelete)).rejects.toThrow(`Failed to delete user ${userIdToDelete}.`);
      expect(mockSaveUserAuthDB).not.toHaveBeenCalled(); // Should not be called if run fails
    });
  });
});
