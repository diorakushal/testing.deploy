'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import WalletConnect from '@/components/WalletConnect';
import MarketCard from '@/components/MarketCard';
import CreateMarketModal from '@/components/CreateMarketModal';
import HowItWorksModal from '@/components/HowItWorksModal';
import PostTakeModal from '@/components/PostTakeModal';
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
  const [postTakeMarket, setPostTakeMarket] = useState<{id: string, title: string, data?: any} | null>(null);
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
    { value: '', label: 'All' },
    { value: 'music', label: 'Music' },
    { value: 'sports', label: 'Sports' },
    { value: 'politics', label: 'Politics' },
    { value: 'pop-culture', label: 'Pop Culture' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="min-h-screen bg-black h-screen overflow-y-auto">
      {/* Header - Polymarket Style */}
      <header className="bg-black sticky top-0 z-50 shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top Section */}
          <div className="flex items-center justify-between py-4 border-b border-gray-800">
            <div className="flex items-center gap-2 flex-shrink-0 w-[200px]">
              <Link href="/" className="flex items-center justify-center w-full">
                <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#2952FF] to-[#00D07E] bg-clip-text text-transparent tracking-tight">nusense</h1>
              </Link>
            </div>
            
            <div className="flex-1 mx-8 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-sm outline-none focus:bg-black focus:ring-2 focus:ring-[#2952FF] transition-all pl-10 text-white placeholder-gray-500"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
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

          {/* Bottom Navigation - Category Filters */}
          <div className="flex items-center gap-6 py-2 overflow-x-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSort(sort === 'resolved' ? '' : 'resolved')}
                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all rounded-full ${
                  sort === 'resolved'
                    ? 'bg-gradient-to-r from-[#2952FF] to-[#00D07E] text-white shadow-lg'
                    : 'text-gray-500 hover:text-white hover:bg-gray-900'
                }`}
              >
                Resolved
              </button>

              <button
                onClick={() => setSort(sort === 'trending' ? '' : 'trending')}
                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all rounded-full ${
                  sort === 'trending'
                    ? 'bg-gradient-to-r from-[#2952FF] to-[#00D07E] text-white shadow-lg'
                    : 'text-gray-500 hover:text-white hover:bg-gray-900'
                }`}
              >
                Trending
              </button>
            </div>

            <div className="w-px h-6 bg-gray-800"></div>

            {categories.slice(1).map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(category === cat.value ? '' : cat.value)}
                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all rounded-full ${
                  category === cat.value
                    ? 'bg-gradient-to-r from-[#2952FF] to-[#00D07E] text-white shadow-lg'
                    : 'text-gray-500 hover:text-white hover:bg-gray-900'
                }`}
              >
                {cat.label}
              </button>
            ))}

            <button
              onClick={() => {
                if (!isConnected) {
                  alert('Please connect your wallet first to create a market');
                  return;
                }
                setShowCreateModal(true);
              }}
              className="ml-auto px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#2952FF] to-[#00D07E] text-white rounded-lg hover:opacity-90 whitespace-nowrap"
            >
              + Post Your Take
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Polymarket Style 3-Column Grid */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Markets Grid - 3 columns like Polymarket */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-black rounded-xl shadow-sm p-6 animate-pulse border border-gray-800">
                <div className="h-6 bg-gray-900 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-900 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : markets.length === 0 ? (
          <div className="bg-black rounded-2xl shadow-minimal border border-gray-800 p-16 text-center">
            <p className="text-gray-400 text-lg">No active markets found</p>
            {isConnected && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-[#2952FF] to-[#00D07E] text-white rounded-lg hover:opacity-90 font-medium shadow-minimal"
              >
                Create First Market
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(searchQuery ? filteredMarkets : markets).map((market: any) => (
              <MarketCard 
                key={market.id} 
                market={market}
                onBetClick={(marketId, marketTitle) => {
                  setPostTakeMarket({ 
                    id: marketId, 
                    title: marketTitle,
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
      </main>

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
      />

    </div>
  );
}

