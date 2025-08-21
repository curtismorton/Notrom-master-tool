import type { Express } from "express";
import { createServer, type Server } from "http";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../client/src/lib/firebase';

export async function registerRoutes(app: Express): Promise<Server> {
  // Lead creation endpoint
  app.post("/api/leads", async (req, res) => {
    try {
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
      const stripeWebhook = httpsCallable(functions, 'stripeWebhook');
      const result = await stripeWebhook({
        signature: req.headers['stripe-signature'],
        body: req.body
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
