'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import toast from 'react-hot-toast';
import WalletConnect from '@/components/WalletConnect';
import MarketCard from '@/components/MarketCard';
import PostTakeModal from '@/components/PostTakeModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Market {
  id: string;
  title: string;
  category: string;
  created_at: string;
  ends_at: string;
  total_agree_stakes: number;
  total_disagree_stakes: number;
  creator_address: string;
  status?: string;
  winner?: number;
}

export default function MarketDetail() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;

  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>();
  const [showPostTake, setShowPostTake] = useState(false);
  const [postTakeMarket, setPostTakeMarket] = useState<{id: string, title: string, initialSide?: 'agree' | 'disagree', initialAmount?: string, data?: any} | null>(null);

  useEffect(() => {
    fetchMarket();
  }, [marketId]);

  const fetchMarket = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/markets/${marketId}`);
      setMarket(response.data);
    } catch (error) {
      console.error('Error fetching market:', error);
      // Use mock data as fallback
      const { mockMarkets } = await import('@/components/MockData');
      const mockMarket = mockMarkets.find(m => m.id === marketId);
      if (mockMarket) {
        setMarket(mockMarket as any);
      } else {
        toast.error('Market not found');
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
          <p className="mt-4 text-gray-600">Loading market...</p>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-2">Market Not Found</h1>
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
      {/* Header - Matching Home Feed */}
      <header className="bg-white z-50 m-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back to Markets</span>
            </Link>
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-start">
              <h1 className="text-2xl font-semibold text-black tracking-tight">nusense</h1>
            </Link>
            <div className="flex items-center gap-4">
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

      {/* Main Content - Single Market Card */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col gap-0 max-w-2xl mx-auto">
          <MarketCard 
            market={{
              id: market.id,
              title: market.title,
              category: market.category,
              created_at: market.created_at,
              ends_at: market.ends_at,
              total_agree_stakes: market.total_agree_stakes,
              total_disagree_stakes: market.total_disagree_stakes,
              creator_address: market.creator_address,
              status: market.status,
              winner: market.winner
            }} 
            userAddress={connectedAddress}
            onBetClick={(marketId, marketTitle, side, amount) => {
              setPostTakeMarket({ 
                id: marketId, 
                title: marketTitle,
                initialSide: side,
                initialAmount: amount,
                data: {
                  total_agree_stakes: market.total_agree_stakes,
                  total_disagree_stakes: market.total_disagree_stakes
                }
              });
              setShowPostTake(true);
            }}
          />
        </div>
      </main>

      {/* Post Take Modal */}
      <PostTakeModal
        isOpen={showPostTake}
        onClose={() => {
          setShowPostTake(false);
          setPostTakeMarket(null);
        }}
        marketId={postTakeMarket?.id}
        marketTitle={postTakeMarket?.title}
        userAddress={connectedAddress}
        marketData={postTakeMarket?.data}
        initialSide={postTakeMarket?.initialSide}
        initialAmount={postTakeMarket?.initialAmount}
      />
    </div>
  );
}
