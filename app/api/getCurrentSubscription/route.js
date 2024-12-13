// /pages/api/getCurrentSubscription.js
import { stripe } from '../../utils/stripe';

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const customers = await stripe.customers.list({ email, limit: 1 });

    if (!customers.data.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers.data[0];

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
    });

    const currentSubscription = subscriptions.data.map((subscription) => ({
      id: subscription.id,
      plan: subscription.items.data[0]?.plan?.nickname || 'Unknown Plan',
      status: subscription.status,
      currentPeriodEnd: new Date(
        subscription.current_period_end * 1000
      ).toLocaleDateString(),
    }))[0]; // Assume only one active subscription

    res.status(200).json(currentSubscription || { message: 'No active subscription' });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({ error: 'Error fetching current subscription' });
  }
}
