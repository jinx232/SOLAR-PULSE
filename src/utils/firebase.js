import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { collection, deleteDoc, doc, getDoc, getFirestore, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
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
export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@solarpulse.io').toLowerCase();
export const storage = getStorage(app);
export const db = getFirestore(app);

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
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

export const isAdminUser = (firebaseUser) => firebaseUser?.email?.toLowerCase() === ADMIN_EMAIL;

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
  const paidQuery = query(subscriptionsCollection, where('status', '==', 'active'));
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
  return onSnapshot(presenceCollection, (snapshot) => {
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
    const active = snapshot.docs
      .map((presenceDoc) => presenceDoc.data())
      .filter((u) => (u.lastActiveAt || 0) >= twoMinutesAgo);
    onUsers(active);
  }, onError);
};

export const subscribeToSupportTickets = (onTickets, onError) => {
  return onSnapshot(supportTicketsCollection, (snapshot) => {
    const tickets = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    onTickets(tickets);
  }, onError);
};

export const updateTicketStatus = (ticketId, status) => {
  return updateDoc(doc(db, 'supportTickets', ticketId), { status, updatedAt: Date.now() });
};

export const deleteUserAccount = async (firebaseUser) => {
  if (!firebaseUser) throw new Error('No user is currently signed in.');
  try { await deleteDoc(doc(presenceCollection, firebaseUser.uid)); } catch (_) {}
  try { await deleteDoc(doc(db, 'users', firebaseUser.uid, 'projects', 'primary')); } catch (_) {}
  try { await deleteDoc(doc(db, 'users', firebaseUser.uid)); } catch (_) {}
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

// Avatar stored as base64 in Firestore — bypasses Storage restrictions entirely.
export const saveUserAvatar = async (firebaseUser, base64DataUrl) => {
  if (!firebaseUser) throw new Error('Must be signed in.');
  await setDoc(doc(db, 'users', firebaseUser.uid), { avatarBase64: base64DataUrl, updatedAt: Date.now() }, { merge: true });
  return base64DataUrl;
};

export const loadUserAvatar = async (firebaseUser) => {
  if (!firebaseUser) return null;
  const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
  return snap.exists() ? (snap.data().avatarBase64 || null) : null;
};

export const removeUserAvatar = async (firebaseUser) => {
  if (!firebaseUser) throw new Error('Must be signed in.');
  await setDoc(doc(db, 'users', firebaseUser.uid), { avatarBase64: null, updatedAt: Date.now() }, { merge: true });
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
