import { stripe } from '../../utils/stripe';

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Fetch the customer in Stripe using their email
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (!customers.data.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers.data[0];

    // Fetch subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 10, // Adjust limit as needed
    });

    const subscriptionHistory = subscriptions.data.map((subscription) => ({
      id: subscription.id,
      plan: subscription.items.data[0]?.plan?.nickname || 'Unknown Plan',
      status: subscription.status,
      startDate: new Date(subscription.start_date * 1000).toLocaleDateString(),
      endDate: subscription.ended_at
        ? new Date(subscription.ended_at * 1000).toLocaleDateString()
        : 'Ongoing',
    }));

    res.status(200).json(subscriptionHistory);
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    res.status(500).json({ error: 'Error fetching subscription history' });
  }
}
