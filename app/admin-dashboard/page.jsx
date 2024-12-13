"use client"
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/navigation';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]); 
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { email } = session.user;
        if (email) {
          const { data: userInfo, error } = await supabase
            .from('user')
            .select('role')
            .eq('email', email)
            .single();
          
          if (error) {
            console.error('Error fetching user role:', error.message);
          } else {
            if (userInfo?.role === 'admin') {
              fetchUsers();
            } else {
              router.push('/user-dashboard');
            }
          }
        }
      }
    };
    
    checkAdminRole();
  }, [router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user")
        .select("*");
      
      if (error) throw error;

      const filteredUsers = data.filter(user => user.role !== 'admin');
      setUsers(filteredUsers || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error.message);
      setLoading(false);
      setErrorMessage('Failed to load users.');
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/getSubscriptions');
      const data = await response.json();
      if (data?.error) {
        setErrorMessage(data.error);
        console.error('Error fetching Stripe subscriptions:', data.error);
      } else {
        setSubscriptions(data);
      }
    } catch (error) {
      setErrorMessage('Error fetching subscriptions from Stripe.');
      console.error('Error fetching Stripe subscriptions:', error.message);
    }
  };

  const getSubscriptionPlans = (email) => {
    return subscriptions.filter((sub) => sub.customer.email === email);
  };

  const openModal = (user) => {
    const userSubscriptions = getSubscriptionPlans(user.email);

    setSelectedUser({
      ...user,
      subscriptions: userSubscriptions.length
        ? userSubscriptions.map((subscription) => ({
            subscriptionId: subscription.id,
            product: subscription.productName,
            plan: subscription.items.data[0].plan.nickname,
            monthlyTotal: (subscription.items.data[0].plan.amount / 100).toFixed(2),
            yearlyTotal: ((subscription.items.data[0].plan.amount / 100) * 12).toFixed(2),
            startDate: new Date(subscription.start_date).toLocaleDateString(),
            status: subscription.status,
          }))
        : [],
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-semibold text-center mb-8">Admin Dashboard</h1>
      <div className="overflow-x-auto bg-gradient-to-br from-slate-400 via-black to-slate-400 rounded-lg shadow-xl">
        {errorMessage && <div className="text-red-500 text-center mb-4">{errorMessage}</div>}
        <table className="min-w-full table-auto text-sm text-gray-100">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Role</th>
              <th className="py-3 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-4 text-center">
                  <div className="animate-pulse text-xl">Loading...</div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-700">
                  <td className="py-3 px-4">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.role}</td>
                  <td className="py-3 px-4">
                    <button
                      className="bg-gradient-to-r from-gray-400 via-black to-slate-400 text-white px-4 py-2 rounded"
                      onClick={() => openModal(user)} // Trigger modal open
                    >
                      Show Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gradient-to-r from-black via-gray-600 to-black p-6 rounded-lg w-full max-w-4xl">
            <h2 className="text-2xl font-semibold mb-4">Subscription Details</h2>
            <div className="mb-2">
              <strong>Name:</strong> {selectedUser.name}
            </div>
            <div className="mb-2">
              <strong>Email:</strong> {selectedUser.email}
            </div>
        
            <h3 className="text-xl font-semibold mt-4">Subscriptions:</h3>
        
            {selectedUser.subscriptions && selectedUser.subscriptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-sm text-gray-100">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-2 px-4 text-left">Product</th>
                      <th className="py-2 px-4 text-left">Start Date</th>
                      <th className="py-2 px-4 text-left">Status</th>
                      <th className="py-2 px-4 text-left">Monthly Total</th>
                      <th className="py-2 px-4 text-left">Yearly Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUser.subscriptions.map((sub, index) => (
                      <tr key={index} className="border-b border-gray-700">
                        <td className="py-2 px-4">{sub.product}</td>
                        <td className="py-2 px-4">{sub.startDate}</td>
                        <td className="py-2 px-4">{sub.status}</td>
                        <td className="py-2 px-4">${sub.monthlyTotal}</td>
                        <td className="py-2 px-4">${sub.yearlyTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>No subscriptions found for this user.</div>
            )}
        
            <div className="mt-4">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={closeModal} // Close modal on click
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
