import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../../lib/firebaseAdmin';

// Stripe requires the raw body to construct the event
// But Next.js App Router API routes process JSON automatically
// We will use the request.text() to get raw body
export async function POST(req) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
        console.error('Stripe webhook misconfigured: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set. No subscription events can be processed until this is fixed.');
        return NextResponse.json({ received: true });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    const signature = req.headers.get('stripe-signature');
    const rawBody = await req.text();

    let event;

    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    // Stripe may redeliver the same event (retries, duplicate network delivery).
    // Track processed event IDs so a redelivery is a guaranteed no-op rather
    // than an accidental one that depends on every handler being idempotent.
    const processedEventRef = db.collection('processedStripeEvents').doc(event.id);
    const processedEventDoc = await processedEventRef.get();
    if (processedEventDoc.exists) {
        console.log(`Stripe event ${event.id} already processed. Skipping duplicate delivery.`);
        return NextResponse.json({ received: true });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;

                if (userId) {
                    await db.collection('users').doc(userId).set({
                        tier: 'Intelligence',
                        subscriptionStatus: 'active',
                        stripeSubscriptionId: session.subscription
                    }, { merge: true });
                } else {
                    console.error(`checkout.session.completed event ${event.id} had no userId in metadata. No tier was upgraded.`);
                }
                break;
            }
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                // Find user by stripeCustomerId
                const usersRef = db.collection('users');
                const snapshot = await usersRef.where('stripeCustomerId', '==', subscription.customer).get();
                
                if (!snapshot.empty) {
                    const userDoc = snapshot.docs[0];
                    const status = subscription.status; // 'active', 'past_due', 'canceled', etc.
                    
                    let tier = 'Intelligence';
                    if (status === 'canceled' || status === 'unpaid') {
                        tier = 'Free';
                    }

                    await userDoc.ref.set({
                        tier: tier,
                        subscriptionStatus: status
                    }, { merge: true });
                }
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Only mark the event processed once its handler has completed
        // successfully -- if we threw above, Stripe will retry, and the
        // event is correctly still eligible for reprocessing next time.
        await processedEventRef.set({
            type: event.type,
            processedAt: new Date().toISOString()
        });

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook handler failed:', error);
        return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
    }
}
