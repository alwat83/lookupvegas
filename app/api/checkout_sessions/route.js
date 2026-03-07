import Stripe from 'stripe';
import { cookies } from 'next/headers';

export async function POST(req) {
    try {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
            return Response.json({ error: "Stripe key not configured" }, { status: 500 });
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16', // or latest
        });

        const body = await req.json();

        // This is the URL we will redirect the user to after checkout
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        // Create Checkout Sessions from body params.
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'hosted',
            line_items: [
                {
                    // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${baseUrl}/intelligence/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/intelligence/cancel`,
        });

        return Response.json({ url: session.url });
    } catch (err) {
        console.error('Stripe Checkout Error:', err);
        return Response.json({ error: err.message }, { status: err.statusCode || 500 });
    }
}
