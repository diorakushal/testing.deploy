'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import WalletConnect from '@/components/WalletConnect';
import PaymentRequestCard from '@/components/PaymentRequestCard';
// Fallback to relative path to ensure resolution in all environments
import CreateMarketSidebar from '../components/CreateMarketSidebar';

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

export default function Home() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>();

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  // Mock data for development/fallback
  const mockPaymentRequests: PaymentRequest[] = [
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

  const fetchPaymentRequests = async () => {
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
        // No data from API, use mock data
        console.log('No data from API, using mock data');
        const sortedMock = mockPaymentRequests.sort((a, b) => {
          if (a.status === 'open' && b.status !== 'open') return -1;
          if (a.status !== 'open' && b.status === 'open') return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setPaymentRequests(sortedMock);
      }
    } catch (error: any) {
      console.error('Error fetching payment requests:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      // If API fails, use mock data as fallback
      console.log('API failed, using mock data as fallback');
      const sortedMock = mockPaymentRequests.sort((a, b) => {
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (a.status !== 'open' && b.status === 'open') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setPaymentRequests(sortedMock);
    } finally {
      setLoading(false);
    }
  };

  // Filter payment requests by search query
  const filteredPaymentRequests = searchQuery.trim() === '' 
    ? paymentRequests 
    : paymentRequests.filter((request) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          request.caption?.toLowerCase().includes(searchLower) ||
          request.requester_address.toLowerCase().includes(searchLower) ||
          request.amount.toString().includes(searchQuery)
        );
      });

  return (
    <div className="min-h-screen bg-white h-screen overflow-y-auto">
      {/* Header - Enhanced Design */}
      <header className="bg-white z-50 sticky top-0 backdrop-blur-sm bg-white/95">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          {/* Single Line Header */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 py-3 sm:py-4">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/" className="flex items-center justify-start group">
                <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight transition-transform duration-200 group-hover:scale-105">
                  numo
                </h1>
              </Link>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 min-w-0 mx-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <svg 
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 ${searchQuery ? 'text-black' : 'text-gray-500'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by amount, token, caption, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 pl-11 sm:pl-12 pr-10 sm:pr-12 bg-white border-b-2 border-gray-200 text-sm sm:text-base outline-none focus:border-black transition-all duration-200 text-black placeholder-gray-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-black transition-colors duration-200"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Connect Wallet Button - Pushed to the right */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 ml-auto">
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

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 max-w-[1400px] lg:ml-0">
          {/* Create Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <CreateMarketSidebar onSuccess={fetchPaymentRequests} />
            </div>
          </div>

          {/* Main Feed */}
          <div className="flex flex-col gap-0">
            {/* Crypto Requests Feed */}
            {loading ? (
              <div className="flex flex-col gap-0">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse border border-gray-200">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredPaymentRequests.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg">
                  {searchQuery ? 'No crypto requests match your search' : 'No crypto requests found'}
                </p>
                {isConnected && !searchQuery && (
                  <p className="text-sm text-gray-500 mt-2">Create one in the sidebar</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-0">
                {filteredPaymentRequests.map((request) => (
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

