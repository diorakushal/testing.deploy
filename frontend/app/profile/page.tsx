'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/UserAvatar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  wallet_address: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  profile_image_url?: string | null;
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
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-6">
            <UserAvatar
              userId={user.id}
              firstName={user.first_name}
              lastName={user.last_name}
              username={user.username}
              email={user.email}
              profileImageUrl={user.profile_image_url}
              size="xl"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                {user.username || 'Anonymous User'}
              </h2>
              <p className="text-gray-600 mb-4">{formatAddress(user.wallet_address)}</p>
              
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

