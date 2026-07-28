import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../../lib/firebaseAdmin';

export async function POST(req) {
    try {
        const { userId, returnUrl } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

        if (!stripeSecretKey) {
            console.error('Stripe portal misconfigured: STRIPE_SECRET_KEY is not set.');
            return NextResponse.json({ error: 'Billing is not configured' }, { status: 503 });
        }

        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

        const userDoc = await db.collection('users').doc(userId).get();
        const customerId = userDoc.data()?.stripeCustomerId;

        if (!customerId) {
            return NextResponse.json({ error: 'No Stripe customer found for this user' }, { status: 404 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Portal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
