'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import HowItWorksModal from './HowItWorksModal';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
  onWalletConnect?: (address: string) => void;
}

export default function Header({ searchQuery = '', onSearchChange, showSearch = true, onWalletConnect }: HeaderProps) {
  const router = useRouter();
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
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
      <header className="bg-white z-50 border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex items-center gap-3 sm:gap-4 py-3">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/feed" className="flex items-center group">
                <h1 className="text-2xl font-bold text-black tracking-tight">
                  Xelli
                </h1>
              </Link>
            </div>
            
            {/* Search Bar */}
            {showSearch && (
              <div className="flex-1 min-w-0 max-w-2xl">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg 
                      className="w-4 h-4 text-gray-400" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by amount, token, caption, or address..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="w-full px-3 py-2 pl-9 pr-3 bg-gray-100 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-gray-300 transition-all duration-200 text-black placeholder-gray-500"
                  />
                </div>
              </div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              {/* How it works */}
              <button
                onClick={() => setIsHowItWorksOpen(true)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-black hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium hidden sm:inline">How it works</span>
              </button>

              {/* Wallet Connection - RainbowKit ConnectButton - Only show when logged in */}
              {user && (
                <div className="[&>button]:!rounded-lg [&>button]:!border [&>button]:!border-gray-200 [&>button]:!bg-white [&>button]:hover:!bg-gray-50 [&>button]:transition-all [&>button]:duration-200">
                  <ConnectButton />
                </div>
              )}

              {/* User Info or Auth Buttons */}
              {loading ? null : user ? (
                  <div className="flex items-center relative">
                    {/* User Menu Button */}
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors duration-200 group border border-gray-200"
                    >
                    <div className="text-right">
                        <div className="text-xs font-medium text-black leading-tight">
                        {userProfile?.first_name && userProfile?.last_name
                          ? `${userProfile.first_name} ${userProfile.last_name}`
                          : userProfile?.first_name || user.email || 'User'}
                      </div>
                        <div className="text-[10px] text-gray-500 leading-tight">
                        {userProfile?.username ? `@${userProfile.username}` : ''}
                        </div>
                      </div>
                    {isConnected && address && (
                        <div className="text-right border-l border-gray-200 pl-2.5">
                          <div className="text-[10px] font-semibold text-black leading-tight">
                            {`${address.slice(0, 6)}...${address.slice(-4)}`}
                          </div>
                        {balance && (
                          <div className="text-[9px] text-gray-500 leading-tight">
                            {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                          </div>
                        )}
                </div>
              )}
                      <svg 
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                    className="text-black hover:text-gray-700 text-sm font-medium transition-colors duration-200"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* How It Works Modal */}
      <HowItWorksModal 
        isOpen={isHowItWorksOpen} 
        onClose={() => setIsHowItWorksOpen(false)} 
      />
    </>
  );
}
