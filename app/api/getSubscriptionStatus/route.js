import { stripe } from '../../utils/stripe'; // Adjust path as per your project structure
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const userEmail = req.url.split('?email=')[1];
    if (!userEmail) return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });

    const customers = await stripe.customers.list({ email: userEmail });
    const customer = customers.data[0];

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found in Stripe' }, { status: 404 });
    }

    const subscriptions = await stripe.subscriptions.list({ customer: customer.id });
    const subscriptionStatus = subscriptions.data.length > 0 ? subscriptions.data[0].status : 'inactive';

    return NextResponse.json({ status: subscriptionStatus });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 });
  }
}