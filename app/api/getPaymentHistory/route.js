import { stripe } from '../../utils/stripe'; // Adjust path as per your project structure
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    // Parse the email from the query string
    const url = new URL(req.url);
    const userEmail = url.searchParams.get('email');
    if (!userEmail) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // Fetch customer details by email
    const customers = await stripe.customers.list({ email: userEmail });
    const customer = customers.data[0];

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found in Stripe' }, { status: 404 });
    }

    // Fetch active subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all', // Fetch all subscriptions (active, canceled, etc.)
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'No subscriptions found for this customer' }, { status: 404 });
    }

    // Fetch recent invoices for the customer
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: 10, // Fetch the latest 10 invoices
    });

    const paymentHistory = [];

    // Map through subscriptions and gather data
    for (const subscription of subscriptions.data) {
      const subscriptionItem = subscription.items.data[0];
      const productId = subscriptionItem?.price?.product;

      if (!productId) {
        paymentHistory.push({
          subscriptionId: subscription.id,
          error: 'No product associated with this subscription',
        });
        continue;
      }

      // Fetch product details
      const product = await stripe.products.retrieve(productId);

      // Loop through related invoices
      invoices.data.forEach(invoice => {
        if (invoice.subscription === subscription.id) {
          paymentHistory.push({
            paymentId: invoice.id,
            customerEmail: userEmail,
            customerName: customer.name || 'N/A',
            product: product.name || 'N/A',
            subscriptionStatus: subscription.status,
            subscriptionId: subscription.id,
            invoiceAmount: `$${(invoice.amount_paid / 100).toFixed(2)}`,
            created: new Date(invoice.created * 1000).toLocaleString(),
          });
        }
      });
    }

    return NextResponse.json(paymentHistory);

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json({ error: 'Failed to fetch payment history', details: error.message }, { status: 500 });
  }
}
