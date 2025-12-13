'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CreatePaymentSidebar from '@/components/CreatePaymentSidebar';

export default function PayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toParam = searchParams.get('to');

  useEffect(() => {
    // Non-blocking auth check - redirect in background if needed
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const handleSuccess = () => {
    setTimeout(() => {
      router.push('/feed');
      router.refresh();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <CreatePaymentSidebar 
              onSuccess={handleSuccess} 
              defaultMode="pay" 
              initialTo={toParam || undefined}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

