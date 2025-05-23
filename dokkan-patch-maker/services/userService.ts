import { User } from '../types';
import { getUserAuthDB, saveUserAuthDB } from './databaseService';
import { Database } from 'sql.js'; // Import Database type

export const getAllUsers = async (): Promise<User[]> => {
  const db = await getUserAuthDB();
  try {
    const results = db.exec("SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY username ASC");
    if (!results.length || !results[0].values || !results[0].values.length) {
      return []; // No users found or table is empty
    }
    const users: User[] = results[0].values.map(row => ({
      id: row[0] as number,
      username: row[1] as string,
      email: row[2] as string,
      role: row[3] as 'user' | 'admin',
      created_at: row[4] as string,
      updated_at: row[5] as string,
    }));
    return users;
  } catch (e: any) {
    console.error("DB error getting all users:", e);
    if (e.message.includes('no such table: users')) {
        return []; // Table doesn't exist, so no users
    }
    throw new Error('Failed to retrieve users.');
  }
};

export const updateUserRole = async (userId: number, role: 'user' | 'admin'): Promise<User> => {
  const db = await getUserAuthDB();
  try {
    // Check if user exists first
    const userExistsResult = db.exec("SELECT id FROM users WHERE id = ?", [userId]);
    if (!userExistsResult.length || !userExistsResult[0].values || !userExistsResult[0].values.length) {
        throw new Error(`User with id ${userId} not found.`);
    }

    // SQLite's last_insert_rowid() doesn't apply here, and standard SQL UPDATE doesn't return the row.
    // The trigger will update `updated_at`. We fetch the user after update.
    db.run("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
    await saveUserAuthDB(db);

    const updatedUserResult = db.exec("SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?", [userId]);
    if (!updatedUserResult.length || !updatedUserResult[0].values || !updatedUserResult[0].values.length) {
        // This should ideally not happen if the update was successful and user existed.
        throw new Error('Failed to retrieve user after role update.');
    }
    const row = updatedUserResult[0].values[0];
    const updatedUser: User = {
      id: row[0] as number,
      username: row[1] as string,
      email: row[2] as string,
      role: row[3] as 'user' | 'admin',
      created_at: row[4] as string,
      updated_at: row[5] as string,
    };
    return updatedUser;
  } catch (e: any) {
    console.error(`DB error updating role for user ${userId}:`, e);
    if (e.message.includes('no such table: users')) {
        throw new Error('Users table not found.');
    }
    // Re-throw the original more specific error if it was "User with id ... not found"
    if (e.message.includes(`User with id ${userId} not found.`)) {
        throw e;
    }
    throw new Error(`Failed to update role for user ${userId}.`);
  }
};

export const deleteUser = async (userId: number): Promise<void> => {
  const db = await getUserAuthDB();
  try {
    // Check if user exists to provide a more specific error message
    const userExistsResult = db.exec("SELECT id FROM users WHERE id = ?", [userId]);
    if (!userExistsResult.length || !userExistsResult[0].values || !userExistsResult[0].values.length) {
        // Depending on desired behavior, could throw error or return silently
        console.warn(`Attempted to delete non-existent user with id ${userId}.`);
        // throw new Error(`User with id ${userId} not found.`); 
        return; // Or return silently if that's preferred
    }

    db.run("DELETE FROM users WHERE id = ?", [userId]);
    await saveUserAuthDB(db);
  } catch (e: any) {
    console.error(`DB error deleting user ${userId}:`, e);
    if (e.message.includes('no such table: users')) {
        // If table doesn't exist, user effectively doesn't exist.
        console.warn(`Attempted to delete from non-existent users table.`);
        return;
    }
    throw new Error(`Failed to delete user ${userId}.`);
  }
};
