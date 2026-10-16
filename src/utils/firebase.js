import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { collection, deleteDoc, doc, getDoc, getFirestore, limit, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCQ9TqTeLNWX7AUCx10GVNSqu-EA8A_8ec',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'solar-pulse1.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'solar-pulse1',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'solar-pulse1.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '470677429490',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:470677429490:web:eab2494cb023de37a2c46b',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-F59KS47808',
};

const app = initializeApp(firebaseConfig);
// Note: Client-side isAdminUser is a UI hint only (shows admin navigation tabs).
// Authoritative security is enforced strictly by Firestore Security Rules using request.auth.token.admin == true.
export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();
export const storage = getStorage(app);
export const db = getFirestore(app);

if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  }).catch(() => {});
}

export const auth = getAuth(app);
export const functions = getFunctions(app, import.meta.env.VITE_FUNCTIONS_REGION || 'europe-west1');

export const callInitializeTransaction = (data) => httpsCallable(functions, 'initializeTransaction')(data);
export const callVerifyTransaction = (data) => httpsCallable(functions, 'verifyTransaction')(data);
export const callDeleteMyData = () => httpsCallable(functions, 'deleteMyData')();

export {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
};
export { getDownloadURL, ref, uploadBytes };

const presenceCollection = collection(db, 'presence');
const subscriptionsCollection = collection(db, 'subscriptions');
const supportTicketsCollection = collection(db, 'supportTickets');

export const isAdminUser = (firebaseUser) => Boolean(
  firebaseUser && ADMIN_EMAIL && firebaseUser.email?.toLowerCase() === ADMIN_EMAIL
);

export const subscribeToUserPlan = (firebaseUser, onPlan) => {
  if (!firebaseUser) {
    onPlan({ plan: 'free', status: 'inactive' });
    return () => {};
  }
  if (isAdminUser(firebaseUser)) {
    onPlan({ plan: 'admin', status: 'active', source: 'admin-exemption' });
    return () => {};
  }

  return onSnapshot(doc(subscriptionsCollection, firebaseUser.uid), (snapshot) => {
    onPlan(snapshot.exists() ? snapshot.data() : { plan: 'free', status: 'inactive' });
  }, () => onPlan({ plan: 'free', status: 'unavailable' }));
};

export const subscribeToPaidUsers = (onUsers, onError) => {
  const paidQuery = query(subscriptionsCollection, where('status', '==', 'active'), limit(50));
  return onSnapshot(paidQuery, (snapshot) => {
    onUsers(snapshot.docs.map((subscriptionDoc) => ({ uid: subscriptionDoc.id, ...subscriptionDoc.data() })));
  }, onError);
};

export const startPresence = (firebaseUser) => {
  if (!firebaseUser || typeof window === 'undefined') return () => {};

  const presenceRef = doc(presenceCollection, firebaseUser.uid);
  const updatePresence = () => setDoc(presenceRef, {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || 'Solar User',
    lastActiveAt: Date.now(),
  }, { merge: true }).catch(() => {});

  updatePresence();
  const intervalId = window.setInterval(updatePresence, 60 * 1000);
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') updatePresence();
  };
  const handleUnload = () => {
    deleteDoc(presenceRef).catch(() => {});
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('pagehide', handleUnload);

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleUnload);
    window.removeEventListener('pagehide', handleUnload);
    deleteDoc(presenceRef).catch(() => {});
  };
};

export const subscribeToActiveUsers = (onUsers, onError) => {
  const presenceQuery = query(presenceCollection, limit(50));
  return onSnapshot(presenceQuery, (snapshot) => {
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
    const active = snapshot.docs
      .map((presenceDoc) => presenceDoc.data())
      .filter((u) => (u.lastActiveAt || 0) >= twoMinutesAgo);
    onUsers(active);
  }, onError);
};

export const subscribeToSupportTickets = (onTickets, onError) => {
  const ticketsQuery = query(supportTicketsCollection, limit(50));
  return onSnapshot(ticketsQuery, (snapshot) => {
    const tickets = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    onTickets(tickets);
  }, onError);
};

export const updateTicketStatus = (ticketId, status) => {
  return updateDoc(doc(db, 'supportTickets', ticketId), { status, updatedAt: Date.now() });
};

export const clearChatHistory = (userId) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (userId) {
        window.localStorage.removeItem(`solar_pulse_chat_${userId}`);
      }
      window.localStorage.removeItem('solar_pulse_chat_guest');
    }
  } catch (_) {}
};

/**
 * Account deletion:
 * 1. Calls the server-side deleteMyData() callable function to purge all backend records
 *    (subscriptions, pending transactions, support tickets, presence, project data).
 * 2. Purges local cached data and chatbot history.
 * 3. Deletes the Firebase Auth user object.
 */
export const deleteUserAccount = async (firebaseUser) => {
  if (!firebaseUser) throw new Error('No user is currently signed in.');
  const uid = firebaseUser.uid;

  // 1. Call server-side function to purge all database records
  try {
    await callDeleteMyData();
  } catch (err) {
    console.warn('Server deleteMyData encountered an error, proceeding with client cleanup:', err);
    try { await deleteDoc(doc(presenceCollection, uid)); } catch (_) {}
    try { await deleteDoc(doc(db, 'users', uid, 'projects', 'primary')); } catch (_) {}
    try { await deleteDoc(doc(db, 'users', uid)); } catch (_) {}
  }

  // 2. Clear local storage history
  clearChatHistory(uid);

  // 3. Delete Firebase Auth account
  await deleteUser(firebaseUser);
};

export const saveSolarProject = (firebaseUser, project) => {
  if (!firebaseUser) return Promise.reject(new Error('You must be signed in to save a project.'));
  return setDoc(doc(db, 'users', firebaseUser.uid, 'projects', 'primary'), {
    ...project,
    updatedAt: Date.now(),
  }, { merge: true });
};

export const loadSolarProject = async (firebaseUser) => {
  if (!firebaseUser) return null;
  const projectSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid, 'projects', 'primary'));
  return projectSnapshot.exists() ? projectSnapshot.data() : null;
};

/**
 * Avatar management:
 * Stored as a URL in users/{uid}.avatarUrl or fallback thumbnail.
 * If Storage is available, uploads to avatars/{uid} and stores public download URL.
 */
export const saveUserAvatar = async (firebaseUser, fileOrBlob, fallbackBase64) => {
  if (!firebaseUser) throw new Error('Must be signed in.');
  let avatarUrl = fallbackBase64;

  if (fileOrBlob && storage) {
    try {
      const avatarRef = ref(storage, `avatars/${firebaseUser.uid}.jpg`);
      await uploadBytes(avatarRef, fileOrBlob, { contentType: 'image/jpeg' });
      avatarUrl = await getDownloadURL(avatarRef);
    } catch (storageErr) {
      console.warn('Firebase Storage upload unavailable, saving thumbnail to Firestore:', storageErr);
      avatarUrl = fallbackBase64;
    }
  }

  // Update user document
  await setDoc(doc(db, 'users', firebaseUser.uid), {
    avatarUrl,
    updatedAt: Date.now(),
  }, { merge: true });

  // Update Auth profile photoURL ONLY if it's a valid HTTP URL (Firebase Auth rejects long base64 strings)
  if (avatarUrl && avatarUrl.startsWith('http')) {
    await updateProfile(firebaseUser, { photoURL: avatarUrl }).catch(() => {});
  }

  return avatarUrl;
};

export const loadUserAvatar = async (firebaseUser) => {
  if (!firebaseUser) return null;
  const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
  if (snap.exists()) {
    const data = snap.data();
    return data.avatarUrl || data.avatarBase64 || null;
  }
  return null;
};

export const removeUserAvatar = async (firebaseUser) => {
  if (!firebaseUser) throw new Error('Must be signed in.');
  await setDoc(doc(db, 'users', firebaseUser.uid), { avatarUrl: null, avatarBase64: null, updatedAt: Date.now() }, { merge: true });
  await updateProfile(firebaseUser, { photoURL: '' }).catch(() => {});
};

export const toAppUser = (firebaseUser) => {
  if (!firebaseUser) return null;

  return {
    ...firebaseUser,
    id: firebaseUser.uid,
    created_at: firebaseUser.metadata.creationTime,
    user_metadata: {
      full_name: firebaseUser.displayName,
      avatar_url: firebaseUser.photoURL,
    },
  };
};
