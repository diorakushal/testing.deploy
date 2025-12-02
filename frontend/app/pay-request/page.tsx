'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CreateMarketSidebar from '@/components/CreateMarketSidebar';
import { supabase } from '@/lib/supabase';

export default function PayRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        setUser(session.user);
      } catch (error) {
        console.error('Error checking user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSuccess = () => {
    // Refresh or redirect after successful payment/request
    router.push('/feed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <CreateMarketSidebar onSuccess={handleSuccess} />
          </div>
        </div>
      </main>
    </div>
  );
}

