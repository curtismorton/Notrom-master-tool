import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';
import { db } from './firebase';
import type { 
  User, 
  Lead, 
  Client, 
  Project, 
  Proposal, 
  Invoice, 
  Subscription, 
  Meeting, 
  Asset, 
  Ticket, 
  AuditLog,
  Activity,
  DashboardStats
} from '@shared/schema';

// Collection references
export const usersCollection = collection(db, 'users') as CollectionReference<User>;
export const leadsCollection = collection(db, 'leads') as CollectionReference<Lead>;
export const clientsCollection = collection(db, 'clients') as CollectionReference<Client>;
export const projectsCollection = collection(db, 'projects') as CollectionReference<Project>;
export const proposalsCollection = collection(db, 'proposals') as CollectionReference<Proposal>;
export const invoicesCollection = collection(db, 'invoices') as CollectionReference<Invoice>;
export const subscriptionsCollection = collection(db, 'subscriptions') as CollectionReference<Subscription>;
export const meetingsCollection = collection(db, 'meetings') as CollectionReference<Meeting>;
export const assetsCollection = collection(db, 'assets') as CollectionReference<Asset>;
export const ticketsCollection = collection(db, 'tickets') as CollectionReference<Ticket>;
export const logsCollection = collection(db, 'logs') as CollectionReference<AuditLog>;
export const activitiesCollection = collection(db, 'activities') as CollectionReference<Activity>;

// User operations
export const getUserById = async (id: string): Promise<User | null> => {
  const docRef = doc(usersCollection, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const createUser = async (userData: Omit<User, 'id'>): Promise<string> => {
  const docRef = await addDoc(usersCollection, userData);
  return docRef.id;
};

// Lead operations
export const getLeads = async (filters?: { status?: string; limit?: number }) => {
  let q = query(leadsCollection, where('isDeleted', '==', false), orderBy('createdAt', 'desc'));
  
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  if (filters?.limit) {
    q = query(q, limit(filters.limit));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createLead = async (leadData: Omit<Lead, 'id'>): Promise<string> => {
  const docRef = await addDoc(leadsCollection, leadData);
  return docRef.id;
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<void> => {
  const docRef = doc(leadsCollection, id);
  await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
};

// Client operations
export const getClients = async (limit?: number) => {
  let q = query(clientsCollection, orderBy('createdAt', 'desc'));
  
  if (limit) {
    q = query(q, limit);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getClientById = async (id: string): Promise<Client | null> => {
  const docRef = doc(clientsCollection, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const createClient = async (clientData: Omit<Client, 'id'>): Promise<string> => {
  const docRef = await addDoc(clientsCollection, clientData);
  return docRef.id;
};

// Project operations
export const getProjects = async (clientId?: string, statuses?: string[]) => {
  let q = query(projectsCollection, orderBy('updatedAt', 'desc'));
  
  if (clientId) {
    q = query(q, where('clientId', '==', clientId));
  }
  
  if (statuses && statuses.length > 0) {
    q = query(q, where('status', 'in', statuses));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createProject = async (projectData: Omit<Project, 'id'>): Promise<string> => {
  const docRef = await addDoc(projectsCollection, projectData);
  return docRef.id;
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
  const docRef = doc(projectsCollection, id);
  await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
};

// Activity operations
export const getRecentActivities = async (limit: number = 10) => {
  const q = query(activitiesCollection, orderBy('timestamp', 'desc'), limit);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createActivity = async (activityData: Omit<Activity, 'id'>): Promise<string> => {
  const docRef = await addDoc(activitiesCollection, activityData);
  return docRef.id;
};

// Dashboard stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  // This would typically be calculated server-side or cached
  // For now, we'll do basic queries
  const [activeProjects, newLeads, careSubscriptions] = await Promise.all([
    getDocs(query(projectsCollection, where('status', 'in', ['intake', 'copy', 'design', 'build', 'qa', 'review']))),
    getDocs(query(leadsCollection, where('status', '==', 'new'), where('isDeleted', '==', false))),
    getDocs(query(subscriptionsCollection, where('status', '==', 'active')))
  ]);

  return {
    activeProjects: activeProjects.size,
    monthlyRevenue: 47000, // This should come from Stripe/invoice aggregation
    newLeads: newLeads.size,
    careSubscriptions: careSubscriptions.size
  };
};

// Real-time subscriptions
export const subscribeToProjects = (callback: (projects: Project[]) => void, clientId?: string) => {
  let q = query(projectsCollection, orderBy('updatedAt', 'desc'));
  
  if (clientId) {
    q = query(q, where('clientId', '==', clientId));
  }

  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(projects);
  });
};

export const subscribeToActivities = (callback: (activities: Activity[]) => void) => {
  const q = query(activitiesCollection, orderBy('timestamp', 'desc'), limit(10));
  
  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(activities);
  });
};
