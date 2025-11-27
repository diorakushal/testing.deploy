'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the token from URL hash (Supabase uses hash fragments)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (type === 'signup' && accessToken) {
          // Set the session
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });

          if (error) {
            throw error;
          }

          if (data.user) {
            // Update user profile to mark email as verified
            const { error: updateError } = await supabase
              .from('users')
              .update({ email_verified: true })
              .eq('id', data.user.id);

            if (updateError) {
              console.error('Error updating user profile:', updateError);
            }

            setStatus('success');
            setMessage('Email verified successfully!');
            toast.success('Your email has been verified!');

            // Redirect to feed page after 2 seconds
            setTimeout(() => {
              router.push('/feed');
            }, 2000);
          }
        } else {
          throw new Error('Invalid confirmation link');
        }
      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to verify email. The link may have expired.');
        toast.error('Email verification failed');
      }
    };

    verifyEmail();
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      <Header showSearch={false} />
      
      <main className="flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10 text-center">
            {status === 'loading' && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <h1 className="text-2xl font-bold text-black mb-2">Verifying your email</h1>
                <p className="text-gray-600">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-black mb-2">Email Verified!</h1>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500 mt-2">Redirecting to home...</p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-black mb-2">Verification Failed</h1>
                <p className="text-gray-600 mb-4">{message}</p>
                <button
                  onClick={() => router.push('/signup')}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

