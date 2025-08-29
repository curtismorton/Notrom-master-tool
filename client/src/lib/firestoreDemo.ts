// Demo Firestore functions that return mock data for development
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

// Mock data for demo purposes
const mockUsers: User[] = [
  {
    id: 'demo-admin-1',
    email: 'admin@demo.com',
    name: 'Demo Admin',
    role: 'admin',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now()
  }
];

const mockLeads: Lead[] = [
  {
    id: 'lead-1',
    name: 'John Smith',
    company: 'Acme Corp',
    email: 'john@acme.com',
    phone: '+1-555-0123',
    source: 'website',
    status: 'new',
    score: 85,
    leadFingerprint: 'mock-fingerprint-1',
    utm: {},
    notes: 'Interested in e-commerce site',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
    isDeleted: false
  },
  {
    id: 'lead-2', 
    name: 'Sarah Johnson',
    company: 'TechStart Inc',
    email: 'sarah@techstart.com',
    phone: '+1-555-0456',
    source: 'referral',
    status: 'qualified',
    score: 92,
    leadFingerprint: 'mock-fingerprint-2',
    utm: {},
    notes: 'Needs mobile app development',
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now(),
    isDeleted: false
  }
];

const mockClients: Client[] = [
  {
    id: 'client-1',
    company: 'Demo Business Ltd',
    legalName: 'Demo Business Limited',
    contacts: [
      {
        name: 'Jane Doe',
        email: 'jane@demo-business.com',
        phone: '+1-555-0789',
        role: 'CEO'
      }
    ],
    billingEmail: 'billing@demo-business.com',
    plan: 'care_basic',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now()
  }
];

const mockProjects: Project[] = [
  {
    id: 'project-1',
    clientId: 'client-1',
    package: 'standard',
    tech: 'nextjs_vercel',
    status: 'build',
    milestones: {
      intakeDate: Date.now() - 86400000 * 14,
      copyDate: Date.now() - 86400000 * 10,
      designDate: Date.now() - 86400000 * 7,
      buildDate: Date.now() - 86400000 * 3
    },
    launchChecklistStatus: {},
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now()
  }
];

const mockActivities: Activity[] = [
  {
    id: 'activity-1',
    message: 'New lead John Smith added to pipeline',
    timestamp: Date.now() - 1800000,
    type: 'lead',
    userId: 'demo-admin-1'
  },
  {
    id: 'activity-2',
    message: 'Project "E-commerce Website" progress updated to 65%',
    timestamp: Date.now() - 3600000, 
    type: 'project',
    userId: 'demo-admin-1'
  }
];

const mockStats: DashboardStats = {
  leadsThisMonth: 12,
  activeProjects: 5,
  monthlyRevenue: 47500,
  clientRetentionRate: 92
};

// Mock functions that simulate Firestore operations
export async function getUserById(id: string): Promise<User | null> {
  return mockUsers.find(user => user.id === id) || null;
}

export async function createUser(userData: User): Promise<void> {
  mockUsers.push(userData);
}

export async function getLeads(): Promise<Lead[]> {
  return mockLeads.filter(lead => !lead.isDeleted);
}

export async function getClients(): Promise<Client[]> {
  return mockClients;
}

export async function getProjects(): Promise<Project[]> {
  return mockProjects;
}

export async function getActivities(): Promise<Activity[]> {
  return mockActivities;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return mockStats;
}

export async function createLead(leadData: Omit<Lead, 'id'>): Promise<string> {
  const newLead: Lead = {
    ...leadData,
    id: `lead-${Date.now()}`,
  };
  mockLeads.push(newLead);
  return newLead.id;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  const leadIndex = mockLeads.findIndex(lead => lead.id === id);
  if (leadIndex >= 0) {
    mockLeads[leadIndex] = { ...mockLeads[leadIndex], ...updates, updatedAt: Date.now() };
  }
}

export async function deleteLead(id: string): Promise<void> {
  const leadIndex = mockLeads.findIndex(lead => lead.id === id);
  if (leadIndex >= 0) {
    mockLeads[leadIndex] = { ...mockLeads[leadIndex], isDeleted: true, updatedAt: Date.now() };
  }
}

// Mock collection references (not used in demo mode)
export const usersCollection = null;
export const leadsCollection = null;
export const clientsCollection = null;
export const projectsCollection = null;
export const proposalsCollection = null;
export const invoicesCollection = null;
export const subscriptionsCollection = null;
export const meetingsCollection = null;
export const assetsCollection = null;
export const ticketsCollection = null;
export const logsCollection = null;
export const activitiesCollection = null;