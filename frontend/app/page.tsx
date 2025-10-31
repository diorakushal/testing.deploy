'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import WalletConnect from '@/components/WalletConnect';
import MarketCard from '@/components/MarketCard';
import CreateMarketModal from '@/components/CreateMarketModal';
import HowItWorksModal from '@/components/HowItWorksModal';
import PostTakeModal from '@/components/PostTakeModal';
// Fallback to relative path to ensure resolution in all environments
import CreateMarketSidebar from '../components/CreateMarketSidebar';
import { mockMarkets } from '@/components/MockData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  creator_address: string;
  created_at: string;
  ends_at: string;
  total_agree_stakes: number;
  total_disagree_stakes: number;
  status?: string;
  winner?: number;
  resolved?: boolean;
}

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('trending');
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showPostTake, setShowPostTake] = useState(false);
  const [postTakeMarket, setPostTakeMarket] = useState<{id: string, title: string, initialSide?: 'agree' | 'disagree', initialAmount?: string, data?: any} | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>();

  useEffect(() => {
    fetchMarkets();
  }, [sort, category]);

  useEffect(() => {
    // Filter markets by search query
    if (searchQuery.trim() === '') {
      setFilteredMarkets(markets);
    } else {
      const filtered = markets.filter((market: any) =>
        market.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMarkets(filtered);
    }
  }, [searchQuery, markets]);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const status = sort === 'resolved' ? 'resolved' : 'active';
      const response = await axios.get(`${API_URL}/markets`, {
        params: { sort: sort === 'resolved' ? '' : sort, category, status }
      });
      setMarkets(response.data);
      setFilteredMarkets(response.data);
    } catch (error) {
      console.error('Error fetching markets:', error);
      // Use mock data if API fails
      let filtered = category ? mockMarkets.filter(m => m.category === category) : mockMarkets;
      
      // Filter by resolved/active based on current sort
      if (sort === 'resolved') {
        filtered = filtered.filter(m => m.status === 'resolved');
      } else {
        // For trending or any other sort, only show active markets
        filtered = filtered.filter(m => m.status !== 'resolved');
      }
      
      const sorted = sort === 'trending' 
        ? [...filtered].sort(
            (a, b) =>
              ((b as any).total_agree_stakes + (b as any).total_disagree_stakes) -
              ((a as any).total_agree_stakes + (a as any).total_disagree_stakes)
          )
        : filtered;
      setMarkets(sorted as typeof mockMarkets);
      setFilteredMarkets(sorted as typeof mockMarkets);
    } finally {
      setLoading(false);
    }
  };


  const categories = [
    { value: 'music', label: 'Music' },
    { value: 'sports', label: 'Sports' },
    { value: 'politics', label: 'Politics' },
    { value: 'pop-culture', label: 'Pop Culture' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="min-h-screen bg-white h-screen overflow-y-auto">
      {/* Header - Polymarket Style */}
      <header className="bg-white z-50 shadow-sm border-b border-gray-200 m-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top Section */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 flex-shrink-0 w-auto">
              <Link href="/" className="flex items-center justify-start">
                <h1 className="text-2xl font-semibold text-black tracking-tight">nusense</h1>
              </Link>
            </div>

            <div className="flex-1 mx-8">
              <p className="text-sm text-gray-600 text-center">Winner determined by stake-weighted algorithm</p>
            </div>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setShowHowItWorks(true)}
                className="flex items-center gap-2 text-[#00D07E] hover:text-[#00D07E]/80 text-sm font-medium"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How it works
              </button>
              <WalletConnect 
                onConnect={(address: string) => {
                  setIsConnected(true);
                  setConnectedAddress(address);
                }} 
              />
            </div>
          </div>

          {/* Bottom Navigation - Search and Category Filters */}
          <div className="flex items-center gap-6 py-2 overflow-x-auto">
            {/* Search moved below the name into the filter container */}
            <div className="flex-1 max-w-3xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-400 transition-all pl-10 text-black placeholder-gray-500"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setSort(sort === 'resolved' ? '' : 'resolved')}
                className={`px-3 pb-3 -mb-px text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  sort === 'resolved'
                    ? 'text-black border-black'
                    : 'text-gray-600 border-transparent hover:text-black hover:border-gray-400'
                }`}
              >
                Resolved
              </button>

              <button
                onClick={() => setSort(sort === 'trending' ? '' : 'trending')}
                className={`px-3 pb-3 -mb-px text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  sort === 'trending'
                    ? 'text-black border-black'
                    : 'text-gray-600 border-transparent hover:text-black hover:border-gray-400'
                }`}
              >
                Trending
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(category === cat.value ? '' : cat.value)}
                className={`px-3 pb-3 -mb-px text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  category === cat.value
                    ? 'text-black border-black'
                    : 'text-gray-600 border-transparent hover:text-black hover:border-gray-400'
                }`}
              >
                {cat.label}
              </button>
            ))}

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
          {/* Create Market Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <CreateMarketSidebar onSuccess={fetchMarkets} />
            </div>
          </div>

          {/* Main Feed */}
          <div className="flex flex-col gap-0">
            {/* Markets Grid */}
        {loading ? (
          <div className="flex flex-col gap-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse border border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">No active markets found</p>
            {isConnected && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-6 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                Create First Market
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {(searchQuery ? filteredMarkets : markets).map((market: any) => (
              <MarketCard 
                key={market.id} 
                market={market}
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
            ))}
          </div>
        )}
          </div>
        </div>
      </main>

      {/* Floating + Button removed per new inline composer */}

      {/* Create Market Modal */}
      {showCreateModal && (
        <CreateMarketModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchMarkets();
          }}
        />
      )}

      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />

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

