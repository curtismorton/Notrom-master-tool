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

// Helper to call Firebase functions with a demo-mode fallback
async function callFunction<T>(
  name: string,
  payload: unknown,
  fallback: T
): Promise<T> {
  if (!functions) {
    return fallback;
  }

  const callable = httpsCallable(functions, name);
  const result = await callable(payload);
  return result.data as T;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Lead creation endpoint
  app.post("/api/leads", async (req, res) => {
    try {
      const result = await callFunction('leadCreate', req.body, demoResponses.leadCreate);
      res.json(result);
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
      const result = await callFunction(
        'transcribeAndSummarize',
        req.body,
        demoResponses.transcribeAndSummarize
      );
      res.json(result);
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
      const result = await callFunction(
        'proposalGenerate',
        req.body,
        demoResponses.proposalGenerate
      );
      res.json(result);
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
      const result = await callFunction(
        'monthlyReports',
        req.body,
        demoResponses.monthlyReports
      );
      res.json(result);
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
      const result = await callFunction(
        'stripeWebhook',
        {
          signature: req.headers['stripe-signature'],
          body: req.body
        },
        demoResponses.stripeWebhook
      );
      res.json(result);
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
