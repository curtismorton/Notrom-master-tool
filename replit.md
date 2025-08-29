# Overview

Notrom Master Tool is a comprehensive web development agency management platform built on Firebase that automates the complete client journey from lead capture to monthly care with minimal manual intervention. The application handles lead management, project pipeline tracking, proposal generation with e-signatures, payment processing, automated provisioning, and ongoing maintenance through care plans. It features both an admin interface for agency staff and a client portal for customers to track their projects.

# User Preferences

Preferred communication style: Simple, everyday language.

Recent fixes completed:
- Mobile responsive sidebar with hamburger menu navigation
- Complete Firebase removal for instant loading (no more connection errors)
- Clean demo authentication system for fast development 
- Mobile-optimized layouts and spacing throughout dashboard
- Eliminated all Firebase connection delays causing slow loading times

# System Architecture

## Frontend Architecture
The frontend is built as a React single-page application using modern web technologies:
- **Next.js 14 with App Router** for the main framework, though the current codebase appears to use standard React with Wouter for routing
- **Vite** as the build tool and development server
- **Tailwind CSS** with a custom design system featuring glass morphism effects and a dark theme
- **Shadcn UI components** for the component library with Radix UI primitives
- **TanStack Query** for server state management and data fetching
- **React Hook Form** with Zod validation for form handling

The application uses a role-based architecture where different user roles (admin, staff, client) see different interfaces through conditional rendering rather than separate applications.

## Backend Architecture
The backend follows a serverless Firebase architecture:
- **Firebase Cloud Functions** written in TypeScript handle all server-side logic including lead processing, proposal generation, transcription, and webhook handling
- **Express.js server** acts as a proxy layer for Firebase Functions during development
- **Firebase Firestore** serves as the primary database with security rules enforcing access control
- **Firebase Storage** handles file uploads and generated documents
- **Firebase Auth** with custom claims manages authentication and role-based authorization

The system uses event-driven architecture with Cloud Functions responding to database changes, file uploads, and scheduled tasks.

## Data Storage Solutions
The application uses Firebase Firestore as a NoSQL document database with the following key collections:
- Users, leads, clients, projects for core entities
- Proposals, invoices, subscriptions for business operations
- Meetings, assets, tickets for workflow management
- Logs and activities for audit trails

The schema is designed with soft deletes using `isDeleted` flags and includes comprehensive timestamp tracking. There's also evidence of a PostgreSQL setup with Drizzle ORM configuration, suggesting a potential hybrid or migration approach.

## Authentication and Authorization
Firebase Auth provides the authentication layer with support for:
- Email/password authentication
- Google OAuth integration
- Custom claims for role-based access control (admin, staff, client)
- Client-specific data isolation through clientId claims

Security rules in Firestore enforce data access based on user roles and ownership relationships.

## External Dependencies

### Payment Processing
- **Stripe** integration for payment processing, subscription management, and invoice generation
- Webhook handling for payment status updates and subscription lifecycle events

### AI and Automation
- **OpenAI API** for AI-powered copy generation, proposal creation, and meeting summarization
- **Whisper API** for meeting transcription functionality

### Development and Deployment
- **GitHub API** for repository management and automated project provisioning
- **Vercel API** for deployment automation and preview environment management
- **Firebase Hosting** for application deployment

### Communication and Scheduling
- **Gmail API** for email integration and calendar invite generation
- **Cloud Scheduler** for automated tasks like monthly reports and reminder emails

### Monitoring and Analytics
- **Lighthouse CI** for performance testing and quality assurance
- **Core Web Vitals** monitoring for ongoing performance tracking

The system is designed to operate primarily on Firebase's free tier while maintaining scalability through careful resource management and efficient function design.