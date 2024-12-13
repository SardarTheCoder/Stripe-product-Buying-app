"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./../utils/supabaseClient";
import { PulseLoader } from "react-spinners";

const UserDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(""); // User name state
  const [subscriptionStatus, setSubscriptionStatus] = useState(""); // Subscription status state
  const [userData, setUserData] = useState({}); // User data state
  const [paymentHistory, setPaymentHistory] = useState([]); // Payment history state

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth");
      } else {
        // Safely set userName by checking for session and email
        const name = session.user.email.split("@")[0];
        setUserName(name);
        setLoading(false);

        const { data, error } = await supabase
          .from("user")
          .select("*")
          .eq("email", session.user.email)
          .single();

        if (error) {
          console.error("Error fetching user details:", error.message);
        } else {
          setUserData(data);
          setSubscriptionStatus(data.subscriptionStatus || "inactive");
        }
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch(`/api/getSubscriptionStatus?email=${userData.email}`);
        const data = await response.json();
        if (data.status) {
          setSubscriptionStatus(data.status);
        }
      } catch (error) {
        console.error("Error fetching subscription status:", error);
      }
    };

    if (userData.email) {
      fetchSubscriptionStatus();
    }
  }, [userData]);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const response = await fetch(`/api/getPaymentHistory?email=${userData.email}`);
        const data = await response.json();

        if (Array.isArray(data)) {
          setPaymentHistory(data);
        } else {
          setPaymentHistory([]);
          console.error("Invalid payment history data:", data);
        }
      } catch (error) {
        console.error("Error fetching payment history:", error);
        setPaymentHistory([]);
      }
    };

    if (userData.email) {
      fetchPaymentHistory();
    }
  }, [userData]);

  const handleSubscribe = async (plan) => {
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: userData.email, plan }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        alert("Subscription failed: No session URL received");
      }
    } catch (error) {
      console.error("Error in handleSubscribe:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const handleCancelSubscription = async (paymentId) => {
    try {
      const response = await fetch("/api/cancelSubscription", {
        method: "POST",
        body: JSON.stringify({ paymentId }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        alert("Subscription cancelled successfully.");
      } else {
        alert("Failed to cancel the subscription.");
      }
    } catch (error) {
      console.error("Error in handleCancelSubscription:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <PulseLoader color="#FFF" size={35} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col shadow-2xl shadow-gray-600 bg-gradient-to-br from-black via-gray-700 to-black text-white">
      <header className="bg-black bg-opacity-90 p-6 shadow-lg">
        <h1 className="text-4xl font-bold text-center text-teal-400">
          Welcome, {userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : "User"}!
        </h1>
        <p className="text-center text-gray-300 mt-2">
          Manage your subscriptions and view your details below.
        </p>
      </header>

      <main className="flex-grow container mx-auto p-6 lg:p-10 space-y-10">
        {/* Subscription Status */}
        <div className="p-6 bg-gradient-to-r from-slate-700 via-white to-gray-700 rounded-lg shadow-lg text-black">
          <h2 className="text-2xl font-semibold mb-4">Subscription Status</h2>
          <p
            className={`text-lg ${subscriptionStatus === "active"
              ? "text-green-600"
              : subscriptionStatus === "expired"
                ? "text-red-600"
                : "text-yellow-600"
              }`}
          >
            {subscriptionStatus ? subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1) : "Inactive"}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={() => handleSubscribe("basic")}
              className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700"
            >
              Subscribe to Basic
            </button>
            <button
              onClick={() => handleSubscribe("premium")}
              className="bg-teal-600 text-white py-2 px-6 rounded-lg hover:bg-teal-700"
            >
              Subscribe to Premium
            </button>
          </div>
        </div>

        {/* Payment History */}
        <div className="p-6 bg-gradient-to-r from-slate-700 via-white to-gray-700 shadow-2xl shadow-gray-600 rounded-lg text-black">
          <h2 className="text-2xl font-semibold mb-4">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-300 text-black uppercase">
                <tr>
                  <th className="py-3 px-6 text-center">Date</th>
                  <th className="py-3 px-6 text-center">Amount (Monthly)</th>
                  <th className="py-3 px-6 text-center">Amount (Yearly)</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-center">Customer</th>
                  <th className="py-3 px-6 text-center">Product</th>
                  <th className="py-3 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.paymentId} className="hover:bg-gray-200">
                    <td className="py-3 px-6 text-center">{payment.created}</td>
                    <td className="py-3 px-6 text-center">{payment.averageMonthlyTotal}</td>
                    <td className="py-3 px-6 text-center">{payment.averageYearlyTotal}</td>
                    <td
                      className={`py-3 px-6 ${payment.customerStatus === "active" ? "text-green-600" : "text-red-600"}`}
                    >
                      {payment.customerStatus ? payment.customerStatus.charAt(0).toUpperCase() + payment.customerStatus.slice(1) : "Unknown"}
                    </td>
                    <td className="py-3 px-6 text-center">{payment.customerName || "Unknown"}</td>
                    <td className="py-3 px-6 text-center">{payment.product || "Product information unavailable"}</td>
                    <td className="py-3 px-6 text-center">
                      {/* Conditionally render the button based on product */}
                      {payment.product === "tracker premium" ? (
                        <button
                          onClick={() => handleSubscribe("basic")}
                          className="bg-violet-500 text-white py-1 transition-all px-4 rounded-lg hover:bg-violet-700"
                        >
                          Downgrade
                        </button>
                      ) : payment.product === "tracker normal" ? (
                        <button
                          onClick={() => handleSubscribe("premium")}
                          className="bg-green-500 text-white py-1 transition-all px-4 rounded-lg hover:bg-green-700"
                        >
                          Upgrade
                        </button>
                      ) : (
                        <span>Product unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="bg-black bg-opacity-90 text-center text-gray-200 p-4 mt-6">
        © 2024 $ardar. All rights reserved.
      </footer>
    </div>
  );
};

export default UserDashboard;
