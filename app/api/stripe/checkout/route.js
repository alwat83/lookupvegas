import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../../lib/firebaseAdmin';

export async function POST(req) {
    try {
        const { userId, email, successUrl, cancelUrl } = await req.json();

        if (!userId || !email) {
            return NextResponse.json({ error: 'User ID and Email are required' }, { status: 400 });
        }

        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        const priceId = process.env.STRIPE_PRICE_ID_INTELLIGENCE;

        if (!stripeSecretKey || !priceId) {
            console.error('Stripe checkout misconfigured: STRIPE_SECRET_KEY or STRIPE_PRICE_ID_INTELLIGENCE is not set.');
            return NextResponse.json({ error: 'Billing is not configured' }, { status: 503 });
        }

        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

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
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${successUrl || `${baseUrl}/intelligence/success`}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${baseUrl}/intelligence/cancel`,
            metadata: {
                userId: userId,
                tier: 'Intelligence',
                priceId: priceId
            }
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
