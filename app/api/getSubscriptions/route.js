import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export async function GET() {
  try {
    const subscriptions = await stripe.subscriptions.list({
      status: 'all', // Get all subscriptions
      expand: ['data.customer'], // Expand to get customer details if needed
    });

    const enhancedSubscriptions = await Promise.all(subscriptions.data.map(async (subscription) => {
      // Ensure items and data[0] exist
      if (!subscription.items?.data?.[0]) {
        console.warn(`Subscription with ID ${subscription.id} has no items.`);
        return { ...subscription, productName: 'Unknown Product' }; // Return subscription with default product name
      }

      const productId = subscription.items.data[0].plan?.product;

      // Ensure productId exists
      if (!productId) {
        console.warn(`Subscription with ID ${subscription.id} has no product.`);
        return { ...subscription, productName: 'Unknown Product' }; // Return subscription with default product name
      }

      // Fetch product details
      const product = await stripe.products.retrieve(productId);

      return {
        ...subscription,
        productName: product.name || 'Unknown Product', // Add product name
      };
    }));

    return NextResponse.json(enhancedSubscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error.message);
    return NextResponse.json({ error: error.message });
  }
}
