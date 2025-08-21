import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch (error) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format. Must be valid JSON.');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  });
}

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();

// Custom claims helper
export async function setUserRole(uid: string, role: 'admin' | 'staff' | 'client', clientId?: string) {
  const customClaims: { role: string; clientId?: string } = { role };
  if (clientId) {
    customClaims.clientId = clientId;
  }
  
  await auth.setCustomUserClaims(uid, customClaims);
}

// Verify auth token with custom claims
export async function verifyAuthToken(idToken: string) {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'client',
      clientId: decodedToken.clientId,
    };
  } catch (error) {
    throw new Error('Invalid authentication token');
  }
}

// Audit logging helper
export async function logActivity(activity: {
  byUid: string;
  action: string;
  payload: any;
  clientId?: string;
  projectId?: string;
}) {
  const payloadHash = Buffer.from(JSON.stringify(activity.payload)).toString('base64');
  
  await db.collection('logs').add({
    at: Date.now(),
    byUid: activity.byUid,
    action: activity.action,
    payloadHash,
    clientId: activity.clientId,
    projectId: activity.projectId,
  });

  // Also create activity for dashboard
  await db.collection('activities').add({
    message: `${activity.action} by ${activity.byUid}`,
    timestamp: Date.now(),
    type: getActivityType(activity.action),
    userId: activity.byUid,
    clientId: activity.clientId,
    projectId: activity.projectId,
  });
}

function getActivityType(action: string): 'project' | 'payment' | 'lead' | 'support' {
  if (action.includes('project') || action.includes('launch')) return 'project';
  if (action.includes('payment') || action.includes('invoice')) return 'payment';
  if (action.includes('lead') || action.includes('proposal')) return 'lead';
  if (action.includes('ticket') || action.includes('support')) return 'support';
  return 'project';
}

export default admin;
