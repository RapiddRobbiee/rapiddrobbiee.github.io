import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as jose from 'jose';
import { User, UserWithToken, LoginCredentials, UserRegistrationData } from '../types';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../services/authService';

// Redefine JWT constants here for client-side use (ensure this matches your backend if verifying signatures)
// In a real app, this secret should NOT be hardcoded directly in client-side code if used for verification
// For decoding and checking expiration, it's less critical, but still not ideal.
const JWT_SECRET_KEY = 'your-super-secret-and-long-enough-key';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY); // Needed for jwtVerify, not strictly for decodeJwt

interface AuthState {
  currentUser: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: UserRegistrationData) => Promise<void>; // Modified to not auto-login here
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start true for initial check
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const tokenFromStorage = localStorage.getItem('authToken');
      const storedUserString = localStorage.getItem('currentUser');

      if (tokenFromStorage) {
        try {
          // Using decodeJwt for client-side payload inspection and expiration check
          const payload = jose.decodeJwt(tokenFromStorage);
          
          if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
            // Token is present and not expired
            let userToSet: User | null = null;

            if (storedUserString) {
                try {
                    userToSet = JSON.parse(storedUserString) as User;
                    // Optional: Cross-check user from storage with token payload
                    if (userToSet && payload.userId && userToSet.id !== payload.userId) {
                        console.warn("User ID in token does not match stored user ID. Clearing stored data.");
                        userToSet = null; // Invalidate if mismatch
                    }
                } catch (parseError) {
                    console.error("Error parsing stored user:", parseError);
                    userToSet = null; // Invalidate if parsing fails
                }
            }
            
            // If storedUser is invalid or not present, try to use token payload
            if (!userToSet && payload.userId && payload.username && payload.role) {
                 userToSet = { 
                    id: payload.userId as number, 
                    username: payload.username as string, 
                    role: payload.role as 'user' | 'admin',
                    email: payload.email as string || '', // Assuming email might be in token
                    created_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(), // Or fetch from server
                    updated_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(), // Or fetch from server
                };
            }

            if (userToSet) {
                setToken(tokenFromStorage);
                setCurrentUser(userToSet);
                setIsAdmin(userToSet.role === 'admin');
                if (!storedUserString || userToSet !== JSON.parse(storedUserString)) { // Resave if derived from token
                    localStorage.setItem('currentUser', JSON.stringify(userToSet));
                }
            } else {
                // Token valid but no usable user data found
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                setToken(null);
                setCurrentUser(null);
                setIsAdmin(false);
            }

          } else {
            // Token expired or invalid payload
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            setToken(null);
            setCurrentUser(null);
            setIsAdmin(false);
          }
        } catch (e) {
          console.error("Token validation/decoding error:", e);
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          setToken(null);
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } else {
        // No token in storage
        setToken(null);
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const userWithToken: UserWithToken = await apiLogin(credentials);
      setCurrentUser(userWithToken.user);
      setToken(userWithToken.access_token);
      setIsAdmin(userWithToken.user.role === 'admin');
      localStorage.setItem('authToken', userWithToken.access_token);
      localStorage.setItem('currentUser', JSON.stringify(userWithToken.user));
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      throw err; // Re-throw for the component to handle if needed
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: UserRegistrationData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Register does not auto-login according to instructions
      await apiRegister(userData);
      // Optionally set a success message here if state had a field for it
      // Or rely on the component to show its own success message
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      throw err; // Re-throw for the component
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true); // Optional: show loading during logout
    try {
        await apiLogout(); // Though it's client-side, might involve API call in future
    } catch (e) {
        console.error("Error during API logout:", e);
    } finally {
        setCurrentUser(null);
        setToken(null);
        setIsAdmin(false);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ authState: { currentUser, token, isLoading, error, isAdmin }, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
