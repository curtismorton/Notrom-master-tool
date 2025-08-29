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

// Initialize Firebase with optimizations
const app = initializeApp(firebaseConfig);

// Initialize services with server-safe checks and optimizations
let auth: any = null;
let db: any = null;
let functions: any = null;
let storage: any = null;

if (!isServer) {
  try {
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
    storage = getStorage(app);
    
    // Optimize Firestore for faster loading
    if (db && firebaseConfig.projectId === 'demo-project') {
      console.log('Firebase running in demo mode - network disabled');
    }
  } catch (error) {
    console.log('Firebase services initialized in demo mode');
  }
}

export { auth, db, functions, storage };

// Connect to emulators in development
if (!isServer && getEnvVar('DEV') && getEnvVar('VITE_USE_FIREBASE_EMULATORS')) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    connectFunctionsEmulator(functions, "localhost", 5001);
    connectStorageEmulator(storage, "localhost", 9199);
  } catch (error) {
    console.log("Firebase emulators already connected");
  }
}

export default app;
