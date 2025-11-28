'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  wallet_address: string;
  username: string;
  markets_created: number;
  total_staked: number | string;
  total_earnings: number | string;
  wins: number;
  losses: number;
  markets?: any[];
  stakes?: any[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

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

  useEffect(() => {
    if (!authLoading) {
      // This would typically get wallet from connected wallet state
      // For now, we'll use URL params or localStorage
      const address = localStorage.getItem('walletAddress');
      if (address) {
        setWalletAddress(address);
        fetchUser(address);
      } else {
        setLoading(false);
      }
    }
  }, [authLoading]);

  const fetchUser = async (address: string) => {
    try {
      const response = await axios.get(`${API_URL}/users/${address}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  // Show loading while checking authentication
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">No profile found</div>
          <Link href="/feed" className="text-blue-600 hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {user.username?.charAt(0).toUpperCase() || user.wallet_address.charAt(2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                {user.username || 'Anonymous User'}
              </h2>
              <p className="text-gray-600 mb-4">{formatAddress(user.wallet_address)}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Staked</div>
                  <div className="text-xl font-bold text-gray-900">
                    ${typeof user.total_staked === 'number' ? user.total_staked.toLocaleString() : parseFloat(user.total_staked.toString()).toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Earnings</div>
                  <div className="text-xl font-bold text-gray-900">
                    ${typeof user.total_earnings === 'number' ? user.total_earnings.toLocaleString() : parseFloat(user.total_earnings.toString()).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-gray-900">{user.markets_created}</div>
            <div className="text-sm text-gray-600 mt-1">Markets Created</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{user.wins}</div>
            <div className="text-sm text-gray-600 mt-1">Wins</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-red-600">{user.losses}</div>
            <div className="text-sm text-gray-600 mt-1">Losses</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-gray-900">
              {user.wins + user.losses > 0 
                ? `${Math.round((user.wins / (user.wins + user.losses)) * 100)}%`
                : '0%'
              }
            </div>
            <div className="text-sm text-gray-600 mt-1">Win Rate</div>
          </div>
        </div>

        {/* Markets Created */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold mb-4">Your Markets</h3>
          {user.markets && user.markets.length > 0 ? (
            <div className="space-y-3">
              {user.markets.map((market: any) => (
                <Link
                  key={market.id}
                  href={`/market/${market.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{market.title}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(market.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        ${(parseFloat(market.total_agree_stakes) + parseFloat(market.total_disagree_stakes)).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Total Volume</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">You haven't created any markets yet</p>
          )}
        </div>

        {/* Recent Stakes */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h3 className="text-xl font-bold mb-4">Recent Stakes</h3>
          {user.stakes && user.stakes.length > 0 ? (
            <div className="space-y-3">
              {user.stakes.map((stake: any) => (
                <div
                  key={stake.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{stake.title}</div>
                      <div className="text-sm text-gray-500">
                        {stake.side === 1 ? '✓ Agreed' : '✗ Disagreed'} • {new Date(stake.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        ${parseFloat(stake.amount).toLocaleString()}
                      </div>
                      {stake.resolved && stake.payout && (
                        <div className={`text-sm ${stake.side === stake.winner ? 'text-green-600' : 'text-red-600'}`}>
                          {stake.side === stake.winner ? `+${(typeof stake.payout === 'number' ? stake.payout : parseFloat(stake.payout)) - (typeof stake.amount === 'number' ? stake.amount : parseFloat(stake.amount))}` : `-${typeof stake.amount === 'number' ? stake.amount.toLocaleString() : parseFloat(stake.amount).toLocaleString()}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">You haven't placed any stakes yet</p>
          )}
        </div>
      </main>
    </div>
  );
}

