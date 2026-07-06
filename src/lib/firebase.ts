import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom databaseId if provided
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Initialize Firebase Auth
const auth = getAuth(app);

export { app, db, auth };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Collection References Helper
export const COLLECTIONS = {
  USERS: 'users',
  VIDEOS: 'videos',
  BANNERS: 'banners',
  REQUESTS: 'requests',
  FEEDBACKS: 'feedbacks',
  NOTIFICATIONS: 'notifications',
  CONFIG: 'config'
};

// Default Preset Data for fallback or initial population
export const PRESET_VIDEOS = [];

export const PRESET_BANNERS = [
  {
    id: 'b1',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    title: 'Master YouTube Growth and Audience Building!',
    videoUrl: 'https://www.youtube.com/watch?v=gT8v376b328',
    createdAt: new Date().toISOString()
  },
  {
    id: 'b2',
    imageUrl: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&auto=format&fit=crop&q=80',
    title: 'Ultimate YouTube Grow Lessons 2026',
    videoUrl: 'https://www.youtube.com/watch?v=VPvVD8t02U8',
    createdAt: new Date().toISOString()
  }
];

export const PRESET_NOTIFICATIONS = [
  {
    id: 'n1',
    title: '🔥 New Video: YouTube Algorithm Secrets 2026',
    message: 'Learn how to trigger recommended videos and grow your subscriber base.',
    type: 'New Video',
    sentAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
  },
  {
    id: 'n2',
    title: '📢 Weekly Q&A Session Tonight!',
    message: 'Join us live on YouTube at 8 PM for interactive requests and growth reviews.',
    type: 'Live Stream',
    sentAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
  }
];

// Seed initial Firebase data if empty
export async function seedInitialDataIfNecessary() {
  try {
    // Check if configuration exists
    const configDoc = await getDoc(doc(db, COLLECTIONS.CONFIG, 'global'));
    if (!configDoc.exists()) {
      await setDoc(doc(db, COLLECTIONS.CONFIG, 'global'), {
        subscriberGoal: 10000,
        currentSubscribers: 8645
      });
    }

    // Check if videos exist
    const videosSnap = await getDocs(query(collection(db, COLLECTIONS.VIDEOS), limit(1)));
    if (videosSnap.empty) {
      for (const video of PRESET_VIDEOS) {
        await setDoc(doc(db, COLLECTIONS.VIDEOS, video.id), video);
      }
    }

    // Check if banners exist
    const bannersSnap = await getDocs(query(collection(db, COLLECTIONS.BANNERS), limit(1)));
    if (bannersSnap.empty) {
      for (const banner of PRESET_BANNERS) {
        await setDoc(doc(db, COLLECTIONS.BANNERS, banner.id), banner);
      }
    }

    // Check if notifications exist
    const notifSnap = await getDocs(query(collection(db, COLLECTIONS.NOTIFICATIONS), limit(1)));
    if (notifSnap.empty) {
      for (const notif of PRESET_NOTIFICATIONS) {
        await setDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notif.id), notif);
      }
    }
  } catch (err) {
    console.warn('Could not seed database. Firestore rule or network limitation may apply.', err);
  }
}
