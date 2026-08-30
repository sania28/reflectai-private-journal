import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalEntry, UserProfile } from '../types';

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore (supporting custom database ID if provisioned)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Sign in user with Google Auth Provider via Popup
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Record user profile in Firestore
    await syncUserProfile(user);
    return user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Sign out current authenticated user
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Sync user profile to /users/{uid} document
 */
export async function syncUserProfile(user: FirebaseUser): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    const nowIso = new Date().toISOString();
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        userRef,
        {
          displayName: user.displayName || docSnap.data().displayName,
          photoURL: user.photoURL || docSnap.data().photoURL,
          email: user.email || docSnap.data().email,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Sync user profile warning:', err);
  }
}

/**
 * Subscribe to real-time updates of the user's isolated journal entries
 * Path: /users/{userId}/entries/{entryId}
 */
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('updatedAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        
        // Normalize timestamps
        const createdAt = data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : (data.createdAt || new Date().toISOString());
        
        const updatedAt = data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().toISOString()
          : (data.updatedAt || new Date().toISOString());

        return {
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || 'Untitled Reflection',
          category: data.category || 'Personal Reflection',
          mood: data.mood || 'Thoughtful',
          summary: data.summary || '',
          keyInsights: Array.isArray(data.keyInsights) ? data.keyInsights : [],
          actionItems: Array.isArray(data.actionItems) ? data.actionItems : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          messages: Array.isArray(data.messages) ? data.messages : [],
          pinned: Boolean(data.pinned),
          createdAt,
          updatedAt,
        };
      });

      onUpdate(entries);
    },
    (error) => {
      console.error('Error fetching user journal entries:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Save or update a journal entry in Firestore
 * Strictly scoped under /users/{userId}/entries/{entryId}
 */
export async function saveJournalEntry(
  userId: string,
  entry: Partial<JournalEntry> & { id: string; title: string }
): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', entry.id);

  // Clean undefined values to prevent Firestore driver exceptions
  const payload: Record<string, unknown> = {
    id: entry.id,
    userId,
    title: entry.title || 'Untitled Reflection',
    category: entry.category || 'Personal Reflection',
    mood: entry.mood || 'Thoughtful',
    messages: entry.messages || [],
    updatedAt: serverTimestamp(),
  };

  if (entry.summary !== undefined) payload.summary = entry.summary;
  if (entry.keyInsights !== undefined) payload.keyInsights = entry.keyInsights;
  if (entry.actionItems !== undefined) payload.actionItems = entry.actionItems;
  if (entry.tags !== undefined) payload.tags = entry.tags;
  if (entry.pinned !== undefined) payload.pinned = entry.pinned;
  if (entry.createdAt) {
    payload.createdAt = entry.createdAt;
  } else {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(entryRef, payload, { merge: true });
}

/**
 * Delete a user's journal entry
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}
