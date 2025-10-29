'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import toast from 'react-hot-toast';
import MarketCard from '@/components/MarketCard';

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
}

export default function MarketDetail() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;

  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D07E] mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading market...</p>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Market Not Found</h1>
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
    <div className="min-h-screen bg-black">
      {/* Header - Matching Home Feed */}
      <header className="bg-black sticky top-0 z-50 shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back to Markets</span>
            </Link>
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#2952FF] to-[#00D07E] bg-clip-text text-transparent tracking-tight">nusense</h1>
            </Link>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* Main Content - Single Market Card */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-6">
          <MarketCard market={{
            id: market.id,
            title: market.title,
            category: market.category,
            created_at: market.created_at,
            ends_at: market.ends_at,
            total_agree_stakes: market.total_agree_stakes,
            total_disagree_stakes: market.total_disagree_stakes,
            creator_address: market.creator_address
          }} />
        </div>
      </main>
    </div>
  );
}
