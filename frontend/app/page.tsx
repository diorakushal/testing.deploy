'use client';

/**
 * Root page - redirects to /login if not authenticated, or /feed if authenticated
 */

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return;

    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Only redirect if we're on the root path
        if (pathname === '/') {
          if (session) {
            // User is authenticated, redirect to feed
            hasRedirected.current = true;
            router.replace('/feed');
          } else {
            // User is not authenticated, redirect to login
            hasRedirected.current = true;
            router.replace('/login');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, redirect to login only if on root path
        if (pathname === '/') {
          hasRedirected.current = true;
          router.replace('/login');
        }
      }
    };

    checkAuthAndRedirect();

    // Listen for auth changes - but only redirect if on root path
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (pathname === '/' && !hasRedirected.current) {
        if (session) {
          hasRedirected.current = true;
          router.replace('/feed');
        } else {
          hasRedirected.current = true;
          router.replace('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

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
