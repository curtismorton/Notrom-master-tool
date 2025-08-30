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
      buildDate: Date.now() - 86400000 * 3,
      liveDate: Date.now() + 86400000 * 7
    },
    launchChecklistStatus: {},
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now()
  },
  {
    id: 'project-2',
    clientId: 'client-2',
    package: 'premium',
    tech: 'nextjs_vercel',
    status: 'design',
    milestones: {
      intakeDate: Date.now() - 86400000 * 7,
      copyDate: Date.now() - 86400000 * 3,
      designDate: Date.now(),
      liveDate: Date.now() + 86400000 * 14
    },
    launchChecklistStatus: {},
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now()
  },
  {
    id: 'project-3',
    clientId: 'client-3',
    package: 'starter',
    tech: 'framer',
    status: 'qa',
    milestones: {
      intakeDate: Date.now() - 86400000 * 21,
      copyDate: Date.now() - 86400000 * 17,
      designDate: Date.now() - 86400000 * 14,
      buildDate: Date.now() - 86400000 * 7,
      qaDate: Date.now() - 86400000 * 2,
      liveDate: Date.now() + 86400000 * 3
    },
    launchChecklistStatus: {},
    createdAt: Date.now() - 86400000 * 21,
    updatedAt: Date.now()
  }
];

const mockActivities: Activity[] = [
  {
    id: 'activity-1',
    message: 'New lead <strong>John Smith</strong> from Acme Corp added to pipeline',
    timestamp: Date.now() - 1800000,
    type: 'lead',
    userId: 'demo-admin-1'
  },
  {
    id: 'activity-2',
    message: 'Project <strong>#project-1</strong> moved to development phase',
    timestamp: Date.now() - 3600000, 
    type: 'project',
    userId: 'demo-admin-1'
  },
  {
    id: 'activity-3',
    message: 'Payment received for <strong>Demo Business Ltd</strong> - $2,500',
    timestamp: Date.now() - 7200000,
    type: 'payment',
    userId: 'demo-admin-1'
  },
  {
    id: 'activity-4',
    message: 'New support ticket opened for <strong>TechStart Inc</strong>',
    timestamp: Date.now() - 10800000,
    type: 'support',
    userId: 'demo-admin-1'
  },
  {
    id: 'activity-5',
    message: 'Lead <strong>Sarah Johnson</strong> qualified and moved to discovery',
    timestamp: Date.now() - 14400000,
    type: 'lead',
    userId: 'demo-admin-1'
  }
];

const mockStats: DashboardStats = {
  activeProjects: 5,
  monthlyRevenue: 47500,
  newLeads: 12,
  careSubscriptions: 8
};

// Mock functions that simulate Firestore operations
export async function getUserById(id: string): Promise<User | null> {
  return mockUsers.find(user => user.id === id) || null;
}

export async function createUser(userData: User): Promise<void> {
  mockUsers.push(userData);
}

export async function getLeads(filters?: { status?: string; limit?: number }): Promise<Lead[]> {
  let filteredLeads = mockLeads.filter(lead => !lead.isDeleted);
  
  if (filters?.status) {
    filteredLeads = filteredLeads.filter(lead => lead.status === filters.status);
  }
  
  if (filters?.limit) {
    filteredLeads = filteredLeads.slice(0, filters.limit);
  }
  
  return filteredLeads;
}

export async function getClients(): Promise<Client[]> {
  return mockClients;
}

export async function getProjects(clientId?: string, statuses?: string[]): Promise<Project[]> {
  let filteredProjects = mockProjects;
  
  if (clientId) {
    filteredProjects = filteredProjects.filter(project => project.clientId === clientId);
  }
  
  if (statuses && statuses.length > 0) {
    filteredProjects = filteredProjects.filter(project => statuses.includes(project.status));
  }
  
  return filteredProjects;
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