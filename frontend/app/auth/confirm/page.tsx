'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import PreferredWalletsModal from '@/components/PreferredWalletsModal';
import { updateUserWalletAddress } from '@/lib/auth-utils';
import { api } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'onboarding'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [userId, setUserId] = useState<string | null>(null);
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [showPreferredWallets, setShowPreferredWallets] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [preferredWalletsComplete, setPreferredWalletsComplete] = useState(false);
  const [userClickedConnect, setUserClickedConnect] = useState(false); // Track if user clicked Connect Wallet button
  const [connectedAfterClick, setConnectedAfterClick] = useState(false); // Track if wallet connected AFTER user clicked button
  const wasConnectedBeforeClickRef = useRef<boolean>(false); // Track connection state at moment of click
  
  const { address, isConnected, connector } = useAccount();
  const connectModalResult = useConnectModal();
  // Handle both object destructuring and direct function return
  const openConnectModal = typeof connectModalResult === 'function' 
    ? connectModalResult 
    : connectModalResult?.openConnectModal;
  const [mounted, setMounted] = useState(false);
  
  // Ensure we're on client side
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Helper function to format wallet names nicely
  const formatWalletName = (name: string): string => {
    if (!name || name === 'Wallet' || name === 'Injected') {
      return 'Browser Wallet';
    }
    
    // Remove common prefixes/suffixes
    let formatted = name
      .replace(/^io\./, '') // Remove "io." prefix
      .replace(/\.wallet$/i, '') // Remove ".wallet" suffix
      .replace(/wallet$/i, '') // Remove "wallet" suffix
      .trim();
    
    // Format: capitalize first letter of each word, handle camelCase
    formatted = formatted
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters in camelCase
      .split(/[\s-_.]+/) // Split on spaces, hyphens, underscores, dots
      .map(word => {
        // Capitalize first letter, lowercase the rest
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
    
    return formatted || 'Browser Wallet';
  };

  // Get wallet name dynamically from connector
  const walletName = connector 
    ? formatWalletName(connector.name || connector.id || 'Browser Wallet')
    : 'Browser Wallet';

  // Debug: Log modal availability
  useEffect(() => {
    if (mounted) {
      console.log('[Confirm] Connect modal available:', !!openConnectModal, 'Hook result:', connectModalResult);
      console.log('[Confirm] Hook type:', typeof connectModalResult, 'OpenModal type:', typeof openConnectModal);
    }
  }, [mounted, openConnectModal, connectModalResult]);
  
  // Track wallet connection ONLY after user clicks "Connect Wallet"
  // This ensures we only proceed with manually connected wallets (not pre-existing connections)
  useEffect(() => {
    if (!userClickedConnect) {
      // User hasn't clicked yet - don't track anything
      return;
    }
    
    // User has clicked - now track if wallet becomes connected
    if (isConnected && address) {
      // Only set connectedAfterClick if wallet was NOT connected before click
      if (!wasConnectedBeforeClickRef.current) {
        setConnectedAfterClick(true);
      }
    } else {
      // Wallet disconnected - reset
      setConnectedAfterClick(false);
    }
  }, [userClickedConnect, isConnected, address]);

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

          setUserId(session.user.id);
          setStatus('onboarding');
          setShowWalletConnect(true);
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
              setUserId(data.user.id);
              setStatus('onboarding');
              setShowWalletConnect(true);
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

            setUserId(data.user.id);
            setStatus('onboarding');
            setShowWalletConnect(true);
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

  // Handle wallet connection manually - user must click "Continue" after connecting
  const handleContinueAfterWalletConnect = async () => {
    if (!isConnected || !address || !userId) {
      toast.error('Please connect a wallet first');
      return;
    }

    try {
      await updateUserWalletAddress(userId, address);
      setWalletConnected(true);
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

  const handlePreferredWalletsClose = async () => {
    // Check if at least one wallet is set up before allowing close
    if (!userId) return;
    
    try {
      const wallets = await api.get('/preferred-wallets', {
        params: { userId }
      });
      const walletsArray = Array.isArray(wallets) ? wallets : [];
      
      // User can proceed once they have at least one wallet
      if (walletsArray.length > 0) {
        setPreferredWalletsComplete(true);
        setShowPreferredWallets(false);
        // Redirect to feed
        router.replace('/feed');
      }
      // If no wallets, don't close (handled by mandatory prop in modal)
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

            {status === 'onboarding' && (
              <div>
                {!walletConnected && (
                  <>
                    <h1 className="text-3xl font-bold text-black mb-2">Email verified!</h1>
                    <p className="text-gray-600 text-sm mt-2 mb-4">
                      Before setting up your preferred wallets, please connect your wallet first.
                    </p>
                    <p className="text-gray-500 text-xs mb-6">
                      Connect your wallets for each chain where you want to receive payments. You can either connect your wallet or manually enter a wallet address. When someone sends you a payment, they'll see your preferred wallet addresses for the chains you've configured.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          // Remember connection state at moment of click
                          wasConnectedBeforeClickRef.current = isConnected;
                          // Mark that user initiated wallet connection
                          setUserClickedConnect(true);
                          // Reset connectedAfterClick - will be set by useEffect if connection happens after click
                          setConnectedAfterClick(false);
                          
                          // Open the RainbowKit connect modal
                          if (!mounted) {
                            console.warn('[Confirm] Component not mounted yet');
                            return;
                          }
                          
                          if (openConnectModal) {
                            try {
                              console.log('[Confirm] Opening connect modal...');
                              openConnectModal();
                            } catch (error: any) {
                              console.error('[Confirm] Error opening connect modal:', error);
                              toast.error('Failed to open wallet connection. Please try again.');
                            }
                          } else {
                            console.error('[Confirm] openConnectModal is undefined. Hook result:', connectModalResult);
                            console.error('[Confirm] Full hook object:', JSON.stringify(connectModalResult, null, 2));
                            toast.error('Wallet connection is not ready. Please refresh the page.');
                          }
                        }}
                        className="w-full px-4 py-3 bg-black text-white rounded-full hover:bg-gray-900 active:scale-[0.98] transition-all duration-200 font-medium"
                      >
                        Connect Wallet
                      </button>
                    </div>
                    {/* Only show Continue button if:
                        1. User clicked Connect Wallet
                        2. Wallet is now connected
                        3. Connection happened AFTER clicking the button */}
                    {userClickedConnect && connectedAfterClick && isConnected && address && (
                      <div className="mt-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-700 mb-1">Wallet connected:</p>
                          <p className="text-sm font-mono text-black mb-1">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                          </p>
                          <p className="text-xs text-gray-500">{walletName}</p>
                        </div>
                        <button
                          onClick={handleContinueAfterWalletConnect}
                          className="w-full px-4 py-3 bg-black text-white rounded-full hover:bg-gray-900 active:scale-[0.98] transition-all duration-200 font-medium mb-3"
                        >
                          Continue
                        </button>
                        <button
                          onClick={() => {
                            if (openConnectModal) {
                              try {
                                openConnectModal();
                              } catch (error: any) {
                                console.error('[Confirm] Error opening connect modal:', error);
                                toast.error('Failed to open wallet connection. Please try again.');
                              }
                            }
                          }}
                          className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 active:scale-[0.98] transition-all duration-200 font-medium"
                        >
                          Connect Different Wallet
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

