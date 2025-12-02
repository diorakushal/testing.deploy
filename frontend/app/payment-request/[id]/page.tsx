'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import PaymentRequestCard from '@/components/PaymentRequestCard';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface PaymentRequest {
  id: string;
  requester_address: string;
  requester_username?: string | null; // Username from authenticated user account
  amount: string | number;
  token_symbol: string;
  token_address: string;
  chain_id: number | string;
  chain_name: string;
  caption: string | null;
  status: string;
  paid_by?: string | null;
  tx_hash?: string | null;
  created_at: string;
  paid_at?: string | null;
}

export default function PaymentRequestDetail() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Redirect to login if not authenticated
          router.push('/login');
          return;
        }
        setAuthLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const fetchPaymentRequest = useCallback(async (showLoading = true) => {
    console.log('[PaymentRequestDetail] 📡 Fetching payment request', {
      requestId,
      showLoading,
      currentRequestStatus: request?.status
    });
    
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await axios.get(`${API_URL}/payment-requests/${requestId}`);
      
      console.log('[PaymentRequestDetail] ✅ Payment request fetched', {
        requestId,
        responseStatus: response.data?.status,
        responseTxHash: response.data?.tx_hash,
        responsePaidBy: response.data?.paid_by,
        previousStatus: request?.status,
        statusChanged: request?.status !== response.data?.status
      });
      
      setRequest(response.data);
    } catch (error: any) {
      console.error('[PaymentRequestDetail] ❌ Error fetching payment request', {
        error,
        requestId,
        status: error.response?.status,
        code: error.code,
        message: error.message
      });
      
      // Only show error toast on initial load, not during polling
      if (showLoading) {
        // No mock data fallback - show error if request not found
        if (error.response?.status === 404) {
          toast.error('Crypto request not found');
        } else {
          toast.error('Failed to load crypto request');
        }
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [requestId, request?.status]);

  useEffect(() => {
    if (!authLoading) {
      fetchPaymentRequest(true); // Show loading on initial fetch
    }
  }, [requestId, authLoading, fetchPaymentRequest]);

  // Poll for status updates if request is open
  useEffect(() => {
    if (!request || request.status !== 'open') {
      return;
    }
    
    // Poll every 5 seconds to check for status updates
    const interval = setInterval(() => {
      fetchPaymentRequest(false); // Don't show loading during polling
    }, 5000);
    
    return () => clearInterval(interval);
  }, [request?.id, request?.status, fetchPaymentRequest]);

  // Show loading while checking authentication
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading crypto request...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-2">Crypto Request Not Found</h1>
          <button
            onClick={() => router.push('/feed')}
            className="text-[#00D07E] hover:underline"
          >
            Return to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white h-screen overflow-y-auto flex">
      {/* Header */}
      <Header 
        onWalletConnect={(address: string) => {
          setIsConnected(true);
          setConnectedAddress(address);
        }}
      />

      {/* Main Content - Single Crypto Request Card */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col gap-0 max-w-2xl mx-auto">
          <PaymentRequestCard 
            request={request}
            userAddress={connectedAddress}
            onPaymentSuccess={() => {
              console.log('[PaymentRequestDetail] 🔄 onPaymentSuccess called - refreshing request data');
              fetchPaymentRequest(false); // Don't show loading spinner on refresh
            }}
          />
        </div>
      </main>
    </div>
  );
}

