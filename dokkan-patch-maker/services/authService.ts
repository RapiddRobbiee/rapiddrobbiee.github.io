import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { UserRegistrationData, LoginCredentials, User, UserWithToken } from '../types';
import { getUserAuthDB, saveUserAuthDB } from './databaseService';
import { Database } from 'sql.js'; // Import Database type

const JWT_SECRET_KEY = 'your-super-secret-and-long-enough-key'; // IMPORTANT: In a real app, manage this securely!
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY);
const JWT_EXPIRATION_TIME = '2h'; // Token expiration time

export const register = async (userData: UserRegistrationData): Promise<User> => {
  const db = await getUserAuthDB();
  const { username, email, password } = userData;

  // Check for existing user
  try {
    const existingUser = db.exec("SELECT id FROM users WHERE username = ? OR email = ?", [username, email]);
    if (existingUser.length > 0 && existingUser[0].values && existingUser[0].values.length > 0) {
      throw new Error('Username or email already exists.');
    }
  } catch (e: any) {
    // if (e.message.includes('no such table: users')) this is fine, table might not have users yet.
    // Otherwise, rethrow if it's a different error.
    // Also, if the specific error "Username or email already exists" was thrown from the try block, rethrow it.
    if (!e.message.includes('no such table: users') && !e.message.includes('Username or email already exists.')) {
        console.error("DB error checking existing user:", e);
        throw new Error('Error checking for existing user.');
    }
    if (e.message.includes('Username or email already exists.')) {
        throw e;
    }
  }


  const saltRounds = 10;
  const passwordHash = bcrypt.hashSync(password, saltRounds);
  const role = 'user'; // Default role

  const isoDate = new Date().toISOString();

  try {
    db.run(
      "INSERT INTO users (username, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [username, email, passwordHash, role, isoDate, isoDate]
    );
    await saveUserAuthDB(db); // Persist changes

    // Get the newly created user (important to get the auto-incremented ID)
    const newUserResult = db.exec("SELECT id, username, email, role, created_at, updated_at FROM users WHERE username = ?", [username]);
    if (!newUserResult.length || !newUserResult[0].values || !newUserResult[0].values.length) {
        throw new Error('Failed to retrieve new user after registration.');
    }
    const newUserRow = newUserResult[0].values[0];
    const createdUser: User = {
        id: newUserRow[0] as number,
        username: newUserRow[1] as string,
        email: newUserRow[2] as string,
        role: newUserRow[3] as 'user' | 'admin',
        created_at: newUserRow[4] as string,
        updated_at: newUserRow[5] as string,
    };
    return createdUser;
  } catch (e: any) {
    console.error("DB error during registration:", e);
    // Attempt to clean up if user insert succeeded but save or retrieval failed
    // This is a best-effort and might not always be appropriate.
    try {
        db.run("DELETE FROM users WHERE username = ? AND email = ?", [username, email]);
        // Not saving DB here as the primary operation failed.
    } catch (cleanupError) {
        console.error("Error during cleanup attempt:", cleanupError);
    }
    throw new Error('Failed to register user. ' + e.message);
  }
};

export const login = async (credentials: LoginCredentials): Promise<UserWithToken> => {
  const db = await getUserAuthDB();
  const { usernameOrEmail, password } = credentials;

  let userRow: any[]; // Should be QueryExecResult[]
  try {
    const result = db.exec("SELECT id, username, email, password_hash, role, created_at, updated_at FROM users WHERE username = ? OR email = ?", [usernameOrEmail, usernameOrEmail]);
    if (!result.length || !result[0].values || !result[0].values.length) {
      throw new Error('Invalid credentials or user not found.');
    }
    userRow = result[0].values[0]; // This is the first row of the first result set
  } catch (e: any) {
    // If table doesn't exist, it means no users are registered.
    if (e.message.includes('no such table: users') || e.message.includes('Invalid credentials or user not found.')) {
        throw new Error('Invalid credentials or user not found.');
    }
    console.error("DB error during login query:", e);
    throw new Error('Error during login process.');
  }


  const storedPasswordHash = userRow[3] as string; // password_hash
  const passwordMatches = bcrypt.compareSync(password, storedPasswordHash);

  if (!passwordMatches) {
    throw new Error('Invalid credentials or user not found.'); // Same message for security
  }

  const user: User = {
    id: userRow[0] as number, // id
    username: userRow[1] as string, // username
    email: userRow[2] as string, // email
    role: userRow[4] as 'user' | 'admin', // role
    created_at: userRow[5] as string, // created_at
    updated_at: userRow[6] as string, // updated_at
  };

  const token = await new jose.SignJWT({ userId: user.id, username: user.username, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION_TIME)
    .sign(JWT_SECRET);

  return { user, access_token: token };
};

export const logout = async (): Promise<void> => {
  console.log('Logging out user');
  // Client-side token invalidation (e.g., removing from localStorage) is typical.
  // No server-side action needed for stateless JWTs unless implementing a blacklist.
  return Promise.resolve();
};
