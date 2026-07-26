// Fix: Changed imports to use namespaces for consistency and to resolve potential "no exported member" errors.
import * as firestore from 'firebase/firestore';
import { firebaseApp } from './authService';
import { DokkanPatchState, PlannerSlot } from '../types';

// Define a type for Firestore Timestamp-like objects if direct import is problematic
// No longer needed as we import Timestamp directly.
// interface FirestoreTimestampLike {
//   toDate: () => Date;
//   // Firestore Timestamps also have seconds and nanoseconds, but toDate is crucial
// }

// Fix: Use Firestore type directly from import
type FirestoreInstance = firestore.Firestore;
let db: FirestoreInstance | undefined;

const getDb = (): FirestoreInstance | undefined => {
  if (db) {
    return db;
  }
  if (firebaseApp) {
    try {
      // Fix: Use namespace import for getFirestore
      db = firestore.getFirestore(firebaseApp);
      console.log('Firestore initialized successfully via getDb.');
      return db;
    } catch (error) {
      console.error('Firestore initialization error via getDb:', error);
      db = undefined;
      return undefined;
    }
  } else {
    console.warn(
      'Firebase App not initialized when getDb called, Firestore service will be disabled.'
    );
    return undefined;
  }
};

interface StoredPatchState {
  patchData: DokkanPatchState;
  updatedAt: firestore.Timestamp;
  name?: string; // Added slot name
}

export const savePatchState = async (
  userId: string,
  slotId: string, // Changed to string to support more slots
  patchState: DokkanPatchState,
  slotName?: string // Added optional name
): Promise<void> => {
  const currentDb = getDb();
  if (!currentDb) {
    return Promise.reject(new Error('Firestore is not available. Patch not saved.'));
  }
  if (!userId) {
    return Promise.reject(new Error('User ID is missing. Cannot save patch state.'));
  }
  if (!slotId) {
    return Promise.reject(new Error('Invalid slot ID provided.'));
  }

  // Fix: Use namespace import for doc
  const slotDocRef = firestore.doc(currentDb, 'userPatches', userId, 'slots', slotId);
  try {
    const cleanPatchState = JSON.parse(JSON.stringify(patchState));
    // Fix: Pass a standard Date object; Firestore SDK converts it to Timestamp.
    // Fix: Use namespace import for setDoc and Timestamp
    await firestore.setDoc(slotDocRef, {
      patchData: cleanPatchState,
      updatedAt: firestore.Timestamp.now(), // Use Timestamp.now() for consistency if serverTimestamp causes issues
      name: slotName || `Slot ${slotId.replace('slot', '')}`, // Default name if not provided
    });
  } catch (error) {
    console.error(`Error saving patch state to Firestore (Slot: ${slotId}):`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to save patch to ${slotId}: ${error.message}`);
    }
    throw new Error(
      `An unknown error occurred while saving the patch to ${slotId}.`
    );
  }
};

// Fix: Return Date object for updatedAt
export const loadPatchDataFromSlot = async (
  userId: string,
  slotId: string
): Promise<{ patchData: DokkanPatchState; updatedAt: Date; name?: string } | null> => {
  const currentDb = getDb();
  if (!currentDb) {
    console.warn('Firestore is not available. Cannot load patch state.');
    return null;
  }
  if (!userId) {
    console.warn('User ID is missing. Cannot load patch state.');
    return null;
  }
  if (!slotId) {
    console.warn('Invalid slot ID provided for loading.');
    return null;
  }

  // Fix: Use namespace import for doc
  const slotDocRef = firestore.doc(currentDb, 'userPatches', userId, 'slots', slotId);
  try {
    // Fix: Use namespace import for getDoc
    const docSnap = await firestore.getDoc(slotDocRef);
    if (docSnap.exists()) {
      // Assume the data conforms to StoredPatchState, where updatedAt is Firestore's Timestamp-like object
      const data = docSnap.data() as StoredPatchState;
      // Fix: Convert Firestore Timestamp-like object to Date before returning
      return {
        patchData: data.patchData as DokkanPatchState,
        updatedAt: data.updatedAt.toDate(),
        name: data.name,
      };
    } else {
      console.log(`No saved patch state found for user ${userId} in ${slotId}.`);
      return null;
    }
  } catch (error) {
    console.error(`Error loading patch state from Firestore (Slot: ${slotId}):`, error);
    return null;
  }
};

// Fix: Return Date object for updatedAt
export const getSlotMetadata = async (
  userId: string,
  slotId: string
): Promise<{ updatedAt: Date | null; exists: boolean; name?: string }> => {
  const currentDb = getDb();
  if (!currentDb) {
    console.warn('Firestore is not available. Cannot get slot metadata.');
    return { updatedAt: null, exists: false };
  }
  if (!userId) {
    console.warn('User ID is missing. Cannot get slot metadata.');
    return { updatedAt: null, exists: false };
  }
  if (!slotId) {
    console.warn('Invalid slot ID provided for metadata.');
    return { updatedAt: null, exists: false };
  }

  // Fix: Use namespace import for doc
  const slotDocRef = firestore.doc(currentDb, 'userPatches', userId, 'slots', slotId);
  try {
    // Fix: Use namespace import for getDoc
    const docSnap = await firestore.getDoc(slotDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<StoredPatchState>;
      // Fix: Convert Firestore Timestamp-like object to Date
      return {
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
        exists: true,
        name: data.name,
      };
    } else {
      return { updatedAt: null, exists: false };
    }
  } catch (error) {
    console.error(`Error fetching metadata for slot ${slotId}:`, error);
    return { updatedAt: null, exists: false };
  }
};

export const renameSlot = async (
  userId: string,
  slotId: string,
  newName: string
): Promise<void> => {
  const currentDb = getDb();
  if (!currentDb) throw new Error('Firestore is not available.');
  if (!userId) throw new Error('User ID is missing.');
  if (!slotId) throw new Error('Invalid slot ID.');

  // Fix: Use namespace import for doc
  const slotDocRef = firestore.doc(currentDb, 'userPatches', userId, 'slots', slotId);

  try {
    const docSnap = await firestore.getDoc(slotDocRef);
    if (docSnap.exists()) {
      await firestore.setDoc(slotDocRef, { name: newName }, { merge: true });
    } else {
      throw new Error("Cannot rename an empty slot. Please save data to this slot first.");
    }
  } catch (error) {
    console.error(`Error renaming slot ${slotId}:`, error);
    throw error;
  }
};

export const savePlannerSlots = async (userId: string, slots: PlannerSlot[]): Promise<void> => {
  const currentDb = getDb();
  if (!currentDb) throw new Error('Firestore not available.');

  // Fix: Use namespace import for doc and Timestamp
  const plannerDocRef = firestore.doc(currentDb, 'userPlanners', userId);
  const dataToSave = {
    slots,
    updatedAt: firestore.Timestamp.now(),
  };
  await firestore.setDoc(plannerDocRef, dataToSave);
};

export const loadPlannerSlots = async (userId: string): Promise<PlannerSlot[] | null> => {
  const currentDb = getDb();
  if (!currentDb) return null;

  // Fix: Use namespace import for doc and getDoc
  const plannerDocRef = firestore.doc(currentDb, 'userPlanners', userId);
  const docSnap = await firestore.getDoc(plannerDocRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.slots as PlannerSlot[];
  }
  return null;
};

export interface BugReportData {
  userId: string;
  userEmail: string;
  appVersion: string;
  bugDescription: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  contactInfo?: string;
  userAgent: string;
  // timestamp will be added by Firestore
}

export const submitBugReport = async (reportData: BugReportData): Promise<void> => {
  const currentDb = getDb();
  if (!currentDb) {
    throw new Error('Firestore is not available. Bug report not submitted.');
  }

  try {
    // Fix: Use namespace import for collection, addDoc, and serverTimestamp
    const bugReportsCollection = firestore.collection(currentDb, 'bug_reports');
    await firestore.addDoc(bugReportsCollection, {
      ...reportData,
      timestamp: firestore.serverTimestamp(), // Use server-side timestamp
      status: 'new', // Default status
    });
  } catch (error) {
    console.error('Error submitting bug report to Firestore:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to submit bug report: ${error.message}`);
    }
    throw new Error('An unknown error occurred while submitting the bug report.');
  }
};
