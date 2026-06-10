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

        // Mock mode
        if (!stripeSecretKey || stripeSecretKey === 'mock_key') {
            console.log('Stripe not configured. MOCK portal.');
            
            // Just simulate a downgrade or billing check
            // For mock, we'll just return the user to the pricing page
            return NextResponse.json({ url: returnUrl + '?mock_portal=true' });
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
