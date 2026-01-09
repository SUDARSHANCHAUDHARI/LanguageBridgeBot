/**
 * Payment Service
 * Handles Stripe payment integration for premium subscriptions
 */

const stripe = require('stripe');
const config = require('../config/environment');
const { saveGroupConfig, getGroupConfig } = require('./databaseService');
const { upgradeToPremium, downgradeFromPremium } = require('./subscriptionService');

// Initialize Stripe client
let stripeClient = null;
if (config.stripe?.secretKey) {
  stripeClient = stripe(config.stripe.secretKey);
}

/**
 * Create a checkout session for premium subscription
 * @param {string} groupId - Group ID
 * @param {string} priceId - Stripe price ID
 * @returns {Promise<Object>} Checkout session
 */
async function createCheckoutSession(groupId, priceId = 'price_premium_monthly') {
  try {
    if (!stripeClient) {
      throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY in .env');
    }

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.DASHBOARD_URL || 'https://your-domain.com'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DASHBOARD_URL || 'https://your-domain.com'}/cancel`,
      metadata: {
        groupId,
      },
      subscription_data: {
        metadata: {
          groupId,
        },
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
}

/**
 * Handle Stripe webhook event
 * @param {Object} event - Stripe webhook event
 * @returns {Promise<void>}
 */
async function handleWebhookEvent(event) {
  try {
    if (!stripeClient) {
      throw new Error('Stripe not configured');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    throw error;
  }
}

/**
 * Handle checkout session completed
 * @param {Object} session - Stripe checkout session
 */
async function handleCheckoutCompleted(session) {
  const groupId = session.metadata?.groupId;
  if (groupId) {
    await upgradeToPremium(groupId, {
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      plan: 'premium',
      startDate: new Date(),
    });
  }
}

/**
 * Handle subscription updated
 * @param {Object} subscription - Stripe subscription
 */
async function handleSubscriptionUpdated(subscription) {
  const groupId = subscription.metadata?.groupId;
  if (groupId) {
    const isActive = subscription.status === 'active';
    if (isActive) {
      await upgradeToPremium(groupId, {
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        plan: 'premium',
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
      });
    }
  }
}

/**
 * Handle subscription deleted
 * @param {Object} subscription - Stripe subscription
 */
async function handleSubscriptionDeleted(subscription) {
  const groupId = subscription.metadata?.groupId;
  if (groupId) {
    await downgradeFromPremium(groupId);
  }
}

/**
 * Handle payment succeeded
 * @param {Object} invoice - Stripe invoice
 */
async function handlePaymentSucceeded(invoice) {
  // Payment successful, subscription remains active
  console.log(`Payment succeeded for subscription: ${invoice.subscription}`);
}

/**
 * Handle payment failed
 * @param {Object} invoice - Stripe invoice
 */
async function handlePaymentFailed(invoice) {
  // Payment failed, may need to notify user
  console.log(`Payment failed for subscription: ${invoice.subscription}`);
}

/**
 * Get customer portal URL for managing subscription
 * @param {string} groupId - Group ID
 * @returns {Promise<string>} Portal URL
 */
async function getCustomerPortalUrl(groupId) {
  try {
    if (!stripeClient) {
      throw new Error('Stripe not configured');
    }

    const groupConfig = await getGroupConfig(groupId);
    if (!groupConfig?.stripeCustomerId) {
      throw new Error('No Stripe customer found for this group');
    }

    const session = await stripeClient.billingPortal.sessions.create({
      customer: groupConfig.stripeCustomerId,
      return_url: `${process.env.DASHBOARD_URL || 'https://your-domain.com'}/dashboard`,
    });

    return session.url;
  } catch (error) {
    throw new Error(`Failed to create customer portal: ${error.message}`);
  }
}

/**
 * Verify Stripe webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} Event object
 */
function verifyWebhookSignature(payload, signature) {
  if (!config.stripe?.webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  return stripeClient.webhooks.constructEvent(
    payload,
    signature,
    config.stripe.webhookSecret
  );
}

module.exports = {
  createCheckoutSession,
  handleWebhookEvent,
  getCustomerPortalUrl,
  verifyWebhookSignature,
};
