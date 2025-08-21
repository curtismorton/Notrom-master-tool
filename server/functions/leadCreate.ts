import { https } from 'firebase-functions/v2';
import { setGlobalOptions } from 'firebase-functions/v2';
import { db, logActivity } from '../firebase-admin';
import { z } from 'zod';
import { createHash } from 'crypto';

// Set global options for all functions
setGlobalOptions({
  region: 'europe-west2', // GDPR compliance
  maxInstances: 100,
});

const leadCreateSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.string(),
  notes: z.string().optional(),
  utm: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
  }).optional(),
  budgetRange: z.string().optional(),
  projectType: z.string().optional(),
  timeline: z.string().optional(),
});

export const leadCreate = https.onCall(async (request) => {
  try {
    // Validate request data
    const validatedData = leadCreateSchema.parse(request.data);
    
    // Create lead fingerprint to prevent duplicates
    const leadFingerprint = createHash('md5')
      .update(`${validatedData.email.toLowerCase()}-${validatedData.company.toLowerCase()}`)
      .digest('hex');

    // Check for existing lead with same fingerprint
    const existingLeads = await db.collection('leads')
      .where('leadFingerprint', '==', leadFingerprint)
      .where('isDeleted', '==', false)
      .get();

    if (!existingLeads.empty) {
      throw new https.HttpsError('already-exists', 'A lead with this email and company already exists');
    }

    // Calculate lead score based on various factors
    const score = calculateLeadScore(validatedData);

    // Create lead document
    const leadData = {
      ...validatedData,
      leadFingerprint,
      score,
      status: 'new' as const,
      utm: validatedData.utm || {},
      notes: `${validatedData.notes || ''}\n${validatedData.budgetRange ? `Budget: ${validatedData.budgetRange}` : ''}\n${validatedData.projectType ? `Type: ${validatedData.projectType}` : ''}\n${validatedData.timeline ? `Timeline: ${validatedData.timeline}` : ''}`.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDeleted: false,
    };

    const leadRef = await db.collection('leads').add(leadData);

    // Log activity
    await logActivity({
      byUid: 'system',
      action: 'lead_created',
      payload: { leadId: leadRef.id, source: validatedData.source },
    });

    // Send welcome email with booking link (would integrate with email service)
    await scheduleFollowUpEmail(leadRef.id, validatedData.email, validatedData.name);

    // Auto-qualify high-scoring leads
    if (score >= 80) {
      await db.collection('leads').doc(leadRef.id).update({
        status: 'qualified',
        updatedAt: Date.now(),
      });

      // Notify team of high-value lead
      await sendTeamNotification(leadRef.id, validatedData);
    }

    return {
      success: true,
      leadId: leadRef.id,
      score,
      message: 'Lead created successfully',
    };
  } catch (error) {
    console.error('Lead creation error:', error);
    
    if (error instanceof z.ZodError) {
      throw new https.HttpsError('invalid-argument', 'Invalid lead data provided');
    }
    
    if (error instanceof https.HttpsError) {
      throw error;
    }
    
    throw new https.HttpsError('internal', 'Failed to create lead');
  }
});

function calculateLeadScore(leadData: any): number {
  let score = 50; // Base score

  // Budget range scoring
  const budgetMultipliers: Record<string, number> = {
    '5k-10k': 1.0,
    '10k-25k': 1.2,
    '25k-50k': 1.5,
    '50k-100k': 1.8,
    '100k+': 2.0,
  };
  
  if (leadData.budgetRange && budgetMultipliers[leadData.budgetRange]) {
    score *= budgetMultipliers[leadData.budgetRange];
  }

  // Timeline urgency
  const timelineBonus: Record<string, number> = {
    'asap': 15,
    '1-2weeks': 10,
    '1month': 5,
    '2-3months': 0,
    'flexible': -5,
  };
  
  if (leadData.timeline && timelineBonus[leadData.timeline] !== undefined) {
    score += timelineBonus[leadData.timeline];
  }

  // Source quality
  const sourceMultipliers: Record<string, number> = {
    'referral': 1.3,
    'linkedin': 1.2,
    'website': 1.1,
    'google': 1.0,
    'facebook': 0.9,
    'other': 0.8,
  };
  
  if (leadData.source && sourceMultipliers[leadData.source]) {
    score *= sourceMultipliers[leadData.source];
  }

  // Company email vs personal email
  const personalEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const emailDomain = leadData.email.split('@')[1]?.toLowerCase();
  if (emailDomain && !personalEmailDomains.includes(emailDomain)) {
    score += 10; // Business email bonus
  }

  // Detailed notes bonus
  if (leadData.notes && leadData.notes.length > 100) {
    score += 5;
  }

  // UTM campaign tracking
  if (leadData.utm?.campaign) {
    score += 5;
  }

  return Math.min(Math.max(Math.round(score), 0), 100);
}

async function scheduleFollowUpEmail(leadId: string, email: string, name: string) {
  // Schedule 48-hour follow-up email if no meeting booked
  // This would integrate with Cloud Scheduler and email service
  
  const followUpData = {
    leadId,
    email,
    name,
    scheduledFor: Date.now() + (48 * 60 * 60 * 1000), // 48 hours
    type: 'follow_up',
    sent: false,
  };

  await db.collection('scheduled_emails').add(followUpData);
}

async function sendTeamNotification(leadId: string, leadData: any) {
  // Send notification to team about high-value lead
  // This would integrate with Slack, email, or other notification service
  
  const notification = {
    type: 'high_value_lead',
    leadId,
    message: `High-value lead: ${leadData.name} from ${leadData.company} (Score: ${calculateLeadScore(leadData)})`,
    createdAt: Date.now(),
    sent: false,
  };

  await db.collection('notifications').add(notification);
}
