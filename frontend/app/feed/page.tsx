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
 * 4. XELLI BRANDING - Header component provides "Xelli" branding
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
import { useRouter } from 'next/navigation';
import axios from 'axios';
import PaymentRequestCard from '@/components/PaymentRequestCard';
import CreateMarketSidebar from '@/components/CreateMarketSidebar';
import Header from '@/components/Header'; // REQUIRED - Do not remove or replace with custom header
import { supabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface PaymentRequest {
  id: string;
  requester_address: string;
  requester_username?: string | null; // Username from authenticated user account
  amount: string | number;
  token_symbol: string;
  token_address: string;
  chain_id: number | string; // Supports string for Solana
  chain_name: string;
  caption: string | null;
  status: string;
  paid_by?: string | null;
  paid_by_username?: string | null; // Username of the payer
  tx_hash?: string | null;
  created_at: string;
  paid_at?: string | null;
}

export default function Feed() {
  const router = useRouter();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>();
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const fetchingRef = useRef(false);

  /**
   * Fetch payment requests from API
   * NOTE: No mock data fallback - shows empty state if API fails or returns no data
   * Filters by authenticated user's ID to show only their payment requests
   */
  const fetchPaymentRequests = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      console.log('Already fetching payment requests, skipping...');
      return;
    }
    
    try {
      fetchingRef.current = true;
      setLoading(true);
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
    } finally {
      // Ensure loading is always set to false and ref is cleared
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // CRITICAL: Authentication check - DO NOT remove this
  useEffect(() => {
    let mounted = true;
    
    // Check authentication - REQUIRED for this page
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (mounted) {
            router.push('/login');
          }
          return;
        }
        if (mounted) {
          setUser(session.user);
          // Fetch payment requests after auth is confirmed
          fetchPaymentRequests();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (mounted) {
          router.push('/login');
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkAuth();

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
          fetchPaymentRequests();
          lastUserId = currentUserId;
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, fetchPaymentRequests]); // Include fetchPaymentRequests to ensure it's available


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
      {/* CRITICAL: Must use Header component - DO NOT create custom header with "numo" */}
      <Header 
        onWalletConnect={(address: string) => {
          setIsConnected(true);
          setConnectedAddress(address);
        }}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
          {/* Create Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-20 z-40 bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <CreateMarketSidebar onSuccess={fetchPaymentRequests} />
            </div>
          </div>

          {/* Main Feed */}
          <div className="flex flex-col gap-0">
            {/* Payment Requests Feed */}
            {loading ? (
              <div className="flex flex-col gap-0">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse border border-gray-200">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : paymentRequests.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg">
                  No payment requests found
                </p>
                <p className="text-sm text-gray-500 mt-2">Create one in the sidebar</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0">
                {paymentRequests.map((request) => (
                  <PaymentRequestCard 
                    key={request.id} 
                    request={request}
                    userAddress={connectedAddress}
                    onPaymentSuccess={fetchPaymentRequests}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>


    </div>
  );
}

