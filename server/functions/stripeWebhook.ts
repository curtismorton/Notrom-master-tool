import { https } from 'firebase-functions/v2';
import { db, logActivity } from '../firebase-admin';
import Stripe from 'stripe';
import { z } from 'zod';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const stripeWebhook = https.onRequest(async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      console.error('Missing stripe-signature header');
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Check if event was already processed
    const eventDoc = await db.collection('processed_events').doc(event.id).get();
    if (eventDoc.exists) {
      console.log(`Event ${event.id} already processed`);
      res.status(200).send('Event already processed');
      return;
    }

    // Mark event as processed
    await db.collection('processed_events').doc(event.id).set({
      eventType: event.type,
      processedAt: Date.now(),
    });

    // Handle different event types
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).send('Webhook handled successfully');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    // Find invoice in our database
    const invoiceQuery = await db.collection('invoices')
      .where('stripeInvoiceId', '==', invoice.id)
      .get();

    if (invoiceQuery.empty) {
      console.log(`Invoice ${invoice.id} not found in database`);
      return;
    }

    const invoiceDoc = invoiceQuery.docs[0];
    const invoiceData = invoiceDoc.data();

    // Update invoice status
    await invoiceDoc.ref.update({
      status: 'paid',
      paidAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log payment activity
    await logActivity({
      byUid: 'stripe',
      action: 'invoice_paid',
      payload: { 
        invoiceId: invoiceDoc.id, 
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency 
      },
      clientId: invoiceData.clientId,
      projectId: invoiceData.projectId,
    });

    // Handle different invoice types
    if (invoiceData.type === 'deposit') {
      await handleDepositPayment(invoiceData);
    } else if (invoiceData.type === 'milestone') {
      await handleMilestonePayment(invoiceData);
    } else if (invoiceData.type === 'care') {
      await handleCarePayment(invoiceData);
    }

    console.log(`Invoice payment processed: ${invoice.id}`);
  } catch (error) {
    console.error('Error handling invoice payment:', error);
  }
}

async function handleDepositPayment(invoiceData: any) {
  try {
    // Advance project to next stage
    if (invoiceData.projectId) {
      const projectDoc = await db.collection('projects').doc(invoiceData.projectId).get();
      if (projectDoc.exists) {
        const projectData = projectDoc.data();
        
        // Move from intake to copy phase
        if (projectData?.status === 'intake') {
          await projectDoc.ref.update({
            status: 'copy',
            'milestones.copyDate': Date.now(),
            updatedAt: Date.now(),
          });

          // Provision GitHub repo and Vercel project
          await provisionProjectInfrastructure(invoiceData.projectId, invoiceData.clientId);
        }
      }
    }
  } catch (error) {
    console.error('Error handling deposit payment:', error);
  }
}

async function handleMilestonePayment(invoiceData: any) {
  try {
    // Log milestone completion
    await logActivity({
      byUid: 'stripe',
      action: 'milestone_payment_received',
      payload: { invoiceId: invoiceData.id },
      clientId: invoiceData.clientId,
      projectId: invoiceData.projectId,
    });
  } catch (error) {
    console.error('Error handling milestone payment:', error);
  }
}

async function handleCarePayment(invoiceData: any) {
  try {
    // Update subscription status
    const subscriptionQuery = await db.collection('subscriptions')
      .where('clientId', '==', invoiceData.clientId)
      .where('status', '==', 'active')
      .get();

    if (!subscriptionQuery.empty) {
      const subscriptionDoc = subscriptionQuery.docs[0];
      await subscriptionDoc.ref.update({
        lastInvoiceStatus: 'paid',
        updatedAt: Date.now(),
      });
    }
  } catch (error) {
    console.error('Error handling care payment:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const invoiceQuery = await db.collection('invoices')
      .where('stripeInvoiceId', '==', invoice.id)
      .get();

    if (!invoiceQuery.empty) {
      const invoiceDoc = invoiceQuery.docs[0];
      await invoiceDoc.ref.update({
        status: 'overdue',
        updatedAt: Date.now(),
      });

      // Log failed payment
      await logActivity({
        byUid: 'stripe',
        action: 'invoice_payment_failed',
        payload: { invoiceId: invoiceDoc.id, stripeInvoiceId: invoice.id },
        clientId: invoiceDoc.data().clientId,
      });
    }
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    // Find client by Stripe customer ID
    const clientQuery = await db.collection('clients')
      .where('stripeCustomerId', '==', subscription.customer)
      .get();

    if (!clientQuery.empty) {
      const clientDoc = clientQuery.docs[0];
      const clientData = clientDoc.data();

      // Create subscription record
      await db.collection('subscriptions').add({
        clientId: clientDoc.id,
        plan: determinePlanFromSubscription(subscription),
        stripeSubscriptionId: subscription.id,
        status: 'active',
        currentPeriodEnd: subscription.current_period_end * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update client plan
      await clientDoc.ref.update({
        plan: determinePlanFromSubscription(subscription),
        updatedAt: Date.now(),
      });

      await logActivity({
        byUid: 'stripe',
        action: 'subscription_created',
        payload: { subscriptionId: subscription.id },
        clientId: clientDoc.id,
      });
    }
  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const subscriptionQuery = await db.collection('subscriptions')
      .where('stripeSubscriptionId', '==', subscription.id)
      .get();

    if (!subscriptionQuery.empty) {
      const subscriptionDoc = subscriptionQuery.docs[0];
      await subscriptionDoc.ref.update({
        status: subscription.status === 'active' ? 'active' : 'on_hold',
        currentPeriodEnd: subscription.current_period_end * 1000,
        updatedAt: Date.now(),
      });
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const subscriptionQuery = await db.collection('subscriptions')
      .where('stripeSubscriptionId', '==', subscription.id)
      .get();

    if (!subscriptionQuery.empty) {
      const subscriptionDoc = subscriptionQuery.docs[0];
      await subscriptionDoc.ref.update({
        status: 'canceled',
        updatedAt: Date.now(),
      });

      // Update client plan
      const clientDoc = await db.collection('clients').doc(subscriptionDoc.data().clientId).get();
      if (clientDoc.exists) {
        await clientDoc.ref.update({
          plan: 'none',
          updatedAt: Date.now(),
        });
      }
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    // Handle proposal acceptance via Stripe Checkout
    if (session.metadata?.proposalId) {
      await handleProposalAcceptance(session.metadata.proposalId, session);
    }
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

async function handleProposalAcceptance(proposalId: string, session: Stripe.Checkout.Session) {
  try {
    const proposalDoc = await db.collection('proposals').doc(proposalId).get();
    if (!proposalDoc.exists) return;

    // Update proposal status
    await proposalDoc.ref.update({
      status: 'signed',
      signatureStatus: 'signed',
      signedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create deposit invoice
    const proposalData = proposalDoc.data();
    const depositAmount = Math.round(proposalData.price * 0.4); // 40% deposit

    await db.collection('invoices').add({
      clientId: proposalData.clientId,
      amount: depositAmount,
      currency: proposalData.currency || 'USD',
      type: 'deposit',
      stripeInvoiceId: session.invoice as string,
      status: 'paid',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await logActivity({
      byUid: 'stripe',
      action: 'proposal_accepted',
      payload: { proposalId, sessionId: session.id },
      clientId: proposalData.clientId,
    });
  } catch (error) {
    console.error('Error handling proposal acceptance:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Handle successful one-time payments
    await logActivity({
      byUid: 'stripe',
      action: 'payment_succeeded',
      payload: { 
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency 
      },
    });
  } catch (error) {
    console.error('Error handling payment intent success:', error);
  }
}

async function provisionProjectInfrastructure(projectId: string, clientId: string) {
  try {
    // TODO: Implement GitHub repo creation and Vercel project setup
    // This would use GitHub App authentication and Vercel API
    
    const repoUrl = `https://github.com/notrom-agency/client-${clientId}`;
    const stagingUrl = `https://client-${clientId}-staging.vercel.app`;

    await db.collection('projects').doc(projectId).update({
      repoUrl,
      stagingUrl,
      updatedAt: Date.now(),
    });

    await logActivity({
      byUid: 'system',
      action: 'project_infrastructure_provisioned',
      payload: { projectId, repoUrl, stagingUrl },
      clientId,
      projectId,
    });
  } catch (error) {
    console.error('Error provisioning project infrastructure:', error);
  }
}

function determinePlanFromSubscription(subscription: Stripe.Subscription): string {
  // Map Stripe price IDs to our plan names
  const priceIdToPlan: Record<string, string> = {
    [process.env.STRIPE_CARE_BASIC_PRICE_ID || '']: 'care_basic',
    [process.env.STRIPE_CARE_PLUS_PRICE_ID || '']: 'care_plus',
    [process.env.STRIPE_CARE_PRO_PRICE_ID || '']: 'care_pro',
  };

  const priceId = subscription.items.data[0]?.price.id;
  return priceIdToPlan[priceId || ''] || 'care_basic';
}
