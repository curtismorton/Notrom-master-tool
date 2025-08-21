# Notrom Master Tool

A comprehensive, automated web development agency management platform built on Firebase. Handles the complete client journey from lead capture to monthly care with minimal manual intervention.

## Features

- **Lead Management**: Automated lead capture, scoring, and qualification
- **Project Pipeline**: End-to-end project tracking from intake to launch
- **Client Portal**: Dedicated interface for clients to track progress and communicate
- **Proposal Generation**: AI-powered proposal creation with e-signature integration
- **Payment Processing**: Stripe integration for deposits, milestones, and subscriptions
- **Care Plans**: Automated monthly reporting and maintenance
- **Support System**: Ticket management with SLA tracking
- **Real-time Dashboard**: Live project status and analytics

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **Tailwind CSS** with custom design system
- **Shadcn UI** components
- **Framer Motion** for animations
- **React Hook Form** for form management
- **TanStack Query** for data fetching
- **Recharts** for data visualization

### Backend
- **Firebase Cloud Functions** (TypeScript)
- **Firebase Firestore** with security rules
- **Firebase Storage** for file management
- **Firebase Auth** with custom claims
- **Cloud Scheduler** for automation

### External APIs
- **Stripe** for payments and subscriptions
- **OpenAI** for AI copy generation and analysis
- **Whisper** for meeting transcription
- **GitHub API** for repository management
- **Vercel API** for deployment automation
- **Gmail API** for email and calendar integration

## Prerequisites

- Node.js 18+
- Firebase CLI
- Firebase project with billing enabled
- Stripe account
- OpenAI API key
- Google Cloud Project (for service account)

## Setup Instructions

### 1. Firebase Project Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable the following services:
   - Authentication (Email/Password and Google)
   - Firestore Database
   - Cloud Functions
   - Cloud Storage
   - Cloud Scheduler

3. Install Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
