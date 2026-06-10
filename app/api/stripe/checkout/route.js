import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../../lib/firebaseAdmin';

export async function POST(req) {
    try {
        const { userId, email, returnUrl } = await req.json();

        if (!userId || !email) {
            return NextResponse.json({ error: 'User ID and Email are required' }, { status: 400 });
        }

        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

        // Mock mode: if Stripe is not configured, simulate a successful upgrade
        if (!stripeSecretKey || stripeSecretKey === 'mock_key') {
            console.log('Stripe not configured. Running in MOCK mode.');
            
            // Immediately upgrade user in Firestore
            const userRef = db.collection('users').doc(userId);
            await userRef.set({
                tier: 'Intelligence',
                subscriptionStatus: 'active',
                stripeCustomerId: 'mock_cus_' + userId
            }, { merge: true });

            return NextResponse.json({ url: returnUrl + '?mock_success=true' });
        }

        // Real Stripe integration
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

        // 1. Get or create Stripe Customer
        const userDoc = await db.collection('users').doc(userId).get();
        let customerId = userDoc.data()?.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: email,
                metadata: { userId: userId }
            });
            customerId = customer.id;
            await db.collection('users').doc(userId).set({ stripeCustomerId: customerId }, { merge: true });
        }

        // 2. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID_INTELLIGENCE, // Expect this in .env
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: returnUrl,
            metadata: {
                userId: userId,
                tier: 'Intelligence'
            }
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
