import { stripe } from '../../utils/stripe'; // Adjust the path if necessary
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    console.log('API hit: /api/subscribe');

    // Parse the request payload
    const { email, plan } = await req.json();
    console.log('Request payload:', { email, plan });

    // Validate the email and plan
    if (!email || !plan) {
      return NextResponse.json(
        { error: 'Email and plan are required' },
        { status: 400 }
      );
    }

    let priceId;
    if (plan === 'basic') {
      priceId = process.env.STRIPE_BASIC_PLAN_ID;
    } else if (plan === 'premium') {
      priceId = process.env.STRIPE_PREMIUM_PLAN_ID;
    } else {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: email,
      success_url: `${process.env.BASE_URL}/user-dashboard?status=success`,
      cancel_url: `${process.env.BASE_URL}/user-dashboard?status=cancelled`,
    });

    console.log('Checkout session created:', session.id);

    // Return the session URL to the client
    return NextResponse.json({
      message: 'Subscription successfully created',
      sessionUrl: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription session', details: error.message },
      { status: 500 }
    );
  }
}
