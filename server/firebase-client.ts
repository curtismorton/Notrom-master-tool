import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';

let functions: Functions | null = null;

const projectId = process.env.FIREBASE_PROJECT_ID;
const apiKey = process.env.FIREBASE_API_KEY;

if (projectId && apiKey) {
  const firebaseConfig = {
    apiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: `${projectId}.appspot.com`,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };

  const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  functions = getFunctions(app);

  if (process.env.FIREBASE_FUNCTIONS_EMULATOR === 'true') {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }
} else {
  console.log('Firebase functions not configured - running in demo mode');
}

export { functions };
export default functions;
