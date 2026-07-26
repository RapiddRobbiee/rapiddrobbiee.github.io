// Fix: Changed imports to use namespaces to resolve "no exported member" errors.
import * as app from 'firebase/app';
import * as auth from 'firebase/auth';
import { initializeAnalytics, setAnalyticsUserId } from './analyticsService'; // Import analytics initializer and userId setter

// Type for User when Firebase is active
// Fix: Export the user type from the auth namespace.
export type User = auth.User;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let appInstance: app.FirebaseApp | undefined;
let authInstance: auth.Auth | undefined;
let googleProvider: auth.GoogleAuthProvider | undefined;

export const initializeFirebaseApp = (): auth.Auth | undefined => {
  if (!firebaseConfig.apiKey && import.meta.env.MODE !== 'test') {
    console.warn(
      'Firebase API key is missing. Firebase features are disabled. ' +
        'Please ensure VITE_FIREBASE_API_KEY and other VITE_FIREBASE_* environment variables are set in your .env.local file.'
    );
    return undefined;
  }
  try {
    // Fix: Use namespace import for initializeApp
    appInstance = app.initializeApp(firebaseConfig);
    // Fix: Use namespace import for getAuth
    authInstance = auth.getAuth(appInstance);
    // Fix: Use namespace import for GoogleAuthProvider
    googleProvider = new auth.GoogleAuthProvider();
    initializeAnalytics(appInstance); // Initialize Analytics, passing app instance
    console.log('Firebase initialized successfully (including Auth and potentially Analytics).');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    appInstance = undefined;
    authInstance = undefined;
    googleProvider = undefined;
  }
  return authInstance;
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!authInstance) {
    console.warn(
      'Firebase auth not initialized when onAuthChange called. Attempting late initialization.'
    );
    initializeFirebaseApp();
    if (!authInstance) {
      console.error('Critical: Firebase auth could not be initialized for onAuthChange.');
      setAnalyticsUserId(null); // Ensure analytics user ID is cleared
      callback(null);
      return () => {};
    }
  }
  // Fix: Use namespace import for onAuthStateChanged
  return auth.onAuthStateChanged(authInstance, (user) => {
    setAnalyticsUserId(user ? user.uid : null); // Set user ID for Analytics
    callback(user);
  });
};

export const signUpWithEmail = (email: string, password: string): Promise<User> => {
  if (!authInstance) return Promise.reject(new Error('Firebase not initialized'));
  // Fix: Use namespace import for createUserWithEmailAndPassword
  return auth
    .createUserWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => userCredential.user);
};

export const signInWithEmail = (email: string, password: string): Promise<User> => {
  if (!authInstance) return Promise.reject(new Error('Firebase not initialized'));
  // Fix: Use namespace import for signInWithEmailAndPassword
  return auth
    .signInWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => userCredential.user);
};

export const signInWithGoogle = (): Promise<User> => {
  if (!authInstance || !googleProvider)
    return Promise.reject(new Error('Firebase or Google Provider not initialized'));
  // Fix: Use namespace import for signInWithPopup
  return auth.signInWithPopup(authInstance, googleProvider).then((result) => result.user);
};

export const logout = (): Promise<void> => {
  if (!authInstance) return Promise.reject(new Error('Firebase not initialized'));
  // Fix: Use namespace import for signOut
  return auth.signOut(authInstance);
};

// Export auth and app for potential direct use in other modules if absolutely necessary,
// for instance, to get currentUser directly without prop drilling.
export { authInstance as firebaseAuth, appInstance as firebaseApp };
