'use client';

/**
 * Root page - redirects to /login if not authenticated, or /feed if authenticated
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // User is authenticated, redirect to feed
          router.push('/feed');
        } else {
          // User is not authenticated, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, redirect to login
        router.push('/login');
      }
    };

    checkAuthAndRedirect();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.push('/feed');
      } else {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Show loading while checking auth
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
