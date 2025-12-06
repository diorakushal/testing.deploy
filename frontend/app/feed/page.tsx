'use client';

/**
 * ============================================================================
 * CRITICAL: DO NOT REVERT THIS FILE
 * ============================================================================
 * 
 * Feed Page - Payment Requests Feed
 * 
 * This file has been permanently updated and MUST NOT be reverted:
 * 
 * 1. REQUIRES AUTHENTICATION - redirects to /login if not authenticated
 * 2. NO MOCK DATA - only shows real data from API (empty state if no data)
 * 3. USES HEADER COMPONENT - must use <Header /> component, NOT custom header
 * 4. ZEMME BRANDING - Header component provides "Zemme" branding
 * 
 * DO NOT:
 * - Add back mock payment request data (mockPaymentRequests array)
 * - Remove authentication checks (checkAuth, onAuthStateChange)
 * - Create custom header with "numo" branding
 * - Remove Header component import and usage
 * - Revert to showing data without authentication
 * 
 * If you see "numo" in the header, the Header component is NOT being used!
 * ============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import PaymentRequestCard from '@/components/PaymentRequestCard';
import PaymentSendCard from '@/components/PaymentSendCard';
import { supabase } from '@/lib/supabase';
import { useAccount } from 'wagmi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface PaymentRequest {
  id: string;
  requester_address: string;
  requester_user_id?: string | null;
  requester_username?: string | null; // Username from authenticated user account
  requester_first_name?: string | null;
  requester_last_name?: string | null;
  recipient_user_id?: string | null;
  recipient_username?: string | null;
  recipient_first_name?: string | null;
  recipient_last_name?: string | null;
  amount: string | number;
  token_symbol: string;
  token_address: string;
  chain_id: number | string;
  chain_name: string;
  caption: string | null;
  status: string;
  paid_by?: string | null;
  paid_by_user_id?: string | null;
  paid_by_username?: string | null; // Username of the payer
  paid_by_first_name?: string | null;
  paid_by_last_name?: string | null;
  tx_hash?: string | null;
  created_at: string;
  paid_at?: string | null;
}

interface PaymentSend {
  id: string;
  sender_address: string;
  sender_user_id?: string | null;
  sender_username?: string | null;
  sender_first_name?: string | null;
  sender_last_name?: string | null;
  recipient_address: string;
  recipient_user_id?: string | null;
  recipient_username?: string | null;
  recipient_first_name?: string | null;
  recipient_last_name?: string | null;
  amount: string | number;
  token_symbol: string;
  token_address: string;
  chain_id: number | string;
  chain_name: string;
  caption: string | null;
  status: string;
  tx_hash?: string | null;
  created_at: string;
  sent_at?: string | null;
  confirmed_at?: string | null;
}

export default function Feed() {
  const router = useRouter();
  const pathname = usePathname();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [paymentSends, setPaymentSends] = useState<PaymentSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const fetchingRef = useRef(false);
  const initialLoadRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkingAuthRef = useRef(checkingAuth);
  const hasCheckedAuthRef = useRef(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    checkingAuthRef.current = checkingAuth;
  }, [checkingAuth]);
  
  // Use wagmi to get wallet connection state
  const { address: connectedAddress, isConnected } = useAccount();

  /**
   * Fetch payment sends from API
   */
  const fetchPaymentSends = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      console.log('[Feed] Fetching payment sends for user:', userId);
      
      if (!userId) {
        console.log('[Feed] No user ID, setting empty payment sends');
        setPaymentSends([]);
        return;
      }

      // Get user's wallet address from database (only use if it's actually stored in user profile)
      // This prevents showing transactions from wallets that aren't associated with this user account
      let userWalletAddress: string | null = null;
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('wallet_address')
          .eq('id', userId)
          .single();
        
        if (!profileError && userProfile?.wallet_address) {
          userWalletAddress = userProfile.wallet_address.toLowerCase();
        }
      } catch (err) {
        console.error('[Feed] Error getting user profile:', err);
      }
      
      // Only use connected wallet address if it matches the user's stored wallet address
      // This ensures we don't show transactions from wallets that aren't associated with this account
      const walletAddress = userWalletAddress && connectedAddress && 
        connectedAddress.toLowerCase() === userWalletAddress 
        ? userWalletAddress 
        : userWalletAddress; // Only use stored wallet address, not just any connected wallet
      
      console.log('[Feed] Fetching payment sends with userId:', userId, 'walletAddress:', walletAddress, 'connectedAddress:', connectedAddress);

      // Fetch sends where user is sender OR recipient
      // Only fetch by wallet address if it's actually stored in the user's profile
      const fetchPromises = [
        axios.get(`${API_URL}/payment-sends`, {
          params: { sender_user_id: userId },
          timeout: 10000
        }).catch((err) => {
          console.error('[Feed] Error fetching sends FROM user (by ID):', err);
          return { data: [] };
        }),
        axios.get(`${API_URL}/payment-sends`, {
          params: { recipient_user_id: userId },
          timeout: 10000
        }).catch((err) => {
          console.error('[Feed] Error fetching sends TO user (by ID):', err);
          return { data: [] };
        })
      ];

      // Only add wallet address queries if wallet is actually associated with this user
      if (walletAddress) {
        fetchPromises.push(
          axios.get(`${API_URL}/payment-sends`, {
            params: { sender_address: walletAddress },
            timeout: 10000
          }).catch((err) => {
            console.error('[Feed] Error fetching sends FROM user (by address):', err);
            return { data: [] };
          }),
          axios.get(`${API_URL}/payment-sends`, {
            params: { recipient_address: walletAddress },
            timeout: 10000
          }).catch((err) => {
            console.error('[Feed] Error fetching sends TO user (by address):', err);
            return { data: [] };
          })
        );
      }

      const results = await Promise.all(fetchPromises);
      const fromUser = results[0];
      const toUser = results[1];
      const fromAddress = results[2] || { data: [] };
      const toAddress = results[3] || { data: [] };

      console.log('[Feed] Payment sends FROM user (by ID):', fromUser.data?.length || 0, fromUser.data);
      console.log('[Feed] Payment sends TO user (by ID):', toUser.data?.length || 0, toUser.data);
      if (walletAddress) {
        console.log('[Feed] Payment sends FROM user (by address):', fromAddress.data?.length || 0, fromAddress.data);
        console.log('[Feed] Payment sends TO user (by address):', toAddress.data?.length || 0, toAddress.data);
      }

      const allSends = [...(fromUser.data || []), ...(toUser.data || []), ...(fromAddress.data || []), ...(toAddress.data || [])];
      const uniqueSends = Array.from(
        new Map(allSends.map((s: PaymentSend) => [s.id, s])).values()
      );

      // Sort by most recent first
      const sortedSends = uniqueSends.sort((a: PaymentSend, b: PaymentSend) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      console.log('[Feed] Total unique payment sends:', sortedSends.length, sortedSends);
      setPaymentSends(sortedSends);
    } catch (error: any) {
      console.error('[Feed] Error fetching payment sends:', error);
      setPaymentSends([]);
    }
  }, [connectedAddress]);

  /**
   * Fetch payment requests from API
   * NOTE: No mock data fallback - shows empty state if API fails or returns no data
   * Filters by authenticated user's ID to show only their payment requests
   */
  const fetchPaymentRequests = useCallback(async (showLoading = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      console.log('Already fetching payment requests, skipping...');
      return;
    }
    
    try {
      fetchingRef.current = true;
      // Only show loading on initial load or when explicitly requested
      if (showLoading || !initialLoadRef.current) {
        setLoading(true);
        
        // Set a safety timeout to ensure loading state is reset even if fetch hangs
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        loadingTimeoutRef.current = setTimeout(() => {
          console.warn('[Feed] Fetch timeout - resetting loading state');
          setLoading(false);
          fetchingRef.current = false;
        }, 30000); // 30 second timeout
      }
      console.log('[Feed] Starting to fetch payment requests...');
      
      // Get authenticated user ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (userId) {
        // Show requests created by user OR sent to user
        // Fetch both and combine them
        console.log('Fetching payment requests FROM and TO user:', userId);
        
        const [fromUser, toUser] = await Promise.all([
          axios.get(`${API_URL}/payment-requests`, {
            params: { requester_user_id: userId },
            timeout: 10000
          }).catch((err) => {
            console.error('Error fetching requests FROM user:', err);
            return { data: [] };
          }),
          axios.get(`${API_URL}/payment-requests`, {
            params: { recipient_user_id: userId },
            timeout: 10000
          }).catch((err) => {
            console.error('Error fetching requests TO user:', err);
            return { data: [] };
          })
        ]);
        
        console.log('Requests FROM user:', fromUser.data?.length || 0, fromUser.data);
        console.log('Requests TO user:', toUser.data?.length || 0, toUser.data);
        
        // Combine and deduplicate by ID
        const allRequests = [...(fromUser.data || []), ...(toUser.data || [])];
        const uniqueRequests = Array.from(
          new Map(allRequests.map((r: PaymentRequest) => [r.id, r])).values()
        );
        
        // Sort: open requests first, then paid (most recent first within each group)
        const sortedRequests = uniqueRequests.sort((a: PaymentRequest, b: PaymentRequest) => {
          if (a.status === 'open' && b.status !== 'open') return -1;
          if (a.status !== 'open' && b.status === 'open') return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        console.log('Combined payment requests (total):', sortedRequests.length, sortedRequests);
        setPaymentRequests(sortedRequests);
        setLoading(false); // Set loading to false immediately after setting data
        initialLoadRef.current = true; // Mark initial load as complete
        // Clear timeout since fetch completed successfully
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      } else {
        // No user ID - fetch all (shouldn't happen if authenticated)
        console.log('No user ID, fetching all payment requests');
        const response = await axios.get(`${API_URL}/payment-requests`, {
          timeout: 5000
        });
        
        if (response.data && response.data.length > 0) {
          const sortedRequests = response.data.sort((a: PaymentRequest, b: PaymentRequest) => {
            if (a.status === 'open' && b.status !== 'open') return -1;
            if (a.status !== 'open' && b.status === 'open') return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          setPaymentRequests(sortedRequests);
        } else {
          setPaymentRequests([]);
        }
        setLoading(false); // Set loading to false after setting data
        initialLoadRef.current = true; // Mark initial load as complete
        // Clear timeout since fetch completed successfully
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    } catch (error: any) {
      console.error('Error fetching payment requests:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      // CRITICAL: If API fails, show empty state - DO NOT use mock data as fallback
      // DO NOT add: setPaymentRequests(mockPaymentRequests) or similar
      console.log('API failed, showing empty state');
      setPaymentRequests([]);
      setLoading(false); // Always set loading to false on error
      // Clear timeout on error
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    } finally {
      // Ensure loading is always set to false and ref is cleared
      setLoading(false);
      fetchingRef.current = false;
      // Clear timeout in finally block as well
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, []);

  // CRITICAL: Authentication check - DO NOT remove this
  useEffect(() => {
    let mounted = true;
    let authTimeout: NodeJS.Timeout | null = null;
    
    // Reset auth check ref when pathname changes (new navigation)
    // This ensures we check auth again when navigating to this page
    if (pathname === '/feed') {
      hasCheckedAuthRef.current = false;
    }
    
    // Check authentication - REQUIRED for this page
    const checkAuth = async () => {
      // If we already checked auth recently and have a user, skip the check
      if (hasCheckedAuthRef.current && user) {
        setCheckingAuth(false);
        return;
      }
      
      try {
        // First try to get session from cache (faster, doesn't hang)
        const cachedSession = await supabase.auth.getSession();
        if (cachedSession.data?.session) {
          if (mounted) {
            setUser(cachedSession.data.session.user);
            setCheckingAuth(false);
            hasCheckedAuthRef.current = true;
            // Fetch payment requests and sends after auth is confirmed
            if (!initialLoadRef.current) {
              fetchPaymentRequests(true);
            } else {
              fetchPaymentRequests(false);
            }
            fetchPaymentSends();
            return;
          }
        }
        
        // If no cached session, do a fresh check with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          authTimeout = setTimeout(() => {
            reject(new Error('Auth check timeout'));
          }, 2000); // Reduced to 2 second timeout for faster response
        });
        
        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as { data: { session: any } };
        
        if (authTimeout) {
          clearTimeout(authTimeout);
          authTimeout = null;
        }
        
        if (!session) {
          if (mounted) {
            setCheckingAuth(false);
            hasCheckedAuthRef.current = false;
            router.push('/login');
          }
          return;
        }
        if (mounted) {
          setUser(session.user);
          setCheckingAuth(false); // Set this first so component can render
          hasCheckedAuthRef.current = true;
          
          // Ensure user record exists in public.users table (non-blocking)
          // Don't await - let it run in background so it doesn't block rendering
          const { ensureUserRecord } = await import('@/lib/auth-utils');
          ensureUserRecord(session.user).catch(err => {
            console.error('[Feed] Background ensureUserRecord failed:', err);
            // Non-critical, don't block UI
          });
          
          // Fetch payment requests and sends after auth is confirmed
          // Only show loading on initial load
          if (!initialLoadRef.current) {
            fetchPaymentRequests(true);
          } else {
            fetchPaymentRequests(false);
          }
          fetchPaymentSends();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (authTimeout) {
          clearTimeout(authTimeout);
          authTimeout = null;
        }
        // On timeout or error, try to get cached session
        if (mounted) {
          try {
            // Quick check from cache
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              setUser(session.user);
              setCheckingAuth(false);
              hasCheckedAuthRef.current = true;
              
              // Ensure user record exists in public.users table (non-blocking)
              const { ensureUserRecord } = await import('@/lib/auth-utils');
              ensureUserRecord(session.user).catch(err => {
                console.error('[Feed] Background ensureUserRecord failed:', err);
              });
              
              if (!initialLoadRef.current) {
                fetchPaymentRequests(true);
              } else {
                fetchPaymentRequests(false);
              }
              fetchPaymentSends();
            } else {
              setCheckingAuth(false);
              hasCheckedAuthRef.current = false;
              router.push('/login');
            }
          } catch (retryError) {
            console.error('Retry auth check failed:', retryError);
            setCheckingAuth(false);
            hasCheckedAuthRef.current = false;
            // Don't redirect on error - might be network issue
          }
        }
      }
    };

    checkAuth();
    
    // Safety timeout: Force checkingAuth to false after 5 seconds
    // This prevents infinite loading if auth check hangs
    const safetyTimeout = setTimeout(() => {
      if (mounted && checkingAuthRef.current) {
        console.warn('[Feed] Auth check safety timeout - forcing checkingAuth to false');
        setCheckingAuth(false);
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

    // Listen for auth changes - REQUIRED - DO NOT remove
    // Only refetch if session actually changes (not on every event)
    let lastUserId: string | null = null;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      if (!session) {
        if (lastUserId !== null) {
          // Only redirect if we had a session before
          router.push('/login');
        }
        lastUserId = null;
      } else {
        const currentUserId = session.user.id;
        // Only refetch if user ID actually changed
        if (lastUserId !== currentUserId) {
          setUser(session.user);
          // Don't show loading spinner on auth state changes, just refresh data
          fetchPaymentRequests(false);
          fetchPaymentSends();
          lastUserId = currentUserId;
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      // Clear any pending timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (authTimeout) {
        clearTimeout(authTimeout);
        authTimeout = null;
      }
      clearTimeout(safetyTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, pathname]); // Include pathname to detect navigation

  // Refresh on focus/visibility change (when user navigates back to the page or switches tabs)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // When page becomes visible again, clear any stuck states and retry
      if (document.visibilityState === 'visible') {
        console.log('[Feed] Page became visible, clearing stuck states and refreshing data');
        
        // Clear stuck fetching state to allow retry
        fetchingRef.current = false;
        
        // Reset loading state if fetch is stuck
        // This handles cases where a fetch was interrupted by tab switching
        setLoading((prevLoading) => {
          if (prevLoading) {
            console.log('[Feed] Loading state was stuck, resetting...');
          }
          return false;
        });
        
        // If checkingAuth is stuck, try to quickly verify session
        if (checkingAuthRef.current) {
          console.log('[Feed] Auth check was stuck, retrying...');
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              setUser(session.user);
              setCheckingAuth(false);
              fetchPaymentSends();
              fetchPaymentRequests(false);
            } else {
              setCheckingAuth(false);
              router.push('/login');
            }
          } catch (error) {
            console.error('[Feed] Error retrying auth check:', error);
            setCheckingAuth(false);
          }
        } else {
          // Retry fetching data
          // Don't show loading spinner on visibility refresh
          fetchPaymentSends();
          fetchPaymentRequests(false);
        }
      }
    };

    const handleFocus = async () => {
      console.log('[Feed] Window focused, refreshing payment sends and requests');
      // Clear stuck fetching state
      fetchingRef.current = false;
      
      // If checkingAuth is stuck, try to quickly verify session
      if (checkingAuthRef.current) {
        console.log('[Feed] Auth check was stuck on focus, retrying...');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setUser(session.user);
            setCheckingAuth(false);
            fetchPaymentSends();
            fetchPaymentRequests(false);
          } else {
            setCheckingAuth(false);
            router.push('/login');
          }
        } catch (error) {
          console.error('[Feed] Error retrying auth check on focus:', error);
          setCheckingAuth(false);
        }
      } else {
        // Don't show loading spinner on focus refresh
        fetchPaymentSends();
        fetchPaymentRequests(false);
      }
    };

    // Use both visibility API (for tab switching) and focus (for window switching)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - use refs to access current state

  // Fetch contacts for nickname lookup
  const fetchContacts = useCallback(async (userId: string) => {
    try {
      const response = await axios.get(`${API_URL}/contacts?userId=${userId}`);
      setContacts(response.data || []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      // Don't show error toast - contacts are optional
    }
  }, []);

  // Refresh data when navigating to this page (pathname changes to /feed)
  useEffect(() => {
    if (pathname === '/feed' && user && !checkingAuth) {
      console.log('[Feed] Navigated to feed page, fetching data');
      // Only show loading if this is the first time loading
      if (!initialLoadRef.current) {
        fetchPaymentRequests(true);
      } else {
        fetchPaymentRequests(false);
      }
      fetchPaymentSends();
      fetchContacts(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user, checkingAuth]); // Re-fetch when pathname changes to /feed and user/auth is ready


  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col gap-0 max-w-4xl mx-auto">
            {/* Combined Feed: Payment Requests + Payment Sends */}
            {loading ? (
              <div className="flex flex-col gap-0">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse border border-gray-200">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : paymentRequests.length === 0 && paymentSends.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg">
                  No payments found
                </p>
                <p className="text-sm text-gray-500 mt-2">Go to Pay & Request to create one</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0">
                {/* Combine and sort by created_at */}
                {[...paymentRequests, ...paymentSends.map(send => ({
                  ...send,
                  type: 'send' as const
                }))].sort((a, b) => {
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }).map((item) => {
                  if ('type' in item && item.type === 'send') {
                    // Render payment send
                    const send = item as PaymentSend & { type: 'send' };
                    return (
                      <PaymentSendCard
                        key={send.id}
                        send={send}
                        userAddress={connectedAddress}
                        userId={user?.id || null}
                        contacts={contacts}
                      />
                    );
                  } else {
                    // Render payment request
                    const request = item as PaymentRequest;
                    return (
                      <PaymentRequestCard 
                        key={request.id} 
                        request={request}
                        userAddress={connectedAddress}
                        userId={user?.id || null}
                        contacts={contacts}
                        onPaymentSuccess={() => {
                          fetchPaymentRequests();
                          fetchPaymentSends();
                        }}
                      />
                    );
                  }
                })}
              </div>
            )}
        </div>
      </main>


    </div>
  );
}

