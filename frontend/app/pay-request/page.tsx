'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import CreateMarketSidebar from '@/components/CreateMarketSidebar';
import { supabase } from '@/lib/supabase';

export default function PayRequestPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingRef = useRef(loading);
  const hasCheckedAuthRef = useRef(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    let mounted = true;
    
    // Reset auth check ref when pathname changes (new navigation)
    // This ensures we check auth again when navigating to this page
    if (pathname === '/pay-request') {
      hasCheckedAuthRef.current = false;
    }
    
    // Check if user is authenticated
    const checkUser = async () => {
      // If we already checked auth recently and have a user, skip the check
      if (hasCheckedAuthRef.current && user) {
        setLoading(false);
        return;
      }
      
      try {
        // First try to get session from cache (synchronous check)
        // This is faster and doesn't hang
        const cachedSession = await supabase.auth.getSession();
        if (cachedSession.data?.session) {
          if (mounted) {
            setUser(cachedSession.data.session.user);
            setLoading(false);
            hasCheckedAuthRef.current = true;
            return;
          }
        }
        
        // If no cached session, do a fresh check with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          authTimeoutRef.current = setTimeout(() => {
            reject(new Error('Auth check timeout'));
          }, 2000); // Reduced to 2 second timeout for faster response
        });
        
        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as { data: { session: any } };
        
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
          authTimeoutRef.current = null;
        }
        
        if (!session) {
          if (mounted) {
            setLoading(false);
            hasCheckedAuthRef.current = false;
            router.push('/login');
          }
          return;
        }
        if (mounted) {
          setUser(session.user);
          setLoading(false);
          hasCheckedAuthRef.current = true;
          
          // Ensure user record exists in public.users table (non-blocking)
          const { ensureUserRecord } = await import('@/lib/auth-utils');
          ensureUserRecord(session.user).catch(err => {
            console.error('[PayRequest] Background ensureUserRecord failed:', err);
          });
        }
      } catch (error) {
        console.error('Error checking user:', error);
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
          authTimeoutRef.current = null;
        }
        // On timeout or error, use cached session if available
        if (mounted) {
          try {
            // Quick synchronous check from cache
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              setUser(session.user);
              setLoading(false);
              hasCheckedAuthRef.current = true;
              
              // Ensure user record exists in public.users table (non-blocking)
              const { ensureUserRecord } = await import('@/lib/auth-utils');
              ensureUserRecord(session.user).catch(err => {
                console.error('[PayRequest] Background ensureUserRecord failed:', err);
              });
            } else {
              setLoading(false);
              hasCheckedAuthRef.current = false;
              router.push('/login');
            }
          } catch (retryError) {
            console.error('Retry auth check failed:', retryError);
            setLoading(false);
            hasCheckedAuthRef.current = false;
            // Don't redirect on error - might be network issue, let user try again
          }
        }
      }
    };

    checkUser();
    
    // Safety timeout: Force loading to false after 5 seconds
    // This prevents infinite loading if auth check hangs
    const safetyTimeout = setTimeout(() => {
      if (mounted && loadingRef.current) {
        console.warn('[PayRequest] Auth check safety timeout - forcing loading to false');
        setLoading(false);
        // If we have a user from cache, use it
        if (!user) {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session && mounted) {
              setUser(session.user);
            }
          });
        }
      }
    }, 5000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session) {
        setLoading(false);
        hasCheckedAuthRef.current = false;
        router.push('/login');
      } else {
        setUser(session.user);
        setLoading(false);
        hasCheckedAuthRef.current = true;
        
        // Ensure user record exists in public.users table (non-blocking)
        const { ensureUserRecord } = await import('@/lib/auth-utils');
        ensureUserRecord(session.user).catch(err => {
          console.error('[PayRequest] Background ensureUserRecord failed:', err);
        });
      }
    });
    
    // Reset loading state when pathname changes (navigation detected)
    // This handles cases where navigation happens before auth check completes
    const pathnameCheckTimeout = setTimeout(() => {
      if (mounted && pathname === '/pay-request') {
        // Only reset if we're actually on this page and loading is stuck
        if (loadingRef.current && !hasCheckedAuthRef.current) {
          // If loading is stuck and we haven't checked auth, retry
          console.log('[PayRequest] Pathname changed, retrying auth check');
          checkUser();
        }
      }
    }, 100);

    // Handle visibility change to fix stuck loading states
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && mounted) {
        console.log('[PayRequest] Page became visible, checking auth state');
        // If loading is stuck, retry auth check
        if (loadingRef.current) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              setUser(session.user);
              setLoading(false);
            } else {
              setLoading(false);
              router.push('/login');
            }
          } catch (error) {
            console.error('[PayRequest] Error retrying auth check:', error);
            setLoading(false);
          }
        }
      }
    };

    const handleFocus = async () => {
      if (mounted && loadingRef.current) {
        console.log('[PayRequest] Window focused, checking auth state');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setUser(session.user);
            setLoading(false);
          } else {
            setLoading(false);
            router.push('/login');
          }
        } catch (error) {
          console.error('[PayRequest] Error retrying auth check on focus:', error);
          setLoading(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      clearTimeout(pathnameCheckTimeout);
      clearTimeout(safetyTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, pathname]); // Include pathname to detect navigation

  const handleSuccess = () => {
    // Refresh or redirect after successful payment/request
    // Add a small delay to ensure backend has processed the payment send
    setTimeout(() => {
      router.push('/feed');
      // Force a refresh when navigating to feed
      router.refresh();
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <CreateMarketSidebar onSuccess={handleSuccess} />
          </div>
        </div>
      </main>
    </div>
  );
}

