import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { collection, deleteDoc, doc, getDoc, getFirestore, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCQ9TqTeLNWX7AUCx10GVNSqu-EA8A_8ec',
  authDomain: 'solar-pulse1.firebaseapp.com',
  projectId: 'solar-pulse1',
  storageBucket: 'solar-pulse1.firebasestorage.app',
  messagingSenderId: '470677429490',
  appId: '1:470677429490:web:eab2494cb023de37a2c46b',
  measurementId: 'G-F59KS47808',
};

const app = initializeApp(firebaseConfig);
export const ADMIN_EMAIL = 'odumesamuel52@gmail.com';
export const storage = getStorage(app);
export const db = getFirestore(app);

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}

export const auth = getAuth(app);
export {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
};
export { getDownloadURL, ref, uploadBytes };

const presenceCollection = collection(db, 'presence');
const subscriptionsCollection = collection(db, 'subscriptions');

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
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    deleteDoc(presenceRef).catch(() => {});
  };
};

export const subscribeToActiveUsers = (onUsers, onError) => {
  const activeSince = Date.now() - (2 * 60 * 1000);
  const activeQuery = query(presenceCollection, where('lastActiveAt', '>=', activeSince));
  return onSnapshot(activeQuery, (snapshot) => {
    onUsers(snapshot.docs.map((presenceDoc) => presenceDoc.data()));
  }, onError);
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
