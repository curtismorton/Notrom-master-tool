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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

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
