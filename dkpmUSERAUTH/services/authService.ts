import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  Auth
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

export const initializeFirebaseApp = (): Auth => {
  if (!firebaseConfig.apiKey) {
    console.warn(
        "Firebase API key is missing. Firebase features will not work. " +
        "Please ensure VITE_FIREBASE_API_KEY and other VITE_FIREBASE_* environment variables are set in your .env.local file."
    );
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  return auth;
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    // Firebase might not be initialized yet, or config is missing.
    // Initialize it here, or ensure App.tsx calls initializeFirebaseApp first.
    // For simplicity, assuming App.tsx handles initial call.
     console.warn("Firebase auth not initialized when onAuthChange called. Attempting late initialization.");
     initializeFirebaseApp(); // Attempt to initialize if not already
     if(!auth) {
        console.error("Critical: Firebase auth could not be initialized for onAuthChange.");
        callback(null); // Notify with null user as auth is not available
        return () => {}; // Return an empty unsubscribe function
     }
  }
  return onAuthStateChanged(auth, callback);
};

export const signUpWithEmail = (email: string, password: string): Promise<User> => {
  if (!auth) throw new Error("Firebase not initialized");
  return createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => userCredential.user);
};

export const signInWithEmail = (email: string, password: string): Promise<User> => {
  if (!auth) throw new Error("Firebase not initialized");
  return signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => userCredential.user);
};

export const signInWithGoogle = (): Promise<User> => {
  if (!auth || !googleProvider) throw new Error("Firebase or Google Provider not initialized");
  return signInWithPopup(auth, googleProvider)
    .then(result => result.user);
};

export const logout = (): Promise<void> => {
  if (!auth) throw new Error("Firebase not initialized");
  return firebaseSignOut(auth);
};

// Export auth for direct use if needed, though prefer service functions
export { auth as firebaseAuth, app as firebaseApp };
