'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check if user is already authenticated (session might already be set)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Check if email is already verified
          const { data: userData } = await supabase
            .from('users')
            .select('email_verified')
            .eq('id', session.user.id)
            .single();

          if (userData && !userData.email_verified) {
            // Update user profile to mark email as verified
            await supabase
              .from('users')
              .update({ email_verified: true })
              .eq('id', session.user.id);
          }

          setStatus('success');
          setMessage('Email verified successfully!');
          setTimeout(() => router.push('/feed'), 2000);
          return;
        }

        // Wait a bit for the hash to be available
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get the token from URL hash (Supabase uses hash fragments)
        const hash = window.location.hash.substring(1);
        
        if (!hash) {
          // Check query params as fallback
          const queryParams = new URLSearchParams(window.location.search);
          const token = queryParams.get('token');
          const type = queryParams.get('type');
          
          if (token && type === 'signup') {
            // Handle query param verification
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup'
            });

            if (error) throw error;
            if (data.user) {
              await supabase.from('users').update({ email_verified: true }).eq('id', data.user.id);
              setStatus('success');
              setMessage('Email verified successfully!');
              setTimeout(() => router.push('/feed'), 2000);
              return;
            }
          }
          throw new Error('No verification token found');
        }

        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'signup' && accessToken) {
          // Set the session
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
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

            // Redirect to feed page after 2 seconds
            setTimeout(() => {
              router.push('/feed');
            }, 2000);
          } else {
            throw new Error('User not found after verification');
          }
        } else {
          throw new Error('Invalid confirmation link');
        }
      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to verify email. The link may have expired.');
      }
    };

    verifyEmail();
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 bg-white">
        <Link href="/feed" className="inline-block bg-white">
          <img 
            src="/applogo.png" 
            alt="Xelli" 
            className="w-10 h-10 object-contain bg-white"
            style={{ backgroundColor: '#ffffff' }}
          />
        </Link>
      </div>
      
      <main className="flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 sm:p-10">
            {status === 'loading' && (
              <div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
                <h1 className="text-3xl font-bold text-black mb-2">Verifying your email</h1>
                <p className="text-gray-600 text-sm">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">Email verified!</h1>
                <p className="text-gray-600 text-sm mt-2">{message}</p>
                <p className="text-gray-600 text-sm mt-3">Redirecting to home...</p>
              </div>
            )}

            {status === 'error' && (
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">Verification failed</h1>
                <p className="text-gray-600 text-sm mt-2 mb-6">{message}</p>
                <button
                  onClick={() => router.push('/signup')}
                  className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 active:scale-[0.98] transition-all duration-200 font-medium"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

