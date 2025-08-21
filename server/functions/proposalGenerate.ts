import { https } from 'firebase-functions/v2';
import { db, storage, logActivity } from '../firebase-admin';
import OpenAI from 'openai';
import puppeteer from 'puppeteer';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const proposalSchema = z.object({
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  package: z.enum(['starter', 'standard', 'premium']),
  customRequirements: z.string().optional(),
  urgentDelivery: z.boolean().optional(),
});

const packagePricing = {
  starter: { price: 8500, timeline: '2-3 weeks', features: ['5 pages', 'Responsive design', 'Basic SEO', 'Contact forms', '1 month support'] },
  standard: { price: 15000, timeline: '4-6 weeks', features: ['10 pages', 'CMS integration', 'Advanced SEO', 'E-commerce ready', 'Analytics setup', '3 months support'] },
  premium: { price: 25000, timeline: '6-8 weeks', features: ['Unlimited pages', 'Custom CMS', 'Advanced integrations', 'Performance optimization', 'Security hardening', '6 months support'] },
};

export const proposalGenerate = https.onCall(async (request) => {
  try {
    const { leadId, clientId, package: packageType, customRequirements, urgentDelivery } = proposalSchema.parse(request.data);
    
    if (!leadId && !clientId) {
      throw new https.HttpsError('invalid-argument', 'Either leadId or clientId must be provided');
    }

    // Get lead or client data
    let entityData: any;
    let entityType: 'lead' | 'client';
    
    if (leadId) {
      const leadDoc = await db.collection('leads').doc(leadId).get();
      if (!leadDoc.exists) {
        throw new https.HttpsError('not-found', 'Lead not found');
      }
      entityData = leadDoc.data();
      entityType = 'lead';
    } else {
      const clientDoc = await db.collection('clients').doc(clientId!).get();
      if (!clientDoc.exists) {
        throw new https.HttpsError('not-found', 'Client not found');
      }
      entityData = clientDoc.data();
      entityType = 'client';
    }

    // Generate proposal number
    const proposalNumber = await generateProposalNumber();

    // Generate proposal content using AI
    const proposalContent = await generateProposalContent(entityData, packageType, customRequirements);

    // Calculate pricing
    const basePackage = packagePricing[packageType];
    const urgencyMultiplier = urgentDelivery ? 1.3 : 1.0;
    const finalPrice = Math.round(basePackage.price * urgencyMultiplier);

    // Create proposal document
    const proposalData = {
      [entityType === 'lead' ? 'leadId' : 'clientId']: entityType === 'lead' ? leadId : clientId,
      package: packageType,
      price: finalPrice,
      currency: 'USD',
      status: 'draft' as const,
      version: 1,
      proposalNumber,
      content: proposalContent,
      urgentDelivery: urgentDelivery || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const proposalRef = await db.collection('proposals').add(proposalData);

    // Generate PDF
    const pdfUrl = await generateProposalPDF(proposalRef.id, proposalContent, proposalData);

    // Update proposal with PDF URL
    await proposalRef.update({
      pdfUrl,
      updatedAt: Date.now(),
    });

    // Log activity
    await logActivity({
      byUid: request.auth?.uid || 'system',
      action: 'proposal_generated',
      payload: { proposalId: proposalRef.id, package: packageType, price: finalPrice },
      clientId: entityType === 'client' ? clientId : undefined,
    });

    return {
      success: true,
      proposalId: proposalRef.id,
      proposalNumber,
      pdfUrl,
      price: finalPrice,
    };
  } catch (error) {
    console.error('Proposal generation error:', error);
    
    if (error instanceof z.ZodError) {
      throw new https.HttpsError('invalid-argument', 'Invalid proposal data');
    }
    
    if (error instanceof https.HttpsError) {
      throw error;
    }
    
    throw new https.HttpsError('internal', 'Failed to generate proposal');
  }
});

async function generateProposalNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PROP-${year}-`;
  
  // Get the highest proposal number for this year
  const proposals = await db.collection('proposals')
    .where('proposalNumber', '>=', prefix)
    .where('proposalNumber', '<', `PROP-${year + 1}-`)
    .orderBy('proposalNumber', 'desc')
    .limit(1)
    .get();

  let nextNumber = 1;
  if (!proposals.empty) {
    const lastProposal = proposals.docs[0].data();
    const lastNumber = parseInt(lastProposal.proposalNumber.split('-')[2]) || 0;
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

async function generateProposalContent(entityData: any, packageType: string, customRequirements?: string): Promise<any> {
  const packageInfo = packagePricing[packageType as keyof typeof packagePricing];
  
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a professional proposal writer for a premium web development agency called Notrom. 
        Create a compelling, detailed proposal that demonstrates expertise and value.
        
        Include these sections:
        1. Executive Summary
        2. Project Understanding
        3. Proposed Solution
        4. Timeline & Milestones
        5. Investment & Terms
        6. Why Choose Notrom
        7. Next Steps
        
        Use professional but approachable language. Emphasize modern technology, performance, and ongoing value.
        
        Respond with JSON in this format:
        {
          "executiveSummary": "text",
          "projectUnderstanding": "text",
          "proposedSolution": "text",
          "timeline": "text",
          "investment": "text",
          "whyChooseUs": "text",
          "nextSteps": "text",
          "keyFeatures": ["feature1", "feature2"],
          "deliverables": ["deliverable1", "deliverable2"]
        }`
      },
      {
        role: 'user',
        content: `Create a proposal for:
        Company: ${entityData.company || entityData.legalName}
        Contact: ${entityData.name || entityData.contacts?.[0]?.name}
        Package: ${packageType} (${packageInfo.features.join(', ')})
        Timeline: ${packageInfo.timeline}
        Custom Requirements: ${customRequirements || 'None specified'}
        
        Notes from discovery: ${entityData.notes || 'Standard web development project'}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function generateProposalPDF(proposalId: string, content: any, proposalData: any): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Generate HTML content
    const htmlContent = generateProposalHTML(content, proposalData);
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    // Upload to Firebase Storage
    const bucket = storage.bucket();
    const fileName = `proposals/${proposalId}/proposal-${proposalData.proposalNumber}.pdf`;
    const file = bucket.file(fileName);
    
    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          proposalId,
          proposalNumber: proposalData.proposalNumber,
          createdAt: new Date().toISOString(),
        },
      },
    });

    return fileName;
  } finally {
    await browser.close();
  }
}

function generateProposalHTML(content: any, proposalData: any): string {
  const packageInfo = packagePricing[proposalData.package as keyof typeof packagePricing];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Proposal ${proposalData.proposalNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 40px;
          background: white;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          padding-bottom: 20px;
          border-bottom: 3px solid #667eea;
        }
        .logo { 
          font-size: 36px; 
          font-weight: bold; 
          background: linear-gradient(45deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }
        .proposal-number { 
          color: #666; 
          font-size: 18px; 
        }
        .section { 
          margin-bottom: 30px; 
        }
        .section h2 { 
          color: #667eea; 
          font-size: 24px; 
          margin-bottom: 15px;
          border-left: 4px solid #667eea;
          padding-left: 15px;
        }
        .section h3 { 
          color: #764ba2; 
          font-size: 18px; 
          margin-bottom: 10px; 
        }
        .features-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 15px; 
          margin: 20px 0; 
        }
        .feature-item { 
          background: #f8f9ff; 
          padding: 15px; 
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        .price-highlight { 
          background: linear-gradient(135deg, #667eea, #764ba2); 
          color: white; 
          padding: 30px; 
          border-radius: 12px; 
          text-align: center; 
          margin: 30px 0; 
        }
        .price { 
          font-size: 48px; 
          font-weight: bold; 
          margin-bottom: 10px; 
        }
        .footer { 
          text-align: center; 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 2px solid #eee; 
          color: #666; 
        }
        ul { 
          padding-left: 20px; 
        }
        li { 
          margin-bottom: 8px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Notrom</div>
          <div class="proposal-number">Proposal ${proposalData.proposalNumber}</div>
          <p>Web Development & Digital Solutions</p>
        </div>

        <div class="section">
          <h2>Executive Summary</h2>
          <p>${content.executiveSummary}</p>
        </div>

        <div class="section">
          <h2>Project Understanding</h2>
          <p>${content.projectUnderstanding}</p>
        </div>

        <div class="section">
          <h2>Proposed Solution</h2>
          <p>${content.proposedSolution}</p>
          
          <h3>Key Features Included:</h3>
          <div class="features-grid">
            ${packageInfo.features.map(feature => `<div class="feature-item">✓ ${feature}</div>`).join('')}
          </div>
        </div>

        <div class="section">
          <h2>Timeline & Deliverables</h2>
          <p><strong>Estimated Timeline:</strong> ${packageInfo.timeline}</p>
          <br>
          <h3>Deliverables:</h3>
          <ul>
            ${(content.deliverables || []).map((item: string) => `<li>${item}</li>`).join('')}
          </ul>
        </div>

        <div class="price-highlight">
          <div>Total Investment</div>
          <div class="price">$${proposalData.price.toLocaleString()}</div>
          <div>40% deposit required to begin • Balance due on completion</div>
        </div>

        <div class="section">
          <h2>Why Choose Notrom</h2>
          <p>${content.whyChooseUs}</p>
        </div>

        <div class="section">
          <h2>Next Steps</h2>
          <p>${content.nextSteps}</p>
        </div>

        <div class="footer">
          <p>This proposal is valid for 30 days from the date of issue.</p>
          <p>Questions? Contact us at hello@notrom.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export const proposalSend = https.onCall(async (request) => {
  try {
    const { proposalId } = request.data;
    
    const proposalDoc = await db.collection('proposals').doc(proposalId).get();
    if (!proposalDoc.exists) {
      throw new https.HttpsError('not-found', 'Proposal not found');
    }

    // Update proposal status
    await proposalDoc.ref.update({
      status: 'sent',
      sentAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log activity
    await logActivity({
      byUid: request.auth?.uid || 'system',
      action: 'proposal_sent',
      payload: { proposalId },
    });

    // TODO: Send email with proposal link
    
    return { success: true, message: 'Proposal sent successfully' };
  } catch (error) {
    console.error('Proposal send error:', error);
    throw new https.HttpsError('internal', 'Failed to send proposal');
  }
});
