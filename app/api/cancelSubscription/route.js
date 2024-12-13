import { supabase } from "../../../utils/supabaseClient";  // Adjust based on your file structure

export async function POST(req) {
  const { paymentId } = await req.json();

  try {
    // Fetch the payment details from the database based on paymentId
    const { data: paymentData, error } = await supabase
      .from("payments")
      .select("*")
      .eq("paymentId", paymentId)
      .single();

    if (error || !paymentData) {
      return new Response(JSON.stringify({ message: "Payment not found." }), {
        status: 404,
      });
    }

    // Check if the payment is active, and cancel it if it is
    if (paymentData.customerStatus === "active") {
      // Call the cancellation logic for the subscription (can involve API calls to Stripe or other services)
      
      // Example: Cancel the subscription (for Stripe, you would need to interact with Stripe API)
      const { error: cancelError } = await supabase
        .from("payments")
        .update({ customerStatus: "cancelled" })
        .eq("paymentId", paymentId);

      if (cancelError) {
        return new Response(JSON.stringify({ message: "Failed to cancel subscription." }), {
          status: 500,
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: "Subscription cancelled successfully." }),
        { status: 200 }
      );
    } else {
      return new Response(JSON.stringify({ message: "Subscription is not active." }), {
        status: 400,
      });
    }
  } catch (err) {
    console.error("Error canceling subscription:", err);
    return new Response(
      JSON.stringify({ message: "An error occurred while canceling the subscription." }),
      { status: 500 }
    );
  }
}
