import type { Express } from "express";
import { createServer, type Server } from "http";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../client/src/lib/firebase';

// Demo mode responses
const demoResponses = {
  leadCreate: { success: true, id: 'demo-lead-' + Date.now() },
  transcribeAndSummarize: { 
    transcript: 'Demo transcript text',
    summary: 'Demo meeting summary',
    keyPoints: ['Demo point 1', 'Demo point 2']
  },
  proposalGenerate: { 
    success: true, 
    proposalId: 'demo-proposal-' + Date.now(),
    downloadUrl: '/demo-proposal.pdf'
  },
  monthlyReports: { 
    success: true, 
    reportId: 'demo-report-' + Date.now(),
    downloadUrl: '/demo-report.pdf'
  },
  stripeWebhook: { received: true }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Lead creation endpoint
  app.post("/api/leads", async (req, res) => {
    try {
      // Demo mode - return mock response
      if (!functions) {
        res.json(demoResponses.leadCreate);
        return;
      }
      
      const leadCreate = httpsCallable(functions, 'leadCreate');
      const result = await leadCreate(req.body);
      res.json(result.data);
    } catch (error: any) {
      console.error('Lead creation error:', error);
      res.status(500).json({ 
        message: "Error creating lead", 
        error: error.message 
      });
    }
  });

  // Meeting transcription endpoint
  app.post("/api/transcribe", async (req, res) => {
    try {
      // Demo mode - return mock response
      if (!functions) {
        res.json(demoResponses.transcribeAndSummarize);
        return;
      }
      
      const transcribeFunction = httpsCallable(functions, 'transcribeAndSummarize');
      const result = await transcribeFunction(req.body);
      res.json(result.data);
    } catch (error: any) {
      console.error('Transcription error:', error);
      res.status(500).json({ 
        message: "Error transcribing audio", 
        error: error.message 
      });
    }
  });

  // Proposal generation endpoint
  app.post("/api/proposals/generate", async (req, res) => {
    try {
      // Demo mode - return mock response
      if (!functions) {
        res.json(demoResponses.proposalGenerate);
        return;
      }
      
      const proposalGenerate = httpsCallable(functions, 'proposalGenerate');
      const result = await proposalGenerate(req.body);
      res.json(result.data);
    } catch (error: any) {
      console.error('Proposal generation error:', error);
      res.status(500).json({ 
        message: "Error generating proposal", 
        error: error.message 
      });
    }
  });

  // Monthly reports endpoint
  app.post("/api/reports/monthly", async (req, res) => {
    try {
      // Demo mode - return mock response
      if (!functions) {
        res.json(demoResponses.monthlyReports);
        return;
      }
      
      const monthlyReports = httpsCallable(functions, 'monthlyReports');
      const result = await monthlyReports(req.body);
      res.json(result.data);
    } catch (error: any) {
      console.error('Monthly report error:', error);
      res.status(500).json({ 
        message: "Error generating monthly report", 
        error: error.message 
      });
    }
  });

  // Stripe webhook endpoint
  app.post("/api/stripe/webhook", async (req, res) => {
    try {
      // Demo mode - return mock response
      if (!functions) {
        res.json(demoResponses.stripeWebhook);
        return;
      }
      
      const stripeWebhook = httpsCallable(functions, 'stripeWebhook');
      const result = await stripeWebhook({
        signature: req.headers['stripe-signature'],
        // When using express.raw middleware, req.body is a Buffer.
        // Send it as a string so the callable function receives the
        // original payload for signature verification.
        body: req.body instanceof Buffer ? req.body.toString() : req.body
      });
      res.json(result.data);
    } catch (error: any) {
      console.error('Stripe webhook error:', error);
      res.status(500).json({ 
        message: "Error processing webhook", 
        error: error.message 
      });
    }
  });

  // Development helper endpoints - only in development
  if (process.env.NODE_ENV === 'development') {
    // Create demo users endpoint
    app.post("/api/dev/create-demo-user", (req, res) => {
      const { role } = req.body;
      const demoUser = {
        id: `demo-${role}-${Date.now()}`,
        email: `${role}@demo.com`,
        name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        role: role || 'admin',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      res.json({ 
        success: true, 
        user: demoUser,
        message: `Demo ${role} user created. You can now sign in with email: ${demoUser.email} and any password.`
      });
    });

    // Get demo credentials endpoint
    app.get("/api/dev/demo-credentials", (req, res) => {
      res.json({
        credentials: [
          {
            role: 'admin',
            email: 'admin@demo.com',
            password: 'password123',
            description: 'Full admin access to all features'
          },
          {
            role: 'staff',
            email: 'staff@demo.com', 
            password: 'password123',
            description: 'Staff access to client management'
          },
          {
            role: 'client',
            email: 'client@demo.com',
            password: 'password123', 
            description: 'Client portal access'
          }
        ]
      });
    });
  }

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      services: {
        firebase: "connected",
        functions: "available"
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
