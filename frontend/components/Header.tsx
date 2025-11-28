'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  onWalletConnect?: (address: string) => void;
}

export default function Header({ onWalletConnect }: HeaderProps) {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Use wagmi hooks for wallet connection
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
    enabled: !!address,
  });

  // Notify parent component when wallet connects
  useEffect(() => {
    if (isConnected && address && onWalletConnect) {
      onWalletConnect(address);
    }
  }, [isConnected, address, onWalletConnect]);

  useEffect(() => {
    // Check for authenticated user and fetch profile
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          
          // Fetch user profile from users table
          const { data: profile, error } = await supabase
            .from('users')
            .select('first_name, last_name, username')
            .eq('id', session.user.id)
            .single();
          
          if (!error && profile) {
            setUserProfile(profile);
          } else {
            // Fallback to user_metadata if profile not found
            setUserProfile({
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              username: session.user.user_metadata?.username || '',
            });
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        
        // Fetch user profile from users table
        const { data: profile, error } = await supabase
          .from('users')
          .select('first_name, last_name, username')
          .eq('id', session.user.id)
          .single();
        
        if (!error && profile) {
          setUserProfile(profile);
        } else {
          // Fallback to user_metadata if profile not found
          setUserProfile({
            first_name: session.user.user_metadata?.first_name || '',
            last_name: session.user.user_metadata?.last_name || '',
            username: session.user.user_metadata?.username || '',
          });
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      setIsUserMenuOpen(false);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
      }
      
      // Force redirect to login page
      window.location.replace('/login');
    } catch (error) {
      console.error('Error in sign out process:', error);
      window.location.replace('/login');
    }
  };

  return (
    <>
      <header className="bg-white z-50 sticky top-0">
        <div className="mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex items-center gap-4 py-3.5">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/feed" className="flex items-center group">
                <h1 className="text-2xl font-bold text-black tracking-tight">
                  Xelli
                </h1>
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
              {/* Wallet Connection - RainbowKit ConnectButton - Only show when logged in */}
              {user && (
                <div className="rainbowkit-wrapper">
                  <ConnectButton />
                </div>
              )}

              {/* User Info or Auth Buttons */}
              {loading ? null : user ? (
                  <div className="flex items-center relative">
                    {/* User Menu Button */}
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 group border border-gray-200 bg-white"
                    >
                      {/* User Info Section */}
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <div className="text-sm font-semibold text-black leading-tight">
                            {userProfile?.first_name && userProfile?.last_name
                              ? `${userProfile.first_name} ${userProfile.last_name}`
                              : userProfile?.first_name || user.email?.split('@')[0] || 'User'}
                          </div>
                          {userProfile?.username && (
                            <div className="text-xs text-gray-500 leading-tight">
                              @{userProfile.username}
                            </div>
                          )}
                        </div>
                        
                        {/* Wallet Info Section */}
                        {isConnected && address && (
                          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                            <div className="text-left">
                              <div className="text-xs font-semibold text-black leading-tight font-mono">
                                {`${address.slice(0, 6)}...${address.slice(-4)}`}
                              </div>
                              {balance && (
                                <div className="text-xs text-gray-500 leading-tight">
                                  {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Dropdown Icon */}
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
              </button>

                    {/* User Dropdown Menu */}
                    {isUserMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                        onClick={() => setIsUserMenuOpen(false)}
                        />
                        <div 
                          className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isConnected && address && (
                              <div className="px-4 py-3 border-b border-gray-100">
                                <div className="text-xs font-medium text-gray-500 mb-1.5">Wallet Connected</div>
                                <div className="text-sm font-semibold text-black mb-0.5">
                              {`${address.slice(0, 6)}...${address.slice(-4)}`}
                    </div>
                            {balance && (
                    <div className="text-xs text-gray-500">
                                {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                              </div>
                            )}
                          </div>
                          )}
                          <div className="border-t border-gray-100 mt-2 pt-2">
                            <button
                              type="button"
                            onClick={handleSignOut}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                  >
                    Sign Out
                  </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-black hover:text-gray-700 text-sm font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
