import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';

let functions: Functions | null = null;

const apiKey = process.env.FIREBASE_API_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID;
const appId = process.env.FIREBASE_APP_ID;
const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID;

if (apiKey && projectId && appId && messagingSenderId) {
  let app: FirebaseApp;
  if (!getApps().length) {
    app = initializeApp({
      apiKey,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: `${projectId}.appspot.com`,
      appId,
      messagingSenderId,
    });
  } else {
    app = getApps()[0];
  }

  functions = getFunctions(app);

  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    const host = process.env.FUNCTIONS_EMULATOR_HOST || 'localhost';
    const port = Number(process.env.FUNCTIONS_EMULATOR_PORT || 5001);
    connectFunctionsEmulator(functions, host, port);
  }
} else {
  console.warn('Firebase environment variables are not set. Firebase Functions will be disabled.');
}

export { functions };
