'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './../utils/supabaseClient';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Redirect already logged-in users to the appropriate dashboard
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error.message);
        return;
      }

      if (session) {
        // User is logged in, check role
        const { data: userInfo, error: roleError } = await supabase
          .from('user')
          .select('role')
          .eq('email', session.user.email)
          .single();

        if (roleError) {
          console.error('Error fetching user role:', roleError.message);
        } else {
          if (userInfo?.role === 'admin') {
            router.push('/admin-dashboard');  // Redirect to admin dashboard
          } else {
            router.push('/user-dashboard');  // Redirect to user dashboard
          }
        }
      }
    };
    checkSession();
  }, [router]);

  const handleAuth = async (e) => {
    e.preventDefault();

    if (isSignup) {
      // Signup logic
      const { error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setMessage(`Signup Error: ${error.message}`);
      } else {
        setMessage('Signup successful! Check your email to confirm.');
        // Insert user data with the role
        const { error: insertError } = await supabase
          .from('user')
          .insert([{ name, email, role: isAdmin ? 'admin' : 'user' }]);

        if (insertError) {
          setMessage(`Error inserting user data: ${insertError.message}`);
        } else {
          // Redirect to the login page after successful signup
          router.push('/auth');
        }
      }
    } else {
      // Login logic
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(`Login Error: ${error.message}`);
      } else {
        setMessage('Login successful! Redirecting...');
        // Check user role after login
        const { data: userInfo, error: roleError } = await supabase
          .from('user')
          .select('role')
          .eq('email', email)
          .single();

        if (roleError) {
          setMessage('Error fetching user role.');
        } else {
          if (userInfo?.role === 'admin') {
            router.push('/admin-dashboard');  // Redirect to admin dashboard
          } else {
            router.push('/user-dashboard');  // Redirect to user dashboard
          }
        }
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-800 via-black to-gray-400">
      <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${isSignup ? 'bg-gray-300 shadow-teal-500/50' : 'bg-gray-300 shadow-gray-400/50'}`}>
        <h1 className={`text-2xl font-semibold text-center mb-6 ${isSignup ? 'text-teal-600' : 'text-gray-700'}`}>
          {isSignup ? 'Sign Up' : 'Log In'}
        </h1>
        <form onSubmit={handleAuth}>
          {isSignup && (
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border-none rounded-lg shadow-sm focus:ring focus:ring-teal-300"
              />
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border-none rounded-lg shadow-sm focus:ring focus:ring-teal-300"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border-none rounded-lg shadow-sm focus:ring focus:ring-teal-300"
            />
          </div>

          {isSignup && (
            <div className="mb-4">
              <label className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="mr-2"
                />
                Admin Account
              </label>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-2 px-4 rounded-lg text-white ${isSignup ? 'bg-teal-500 hover:bg-teal-700 ' : 'bg-gray-500 hover:bg-gray-700 '}`}
          >
            {isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          {isSignup ? (
            <span className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => setIsSignup(false)}
                className="text-teal-500 hover:underline"
              >
                Login here
              </button>
            </span>
          ) : (
            <span className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setIsSignup(true)}
                className="text-teal-500 hover:underline"
              >
                Sign up here
              </button>
            </span>
          )}
        </div>

        {message && <div className="mt-4 text-center text-sm text-teal-500">{message}</div>}
      </div>
    </div>
  );
};

export default AuthForm;
