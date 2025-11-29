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

import { useState, useEffect, useCallback } from 'react';
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
  amount: string | number;
  token_symbol: string;
  token_address: string;
  chain_id: number | string; // Supports string for Solana
  chain_name: string;
  caption: string | null;
  status: string;
  paid_by?: string | null;
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

  /**
   * Fetch payment requests from API
   * NOTE: No mock data fallback - shows empty state if API fails or returns no data
   */
  const fetchPaymentRequests = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching payment requests from:', `${API_URL}/payment-requests`);
      
      // Fetch all requests (no status filter to get both open and paid)
      const response = await axios.get(`${API_URL}/payment-requests`, {
        timeout: 5000 // 5 second timeout
      });
      console.log('Payment requests response:', response.data);
      
      // If we got data, use it
      if (response.data && response.data.length > 0) {
        // Sort: open requests first, then paid (most recent first within each group)
        const allRequests = response.data.sort((a: PaymentRequest, b: PaymentRequest) => {
          // Open requests first (status === 'open')
          if (a.status === 'open' && b.status !== 'open') return -1;
          if (a.status !== 'open' && b.status === 'open') return 1;
          // Then by created_at (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        console.log('Sorted payment requests:', allRequests);
        setPaymentRequests(allRequests);
      } else {
        // No data from API, show empty state (DO NOT use mock data)
        console.log('No data from API');
        setPaymentRequests([]);
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
    } finally {
      setLoading(false);
    }
  }, []);

  // CRITICAL: Authentication check - DO NOT remove this
  useEffect(() => {
    // Check authentication - REQUIRED for this page
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        setUser(session.user);
        fetchPaymentRequests();
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    // Listen for auth changes - REQUIRED - DO NOT remove
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchPaymentRequests();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, fetchPaymentRequests]);


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
    <div className="min-h-screen bg-white h-screen overflow-y-auto">
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

