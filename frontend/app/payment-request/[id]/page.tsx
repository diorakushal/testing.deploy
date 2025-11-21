'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import toast from 'react-hot-toast';
import WalletConnect from '@/components/WalletConnect';
import PaymentRequestCard from '@/components/PaymentRequestCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface PaymentRequest {
  id: string;
  requester_address: string;
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
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>();

  useEffect(() => {
    fetchPaymentRequest();
  }, [requestId]);

  const fetchPaymentRequest = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/payment-requests/${requestId}`);
      setRequest(response.data);
    } catch (error: any) {
      console.error('Error fetching payment request:', error);
      console.log('Request ID:', requestId);
      console.log('Error details:', {
        status: error.response?.status,
        code: error.code,
        message: error.message
      });
      
      // Always try mock data fallback for any error
      const mockPaymentRequests = [
        {
          id: '1',
          requester_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: 50,
          token_symbol: 'USDC',
          token_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          chain_id: 8453,
          chain_name: 'Base',
          caption: 'tacos 🌮',
          status: 'open',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          requester_address: '0x8ba1f109551bD432803012645Hac136c2C1c',
          amount: 0.5,
          token_symbol: 'ETH',
          token_address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          chain_id: 1,
          chain_name: 'Ethereum',
          caption: 'Gas reimbursement',
          status: 'open',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          requester_address: '0x5c0d3b8a7d9e1F2f4a6B8d5e4c7a3B9d1E2f4a6',
          amount: 100,
          token_symbol: 'USDT',
          token_address: '0x55d398326f99059fF775485246999027B3197955',
          chain_id: 56,
          chain_name: 'BSC',
          caption: 'Design commission',
          status: 'open',
          created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '4',
          requester_address: '0x3a7b9c2d4e5f6a8b9c1d2e3f4a5b6c7d8e9f0a1b',
          amount: 75,
          token_symbol: 'USDC',
          token_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          chain_id: 1,
          chain_name: 'Ethereum',
          caption: 'Pay me back for drinks',
          status: 'paid',
          paid_by: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0',
          tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          paid_at: new Date(Date.now() - 43200000).toISOString()
        },
        {
          id: '5',
          requester_address: '0x2b4d6f8a9c1e3d5f7b9a2c4e6f8a1b3d5c7e9f2b',
          amount: 200,
          token_symbol: 'USDC',
          token_address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
          chain_id: 56,
          chain_name: 'BSC',
          caption: 'Freelance work completed',
          status: 'paid',
          paid_by: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
          tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          paid_at: new Date(Date.now() - 129600000).toISOString()
        },
        {
          id: '6',
          requester_address: '0x1f2e3d4c5b6a7980f1e2d3c4b5a6978f0e1d2c3b',
          amount: 150,
          token_symbol: 'DAI',
          token_address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          chain_id: 1,
          chain_name: 'Ethereum',
          caption: 'Music production fee',
          status: 'open',
          created_at: new Date(Date.now() - 10800000).toISOString()
        },
        {
          id: '7',
          requester_address: '0x9e8d7c6b5a4938271f0e1d2c3b4a5968f7e6d5c4b',
          amount: 0.01,
          token_symbol: 'BTC',
          token_address: '0x2260FAC5E5542a773Aa44fBCfeD7f193F2C6F3Aa',
          chain_id: 1,
          chain_name: 'Ethereum',
          caption: 'DAO reimbursement',
          status: 'open',
          created_at: new Date(Date.now() - 14400000).toISOString()
        },
        {
          id: '8',
          requester_address: '0x7f3e8d9c1b2a4f5e6d7c8b9a0f1e2d3c4b5a6978',
          amount: 500,
          token_symbol: 'USDC',
          token_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          chain_id: 1,
          chain_name: 'Ethereum',
          caption: 'Quarterly subscription payment',
          status: 'open',
          created_at: new Date(Date.now() - 18000000).toISOString()
        },
        {
          id: '9',
          requester_address: '0x6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d',
          amount: 1000000,
          token_symbol: 'SHIB',
          token_address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
          chain_id: 1,
          chain_name: 'Ethereum',
          caption: 'Meme coin payment 🐕',
          status: 'open',
          created_at: new Date(Date.now() - 21600000).toISOString()
        },
        {
          id: '10',
          requester_address: '0x5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c',
          amount: 25,
          token_symbol: 'USDT',
          token_address: '0x55d398326f99059fF775485246999027B3197955',
          chain_id: 56,
          chain_name: 'BSC',
          caption: 'Rent share for this month',
          status: 'open',
          created_at: new Date(Date.now() - 25200000).toISOString()
        },
        {
          id: '11',
          requester_address: '0x4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b',
          amount: 300,
          token_symbol: 'BNB',
          token_address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
          chain_id: 56,
          chain_name: 'BSC',
          caption: 'BSC native payment',
          status: 'open',
          created_at: new Date(Date.now() - 28800000).toISOString()
        }
      ];
      
      const mockRequest = mockPaymentRequests.find(r => r.id === requestId);
      if (mockRequest) {
        console.log('Found in mock data:', mockRequest);
        setRequest(mockRequest as PaymentRequest);
        return;
      }
      
      // Only show error if not found in mock data either
      if (error.response?.status === 404) {
        toast.error('Crypto request not found');
      } else {
        toast.error('Failed to load crypto request');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
            onClick={() => router.push('/')}
            className="text-[#00D07E] hover:underline"
          >
            Return to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white h-screen overflow-y-auto">
      {/* Header - Enhanced Design */}
      <header className="bg-white z-50 border-b border-gray-100 sticky top-0 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors duration-200 group">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Back to Feed</span>
              <span className="text-xs sm:text-sm font-semibold sm:hidden">Back</span>
            </Link>
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-start group">
              <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight transition-transform duration-200 group-hover:scale-105">numo</h1>
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              <WalletConnect 
                onConnect={(address: string) => {
                  setIsConnected(true);
                  setConnectedAddress(address);
                }} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Single Crypto Request Card */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col gap-0 max-w-2xl mx-auto">
          <PaymentRequestCard 
            request={request}
            userAddress={connectedAddress}
            onPaymentSuccess={fetchPaymentRequest}
          />
        </div>
      </main>
    </div>
  );
}

