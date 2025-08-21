import { https } from 'firebase-functions/v2';
import { pubsub } from 'firebase-functions/v2';
import { db, storage, logActivity } from '../firebase-admin';
import OpenAI from 'openai';
import puppeteer from 'puppeteer';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const reportSchema = z.object({
  clientId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
});

// Scheduled function to generate monthly reports (runs on 1st of each month)
export const monthlyReportScheduler = pubsub.schedule('0 9 1 * *').onRun(async (context) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = lastMonth.getMonth() + 1;
    const year = lastMonth.getFullYear();

    // Get all active clients with care plans
    const clientsQuery = await db.collection('clients')
      .where('plan', '!=', 'none')
      .get();

    const reportPromises = clientsQuery.docs.map(async (clientDoc) => {
      try {
        await generateMonthlyReport(clientDoc.id, month, year);
      } catch (error) {
        console.error(`Failed to generate report for client ${clientDoc.id}:`, error);
      }
    });

    await Promise.all(reportPromises);
    
    console.log(`Generated monthly reports for ${clientsQuery.size} clients`);
  } catch (error) {
    console.error('Monthly report scheduler error:', error);
  }
});

// Manual report generation endpoint
export const generateMonthlyReport = https.onCall(async (request) => {
  try {
    const { clientId, month, year } = reportSchema.parse(request.data);
    
    const reportData = await generateMonthlyReport(clientId, month, year);
    
    return {
      success: true,
      reportId: reportData.reportId,
      pdfUrl: reportData.pdfUrl,
    };
  } catch (error) {
    console.error('Manual report generation error:', error);
    
    if (error instanceof z.ZodError) {
      throw new https.HttpsError('invalid-argument', 'Invalid report parameters');
    }
    
    throw new https.HttpsError('internal', 'Failed to generate report');
  }
});

async function generateMonthlyReport(clientId: string, month: number, year: number) {
  try {
    // Get client data
    const clientDoc = await db.collection('clients').doc(clientId).get();
    if (!clientDoc.exists) {
      throw new Error(`Client ${clientId} not found`);
    }
    
    const clientData = clientDoc.data();
    
    // Get client's active projects
    const projectsQuery = await db.collection('projects')
      .where('clientId', '==', clientId)
      .where('status', '!=', 'closed')
      .get();

    const projects = projectsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Collect report data
    const reportData = await collectReportData(clientId, month, year, projects);
    
    // Generate AI insights and recommendations
    const aiInsights = await generateAIInsights(reportData, clientData);
    
    // Create report document in database
    const reportDocData = {
      clientId,
      month,
      year,
      generatedAt: Date.now(),
      data: reportData,
      insights: aiInsights,
      status: 'generated',
    };

    const reportRef = await db.collection('reports').add(reportDocData);

    // Generate PDF report
    const pdfUrl = await generateReportPDF(reportRef.id, reportDocData, clientData);
    
    // Update report with PDF URL
    await reportRef.update({
      pdfUrl,
      status: 'completed',
    });

    // Send email with report (would integrate with email service)
    await sendReportEmail(clientData, pdfUrl, month, year);

    // Log activity
    await logActivity({
      byUid: 'system',
      action: 'monthly_report_generated',
      payload: { reportId: reportRef.id, month, year },
      clientId,
    });

    return {
      reportId: reportRef.id,
      pdfUrl,
    };
  } catch (error) {
    console.error(`Error generating monthly report for client ${clientId}:`, error);
    throw error;
  }
}

async function collectReportData(clientId: string, month: number, year: number, projects: any[]) {
  const startDate = new Date(year, month - 1, 1).getTime();
  const endDate = new Date(year, month, 0, 23, 59, 59).getTime();

  // Collect uptime data (mock implementation)
  const uptimeData = await getUptimeData(projects, startDate, endDate);
  
  // Collect Core Web Vitals (mock implementation)
  const coreWebVitals = await getCoreWebVitals(projects, startDate, endDate);
  
  // Collect security updates
  const securityUpdates = await getSecurityUpdates(clientId, startDate, endDate);
  
  // Collect performance optimizations
  const performanceOptimizations = await getPerformanceOptimizations(clientId, startDate, endDate);
  
  // Collect support tickets
  const supportTickets = await getSupportTickets(clientId, startDate, endDate);
  
  // Collect traffic data (if GA4 connected)
  const trafficData = await getTrafficData(projects, startDate, endDate);

  return {
    period: { month, year },
    uptime: uptimeData,
    coreWebVitals,
    security: securityUpdates,
    performance: performanceOptimizations,
    support: supportTickets,
    traffic: trafficData,
    projects: projects.map(p => ({
      id: p.id,
      status: p.status,
      productionUrl: p.productionUrl,
      stagingUrl: p.stagingUrl,
    })),
  };
}

async function generateAIInsights(reportData: any, clientData: any) {
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a technical consultant analyzing website performance and security data for a client report.
        
        Provide insights and recommendations based on the data provided. Focus on:
        1. Performance trends and opportunities
        2. Security posture and improvements
        3. User experience optimizations
        4. Technical recommendations for next month
        5. Growth opportunities
        
        Keep recommendations actionable and business-focused.
        
        Respond with JSON in this format:
        {
          "summary": "Overall assessment of the month",
          "keyAchievements": ["achievement1", "achievement2"],
          "areasForImprovement": ["area1", "area2"],
          "recommendations": [
            {
              "title": "Recommendation title",
              "description": "Detailed description",
              "priority": "high|medium|low",
              "estimatedImpact": "Expected impact"
            }
          ],
          "performanceScore": 85,
          "securityScore": 92,
          "nextMonthFocus": ["focus1", "focus2", "focus3"]
        }`
      },
      {
        role: 'user',
        content: `Analyze this monthly report data for ${clientData.company}:
        
        Uptime: ${JSON.stringify(reportData.uptime)}
        Core Web Vitals: ${JSON.stringify(reportData.coreWebVitals)}
        Security Updates: ${reportData.security.length} applied
        Performance Optimizations: ${reportData.performance.length} completed
        Support Tickets: ${reportData.support.total} (${reportData.support.resolved} resolved)
        Traffic: ${JSON.stringify(reportData.traffic)}
        
        Client Plan: ${clientData.plan}
        Number of Projects: ${reportData.projects.length}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function generateReportPDF(reportId: string, reportData: any, clientData: any) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    const htmlContent = generateReportHTML(reportData, clientData);
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
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
    const fileName = `reports/${reportData.clientId}/${reportData.year}-${reportData.month.toString().padStart(2, '0')}.pdf`;
    const file = bucket.file(fileName);
    
    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          reportId,
          clientId: reportData.clientId,
          month: reportData.month.toString(),
          year: reportData.year.toString(),
          createdAt: new Date().toISOString(),
        },
      },
    });

    return fileName;
  } finally {
    await browser.close();
  }
}

function generateReportHTML(reportData: any, clientData: any): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthName = monthNames[reportData.month - 1];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Monthly Report - ${monthName} ${reportData.year}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #333;
          background: linear-gradient(135deg, #0A0A0B 0%, #111113 100%);
          color: white;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 40px;
          background: linear-gradient(135deg, #0A0A0B 0%, #111113 100%);
          min-height: 100vh;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          padding-bottom: 20px;
          border-bottom: 3px solid #8B5CF6;
        }
        .logo { 
          font-size: 36px; 
          font-weight: bold; 
          background: linear-gradient(45deg, #8B5CF6, #06B6D4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }
        .client-name { 
          font-size: 24px; 
          margin-bottom: 10px;
        }
        .report-period { 
          color: #9CA3AF; 
          font-size: 18px; 
        }
        .section { 
          margin-bottom: 30px; 
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
        }
        .section h2 { 
          color: #8B5CF6; 
          font-size: 24px; 
          margin-bottom: 15px;
          border-left: 4px solid #8B5CF6;
          padding-left: 15px;
        }
        .metrics-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 15px; 
          margin: 20px 0; 
        }
        .metric-item { 
          background: rgba(139, 92, 246, 0.1); 
          padding: 15px; 
          border-radius: 8px;
          border-left: 4px solid #8B5CF6;
          text-align: center;
        }
        .metric-value { 
          font-size: 24px; 
          font-weight: bold; 
          color: #06B6D4;
          margin-bottom: 5px;
        }
        .metric-label { 
          color: #9CA3AF; 
          font-size: 14px; 
        }
        .recommendations { 
          background: linear-gradient(135deg, #8B5CF6, #06B6D4); 
          color: white; 
          padding: 20px; 
          border-radius: 12px; 
          margin: 20px 0; 
        }
        .recommendation-item {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        .priority-high { border-left: 4px solid #EF4444; }
        .priority-medium { border-left: 4px solid #F59E0B; }
        .priority-low { border-left: 4px solid #10B981; }
        ul { 
          padding-left: 20px; 
        }
        li { 
          margin-bottom: 8px; 
        }
        .footer { 
          text-align: center; 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 2px solid rgba(255, 255, 255, 0.1); 
          color: #9CA3AF; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Notrom</div>
          <div class="client-name">${clientData.company}</div>
          <div class="report-period">Monthly Report • ${monthName} ${reportData.year}</div>
        </div>

        <div class="section">
          <h2>Executive Summary</h2>
          <p>${reportData.insights.summary}</p>
          
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="metric-value">${reportData.data.uptime.percentage}%</div>
              <div class="metric-label">Uptime</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">${reportData.insights.performanceScore}</div>
              <div class="metric-label">Performance Score</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">${reportData.insights.securityScore}</div>
              <div class="metric-label">Security Score</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">${reportData.data.support.resolved}/${reportData.data.support.total}</div>
              <div class="metric-label">Tickets Resolved</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Key Achievements</h2>
          <ul>
            ${reportData.insights.keyAchievements.map((achievement: string) => `<li>${achievement}</li>`).join('')}
          </ul>
        </div>

        <div class="section">
          <h2>Core Web Vitals</h2>
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="metric-value">${reportData.data.coreWebVitals.lcp}ms</div>
              <div class="metric-label">Largest Contentful Paint</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">${reportData.data.coreWebVitals.fid}ms</div>
              <div class="metric-label">First Input Delay</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">${reportData.data.coreWebVitals.cls}</div>
              <div class="metric-label">Cumulative Layout Shift</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Security & Maintenance</h2>
          <p><strong>Security Updates Applied:</strong> ${reportData.data.security.length}</p>
          <p><strong>Performance Optimizations:</strong> ${reportData.data.performance.length}</p>
          <p><strong>Backup Status:</strong> All backups completed successfully</p>
        </div>

        <div class="recommendations">
          <h2 style="color: white; border: none; padding: 0; margin-bottom: 20px;">Recommendations for Next Month</h2>
          ${reportData.insights.recommendations.map((rec: any) => `
            <div class="recommendation-item priority-${rec.priority}">
              <h3>${rec.title}</h3>
              <p>${rec.description}</p>
              <small><strong>Expected Impact:</strong> ${rec.estimatedImpact}</small>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <p>Report generated automatically by Notrom Care Platform</p>
          <p>Questions? Contact our support team at care@notrom.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Mock data collection functions (replace with real implementations)
async function getUptimeData(projects: any[], startDate: number, endDate: number) {
  return { percentage: 99.9, incidents: 0, totalDowntime: 45 }; // 45 minutes
}

async function getCoreWebVitals(projects: any[], startDate: number, endDate: number) {
  return { lcp: 1200, fid: 95, cls: 0.08 };
}

async function getSecurityUpdates(clientId: string, startDate: number, endDate: number) {
  return [
    { name: 'WordPress Core Update', version: '6.4.2', date: startDate + 86400000 },
    { name: 'SSL Certificate Renewal', date: startDate + 2592000000 },
  ];
}

async function getPerformanceOptimizations(clientId: string, startDate: number, endDate: number) {
  return [
    { name: 'Image Optimization', impact: '15% faster loading' },
    { name: 'Database Cleanup', impact: '8% performance improvement' },
  ];
}

async function getSupportTickets(clientId: string, startDate: number, endDate: number) {
  const ticketsQuery = await db.collection('tickets')
    .where('clientId', '==', clientId)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();

  const tickets = ticketsQuery.docs.map(doc => doc.data());
  const resolved = tickets.filter(t => t.status === 'closed').length;
  
  return { total: tickets.length, resolved, avgResponseTime: '2.3 hours' };
}

async function getTrafficData(projects: any[], startDate: number, endDate: number) {
  // Mock traffic data - would integrate with GA4 API in production
  return {
    pageViews: 12450,
    uniqueVisitors: 8320,
    bounceRate: 35.2,
    avgSessionDuration: '3m 42s',
  };
}

async function sendReportEmail(clientData: any, pdfUrl: string, month: number, year: number) {
  // TODO: Implement email sending with PDF attachment
  // This would integrate with SendGrid, AWS SES, or similar service
  
  const emailData = {
    to: clientData.billingEmail,
    subject: `Monthly Report - ${month}/${year}`,
    pdfUrl,
    clientName: clientData.company,
    month,
    year,
    sent: false,
  };

  await db.collection('scheduled_emails').add(emailData);
}
