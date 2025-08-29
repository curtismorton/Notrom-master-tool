import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Default configuration for development
const defaultConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "demo-app-id",
};

// Check if running in server context (Node.js) vs client context
const isServer = typeof window === 'undefined';

// Helper function to safely get environment variables
const getEnvVar = (key: string, defaultValue: string = '') => {
  if (isServer) return defaultValue;
  return (import.meta.env as any)?.[key] || defaultValue;
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', defaultConfig.apiKey),
  authDomain: `${getEnvVar('VITE_FIREBASE_PROJECT_ID', 'demo-project')}.firebaseapp.com`,
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', defaultConfig.projectId),
  storageBucket: `${getEnvVar('VITE_FIREBASE_PROJECT_ID', 'demo-project')}.firebasestorage.app`,
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', defaultConfig.messagingSenderId),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', defaultConfig.appId),
};

// For demo mode - create completely disabled Firebase instances
const createDemoFirebaseInstance = () => ({
  // Mock auth methods to prevent connection attempts
  onAuthStateChanged: () => () => {}, // Returns unsubscribe function
  signInWithEmailAndPassword: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
  currentUser: null
});

const createDemoFirestore = () => ({
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ exists: false, data: () => null }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    })
  })
});

// Completely disabled Firebase services for demo mode
export const auth = isServer ? null : createDemoFirebaseInstance();
export const db = isServer ? null : createDemoFirestore();  
export const functions = null;
export const storage = null;

// Skip Firebase initialization completely
console.log('Firebase completely disabled - demo mode active');

// No emulators needed in demo mode
export default null;
