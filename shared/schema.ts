// Firebase-based schema definitions for Notrom Master Tool
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'client';
  clientId?: string;
  stripeCustomerId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  notes: string;
  leadFingerprint: string;
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  score: number;
  status: 'new' | 'qualified' | 'discovery_booked' | 'proposal_sent' | 'won' | 'lost';
  bookedMeetingId?: string;
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
  deletedAt?: number;
}

export interface Client {
  id: string;
  company: string;
  legalName: string;
  vat?: string;
  contacts: Array<{
    name: string;
    email: string;
    phone: string;
    role: string;
  }>;
  billingEmail: string;
  plan: 'none' | 'care_basic' | 'care_plus' | 'care_pro';
  stripeCustomerId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  clientId: string;
  package: 'starter' | 'standard' | 'premium';
  tech: 'nextjs_vercel' | 'framer';
  status: 'intake' | 'copy' | 'design' | 'build' | 'qa' | 'review' | 'live' | 'closed';
  repoUrl?: string;
  stagingUrl?: string;
  productionUrl?: string;
  milestones: {
    intakeDate?: number;
    copyDate?: number;
    designDate?: number;
    buildDate?: number;
    qaDate?: number;
    reviewDate?: number;
    liveDate?: number;
  };
  clientNotes?: string;
  internalNotes?: string;
  launchChecklistStatus: Record<string, boolean>;
  createdAt: number;
  updatedAt: number;
}

export interface Proposal {
  id: string;
  clientId?: string;
  leadId?: string;
  package: 'starter' | 'standard' | 'premium';
  price: number;
  currency: string;
  status: 'draft' | 'sent' | 'signed' | 'declined';
  pdfUrl?: string;
  signatureStatus?: 'pending' | 'signed';
  signedAt?: number;
  version: number;
  proposalNumber: string;
  createdAt: number;
  updatedAt: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  projectId?: string;
  amount: number;
  currency: string;
  type: 'deposit' | 'milestone' | 'care';
  stripeInvoiceId?: string;
  stripePaymentLink?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: number;
  createdAt: number;
  updatedAt: number;
}

export interface Subscription {
  id: string;
  clientId: string;
  plan: 'care_basic' | 'care_plus' | 'care_pro';
  stripeSubscriptionId?: string;
  status: 'active' | 'on_hold' | 'canceled';
  trialEndsAt?: number;
  lastInvoiceStatus?: string;
  currentPeriodEnd: number;
  createdAt: number;
  updatedAt: number;
}

export interface Meeting {
  id: string;
  leadId?: string;
  clientId?: string;
  type: 'discovery' | 'kickoff' | 'review';
  startTime: number;
  endTime: number;
  timezone: string;
  videoUrl?: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  aiSummary?: string;
  actionItems: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Asset {
  id: string;
  clientId?: string;
  projectId?: string;
  kind: 'logo' | 'brand_guide' | 'copy' | 'media' | 'transcript' | 'proposal' | 'report';
  storagePath?: string;
  externalUrl?: string;
  status: 'draft' | 'approved' | 'rejected';
  pageSlug?: string;
  createdAt: number;
}

export interface Ticket {
  id: string;
  clientId: string;
  projectId?: string;
  subject: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'waiting' | 'closed';
  slaDueAt: number;
  lastCustomerReplyAt?: number;
  lastAgentReplyAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface AuditLog {
  id: string;
  at: number;
  byUid: string;
  action: string;
  payloadHash: string;
}

// Stats and analytics types
export interface DashboardStats {
  activeProjects: number;
  monthlyRevenue: number;
  newLeads: number;
  careSubscriptions: number;
}

export interface Activity {
  id: string;
  message: string;
  timestamp: number;
  type: 'project' | 'payment' | 'lead' | 'support';
  userId?: string;
  clientId?: string;
  projectId?: string;
}

// Website Planning Types
export interface WebsiteBrief {
  id: string;
  clientId: string;
  projectId?: string;
  businessName: string;
  industry: string;
  targetAudience: string;
  goals: string[];
  competitors: string[];
  brandPersonality: string;
  preferredColors: string[];
  contentNeeds: string[];
  specialRequirements: string;
  createdAt: number;
  updatedAt: number;
}

export interface WebsitePlan {
  id: string;
  briefId: string;
  copyPlan: {
    homepage: {
      headline: string;
      subheadline: string;
      heroDescription: string;
      ctaText: string;
    };
    about: {
      story: string;
      mission: string;
      values: string[];
    };
    services: Array<{
      name: string;
      description: string;
      benefits: string[];
    }>;
    testimonials: {
      strategy: string;
      sampleQuestions: string[];
    };
  };
  assetRequirements: {
    photography: string[];
    graphics: string[];
    videos: string[];
    documents: string[];
  };
  contentStrategy: {
    brandVoice: string;
    tonalGuidelines: string[];
    messagingPillars: string[];
    contentPriorities: string[];
  };
  technicalSpecs: {
    features: string[];
    integrations: string[];
    performanceTargets: string[];
  };
  status: 'draft' | 'review' | 'approved';
  createdAt: number;
  updatedAt: number;
}
