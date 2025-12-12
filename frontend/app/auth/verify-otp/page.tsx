'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import PreferredWalletsModal from '@/components/PreferredWalletsModal';
import { updateUserWalletAddress } from '@/lib/auth-utils';
import { api } from '@/lib/api-client';

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const type = searchParams.get('type') || 'signup'; // 'login' or 'signup'
  const redirectUrl = searchParams.get('redirect') || null;
  
  const [code, setCode] = useState(['', '', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [status, setStatus] = useState<'input' | 'verifying' | 'success' | 'error' | 'onboarding'>('input');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [showPreferredWallets, setShowPreferredWallets] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [preferredWalletsComplete, setPreferredWalletsComplete] = useState(false);
  const [walletConfirmed, setWalletConfirmed] = useState(false); // Track if user explicitly confirmed wallet
  const [userClickedConnect, setUserClickedConnect] = useState(false); // Track if user clicked Connect Wallet button
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 8 digits are entered
    if (value && index === 7) {
      const fullCode = newCode.join('');
      if (fullCode.length === 8) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only process if it's 8 digits
    if (/^\d{8}$/.test(pastedData)) {
      const digits = pastedData.split('');
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (i < 8) {
          newCode[i] = digit;
        }
      });
      setCode(newCode);
      setError('');
      
      // Focus last input and auto-submit
      inputRefs.current[7]?.focus();
      setTimeout(() => handleVerify(pastedData), 100);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const codeToVerify = otpCode || code.join('');
    
    if (codeToVerify.length !== 8) {
      setError('Please enter an 8-digit code');
      return;
    }

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setStatus('verifying');
    setError('');

    try {
      // Verify the OTP code
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: codeToVerify,
        type: 'email',
      });

      if (verifyError) {
        throw verifyError;
      }

      if (!data.user) {
        throw new Error('User not found after verification');
      }

      // Ensure user record exists
      const { ensureUserRecord } = await import('@/lib/auth-utils');
      await ensureUserRecord(data.user);

      // If this is a login (not signup), skip onboarding and redirect to feed or redirect URL
      if (type === 'login') {
        toast.success('Successfully logged in!');
        const destination = redirectUrl || '/feed';
        router.replace(decodeURIComponent(destination));
        return;
      }

      // For signup, get stored user data from sessionStorage
      const pendingSignup = sessionStorage.getItem('pendingSignup');
      let userData = null;
      
      if (pendingSignup) {
        try {
          userData = JSON.parse(pendingSignup);
        } catch (e) {
          console.error('Error parsing pending signup data:', e);
        }
      }

      // Create or update user profile in public.users table
      if (userData) {
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: email.toLowerCase().trim(),
            first_name: userData.firstName,
            last_name: userData.lastName,
            username: userData.username,
            email_verified: true,
          }, {
            onConflict: 'id',
          });

        if (profileError) {
          console.error('Error creating/updating user profile:', profileError);
          // Continue anyway - user is authenticated
        } else {
          // Clear pending signup data
          sessionStorage.removeItem('pendingSignup');
        }
      } else {
        // Fallback: try to create user profile from auth metadata
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: email.toLowerCase().trim(),
            first_name: data.user.user_metadata?.first_name || null,
            last_name: data.user.user_metadata?.last_name || null,
            username: data.user.user_metadata?.username || null,
            email_verified: true,
          }, {
            onConflict: 'id',
          });

        if (profileError) {
          console.error('Error creating user profile from metadata:', profileError);
        }
      }

      // For signup, proceed with onboarding
      setUserId(data.user.id);
      setStatus('onboarding');
      setShowWalletConnect(true);
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setStatus('error');
      
      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        setError('Invalid or expired code. Please try again or request a new code.');
      } else {
        setError(error.message || 'Failed to verify code. Please try again.');
      }
      
      // Clear code on error
      setCode(['', '', '', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email) {
      return;
    }

    setResendLoading(true);
    setError('');

    try {
      // Get stored user data for resend
      const pendingSignup = sessionStorage.getItem('pendingSignup');
      let userData = null;
      
      if (pendingSignup) {
        try {
          userData = JSON.parse(pendingSignup);
        } catch (e) {
          console.error('Error parsing pending signup data:', e);
        }
      }

      const { error: resendError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
          data: userData ? {
            first_name: userData.firstName,
            last_name: userData.lastName,
            username: userData.username,
          } : undefined,
        },
      });

      if (resendError) {
        throw resendError;
      }

      toast.success('New code sent! Check your email.');
      setResendCooldown(60); // 60 second cooldown
      setCode(['', '', '', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (error: any) {
      console.error('Resend code error:', error);
      setError(error.message || 'Failed to resend code. Please try again.');
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Handle wallet connection manually - user must click "Continue" after connecting
  const handleContinueAfterWalletConnect = async () => {
    if (!isConnected || !address || !userId) {
      toast.error('Please connect a wallet first');
      return;
    }

    try {
      await updateUserWalletAddress(userId, address);
      setWalletConnected(true);
      setWalletConfirmed(true);
      setShowWalletConnect(false);
      // Show PreferredWalletsModal after user explicitly continues
      setTimeout(() => {
        setShowPreferredWallets(true);
      }, 500);
    } catch (error) {
      console.error('Error updating wallet address:', error);
      toast.error('Failed to save wallet address. Please try again.');
    }
  };

  // NO auto-connect - user must manually click "Connect Wallet" button
  // This gives users full control over when to connect their wallet

  const handlePreferredWalletsClose = async () => {
    if (!userId) return;
    
    try {
      const wallets = await api.get('/preferred-wallets', {
        params: { userId }
      });
      const walletsArray = Array.isArray(wallets) ? wallets : [];
      
      if (wallets.length > 0) {
        setPreferredWalletsComplete(true);
        setShowPreferredWallets(false);
        const destination = redirectUrl || '/feed';
        router.replace(decodeURIComponent(destination));
      }
    } catch (error) {
      console.error('Error checking preferred wallets on close:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 bg-white">
        <Link href="/feed" className="inline-block bg-white">
          <img 
            src="/applogo.png" 
            alt="Blockbook" 
            className="w-10 h-10 object-contain"
          />
        </Link>
      </div>
      
      <main className="flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 sm:p-10">
            {(status === 'input' || status === 'verifying') && (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-black mb-2">
                    Enter the code sent to your email
                  </h1>
                  {email && (
                    <p className="text-gray-600 text-sm mt-2">
                      We sent the code to {email}
                    </p>
                  )}
                </div>

                {/* Code Input */}
                <div className="mb-6">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code.join('')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                      const newCode = value.split('').concat(Array(8 - value.length).fill(''));
                      setCode(newCode);
                      setError('');
                      if (value.length === 8) {
                        handleVerify(value);
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 8);
                      if (pastedData.length > 0) {
                        const newCode = pastedData.split('').concat(Array(8 - pastedData.length).fill(''));
                        setCode(newCode);
                        setError('');
                        if (pastedData.length === 8) {
                          setTimeout(() => handleVerify(pastedData), 100);
                        }
                      }
                    }}
                    placeholder="Code"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black text-lg"
                    disabled={loading || status === 'verifying'}
                    autoFocus
                  />
                  {error && (
                    <p className="text-xs text-red-500 mt-3">{error}</p>
                  )}
                </div>

                {/* Continue Button */}
                <button
                  onClick={() => handleVerify()}
                  disabled={loading || status === 'verifying' || code.join('').length !== 8}
                  className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 active:scale-[0.98] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {status === 'verifying' ? 'Verifying...' : 'Continue'}
                </button>

                {/* Resend Code */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?{' '}
                    <button
                      onClick={handleResendCode}
                      disabled={resendLoading || resendCooldown > 0}
                      className="text-black underline hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendLoading
                        ? 'Sending...'
                        : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : 'Resend code'}
                    </button>
                  </p>
                </div>
              </>
            )}

            {status === 'onboarding' && type !== 'login' && (
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">Email verified!</h1>
                {!walletConnected && (
                  <>
                    <p className="text-gray-600 text-sm mt-2 mb-4">
                      Before setting up your preferred wallets, please connect your wallet first.
                    </p>
                    <p className="text-gray-500 text-xs mb-6">
                      Connect your wallets for each chain where you want to receive payments. You can either connect your wallet or manually enter a wallet address. When someone sends you a payment, they'll see your preferred wallet addresses for the chains you've configured.
                    </p>
                    {!isConnected ? (
                      <div className="mt-6">
                        <button
                          onClick={() => {
                            setUserClickedConnect(true);
                            if (openConnectModal) {
                              openConnectModal();
                            } else {
                              toast.error('Wallet connection not available. Please refresh the page.');
                            }
                          }}
                          className="w-full px-4 py-3 bg-black text-white rounded-full hover:bg-gray-900 active:scale-[0.98] transition-all duration-200 font-medium"
                        >
                          Connect Wallet
                        </button>
                      </div>
                    ) : (
                      <div className="mt-6">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-700 mb-1">Wallet connected:</p>
                          <p className="text-sm font-mono text-black">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                          </p>
                        </div>
                        <button
                          onClick={handleContinueAfterWalletConnect}
                          className="w-full px-4 py-3 bg-black text-white rounded-full hover:bg-gray-900 active:scale-[0.98] transition-all duration-200 font-medium"
                        >
                          Continue
                        </button>
                      </div>
                    )}
                  </>
                )}
                {walletConnected && !preferredWalletsComplete && (
                  <>
                    <p className="text-gray-600 text-sm mt-2">Wallet connected! Now let's set up your preferred wallets...</p>
                    <p className="text-gray-500 text-xs mt-3">Setting up your preferred wallets...</p>
                  </>
                )}
              </div>
            )}

            {status === 'error' && (
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">Verification failed</h1>
                <p className="text-gray-600 text-sm mt-2 mb-6">{error || 'Failed to verify code. Please try again.'}</p>
                <button
                  onClick={() => {
                    setStatus('input');
                    setCode(['', '', '', '', '', '', '', '']);
                    setError('');
                    if (inputRefs.current[0]) {
                      inputRefs.current[0].focus();
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 active:scale-[0.98] transition-all duration-200 font-medium"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Preferred Wallets Modal - ONLY show after wallet is connected */}
      {userId && walletConnected && (
        <PreferredWalletsModal
          isOpen={showPreferredWallets}
          onClose={handlePreferredWalletsClose}
          userId={userId}
          mandatory={true}
        />
      )}
    </div>
  );
}

