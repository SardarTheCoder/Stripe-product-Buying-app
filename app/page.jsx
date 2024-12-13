'use client';

import { useEffect, useState } from 'react';
import { supabase } from './utils/supabaseClient'; // Adjust the path as necessary
import { useRouter } from 'next/navigation';

const Home = () => {
  const [userRole, setUserRole] = useState(null); // Store user role (admin or user)
  const [loading, setLoading] = useState(true); // Handle loading state
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error fetching session:', sessionError.message);
        setLoading(false);
        return;
      }

      if (session) {
        // Fetch the user's role from the "user" table in Supabase
        const { data, error } = await supabase
          .from('user')
          .select('role')
          .eq('email', session.user.email)
          .single();

        if (error) {
          console.error('Error fetching user role:', error.message);
        } else {
          setUserRole(data?.role); // Set the role (admin or user)
        }
      } else {
        // If no session, set userRole to null
        setUserRole(null);
      }

      setLoading(false); // Set loading to false after checking session
    };

    checkUserRole();
  }, []);

  useEffect(() => {
    // Redirect based on userRole
    if (userRole === 'admin') {
      router.push('/admin-dashboard');
    } else if (userRole === 'user') {
      router.push('/user-dashboard');
    }
  }, [userRole, router]);

  if (loading) {
    return <div className="text-center text-xl">Loading...</div>;
  }

  if (!userRole) {
    return <div className="text-center text-xl">Session not found</div>;
  }

  return null; // This will not render as redirection happens in useEffect
};

export default Home;
