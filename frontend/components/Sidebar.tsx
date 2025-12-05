'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { getUserGradient, getUserInitials as getInitials, getUserDisplayName as getDisplayName, getAvatarStyle } from '@/lib/userAvatar';
import UserAvatar from '@/components/UserAvatar';

interface SidebarProps {
  onWalletConnect?: (address: string) => void;
}

export default function Sidebar({ onWalletConnect }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const walletMenuRef = useRef<HTMLDivElement>(null);

  // Use wagmi hooks for wallet connection
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  
  // Track if we should open modal after disconnect
  const [shouldOpenModal, setShouldOpenModal] = useState(false);
  const { data: balance } = useBalance({
    address: address,
    query: {
      enabled: !!address,
    },
  });

  // Get wallet name from connector
  const getWalletName = () => {
    if (!connector) return 'Wallet';
    
    const connectorName = connector.name || connector.id || 'Wallet';
    
    const walletNameMap: { [key: string]: string } = {
      'MetaMask': 'MetaMask',
      'io.metamask': 'MetaMask',
      'WalletConnect': 'WalletConnect',
      'Coinbase Wallet': 'Coinbase Wallet',
      'Coinbase': 'Coinbase Wallet',
      'Trust Wallet': 'Trust Wallet',
      'Rainbow': 'Rainbow',
      'Zerion': 'Zerion',
    };
    
    if (walletNameMap[connectorName]) {
      return walletNameMap[connectorName];
    }
    
    return connectorName
      .split(/[\s-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const walletName = getWalletName();

  // Notify parent component when wallet connects
  useEffect(() => {
    if (isConnected && address && onWalletConnect) {
      onWalletConnect(address);
    }
  }, [isConnected, address, onWalletConnect]);

  // Open connect modal when wallet disconnects and we're waiting to switch
  useEffect(() => {
    if (shouldOpenModal && !isConnected && openConnectModal) {
      openConnectModal();
      setShouldOpenModal(false);
    }
  }, [shouldOpenModal, isConnected, openConnectModal]);

  // Set mounted state to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (walletMenuRef.current && !walletMenuRef.current.contains(event.target as Node)) {
        setIsWalletMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        toast.success('Address copied to clipboard');
        setIsWalletMenuOpen(false);
      } catch (error) {
        console.error('Failed to copy address:', error);
        toast.error('Failed to copy address');
      }
    }
  };

  const disconnectWallet = () => {
    try {
      disconnect();
      setIsWalletMenuOpen(false);
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  const handleSwitchWallet = () => {
    setIsWalletMenuOpen(false);
    
    if (isConnected) {
      setShouldOpenModal(true);
      disconnect();
      setTimeout(() => {
        if (openConnectModal) {
          openConnectModal();
        }
      }, 100);
    } else {
      if (openConnectModal) {
        openConnectModal();
      }
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          
          const { data: profile, error } = await supabase
            .from('users')
            .select('first_name, last_name, username, profile_image_url')
            .eq('id', session.user.id)
            .single();
          
          if (!error && profile) {
            setUserProfile(profile);
          } else {
            setUserProfile({
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              username: session.user.user_metadata?.username || '',
              profile_image_url: session.user.user_metadata?.profile_image_url || null,
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        
        const { data: profile, error } = await supabase
          .from('users')
          .select('first_name, last_name, username, profile_image_url')
          .eq('id', session.user.id)
          .single();
        
        if (!error && profile) {
          setUserProfile(profile);
        } else {
          setUserProfile({
            first_name: session.user.user_metadata?.first_name || '',
            last_name: session.user.user_metadata?.last_name || '',
            username: session.user.user_metadata?.username || '',
            profile_image_url: session.user.user_metadata?.profile_image_url || null,
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

  const refreshUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('first_name, last_name, username')
        .eq('id', user.id)
        .single();
      
      if (!error && profile) {
        setUserProfile(profile);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsUserMenuOpen(false);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign out error:', error);
      }
      window.location.replace('/login');
    } catch (error) {
      console.error('Error in sign out process:', error);
      window.location.replace('/login');
    }
  };

  const getUserDisplayName = () => {
    return getDisplayName(
      userProfile?.first_name,
      userProfile?.last_name,
      userProfile?.username,
      user?.email
    );
  };

  const getUserInitials = () => {
    return getInitials(
      userProfile?.first_name,
      userProfile?.last_name,
      userProfile?.username,
      user?.email
    );
  };

  // Calculate total balance in USD (convert ETH to USD, approximate 1 ETH = $3000)
  const getTotalBalance = () => {
    if (!balance || !isConnected) return '0.00';
    const ethBalance = parseFloat(formatEther(balance.value));
    // Approximate conversion: 1 ETH = $3000 (you can make this dynamic later)
    const usdBalance = ethBalance * 3000;
    return usdBalance.toFixed(2);
  };

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-800 flex flex-col z-50 overflow-hidden">
        {/* Header Section - Matching Login Page Style */}
        <div className="flex-shrink-0 px-4 pt-6 pb-6">
          {/* Logo and Zemme Text - Left Aligned */}
          <Link href="/feed" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded flex items-center justify-center flex-shrink-0">
              <img 
                src="/applogo.png" 
                alt="Zemme" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>Zemme</h1>
          </Link>
        </div>

        {/* Navigation - Matching Login Page Spacing */}
        {!mounted || loading ? null : user ? (
          <nav className="flex-1 px-4 py-2 space-y-1 flex flex-col">
            {/* Wallet Connection - Above Activity */}
            {isConnected && address ? (
              <div className="relative mb-2" ref={walletMenuRef}>
                <button
                  onClick={() => {
                    setIsWalletMenuOpen(!isWalletMenuOpen);
                    setIsUserMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isWalletMenuOpen
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium truncate" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                      {walletName}
                    </div>
                    <div className="text-xs text-gray-400 font-mono truncate" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                    </div>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isWalletMenuOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Wallet Dropdown */}
                {isWalletMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-gray-700 rounded-lg shadow-lg border border-gray-600 py-2 z-30">
                    <div className="px-4 py-3">
                      <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>{walletName}</div>
                      <div className="text-xs text-gray-300 font-mono mt-1" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                      </div>
                      {balance && (
                        <div className="text-xs text-gray-300 mt-1" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                          {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={copyAddress}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 transition-colors"
                      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                    >
                      Copy Address
                    </button>
                    <button
                      onClick={handleSwitchWallet}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 transition-colors"
                      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                    >
                      Switch Wallet
                    </button>
                    <button
                      onClick={disconnectWallet}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-600 transition-colors"
                      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-2">
                <div className="rainbowkit-wrapper">
                  <ConnectButton />
                </div>
              </div>
            )}

            {/* Activity */}
            <Link
              href="/feed"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === '/feed' || pathname === '/'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Activity</span>
            </Link>

            {/* Pay */}
            <Link
              href="/pay"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === '/pay'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Pay</span>
            </Link>

            {/* Request */}
            <Link
              href="/request"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === '/request'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Request</span>
            </Link>

            {/* Preferred Wallets */}
            <Link
              href="/preferred-wallets"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === '/preferred-wallets'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Preferred Wallets</span>
            </Link>

            {/* Terms of Use */}
            <Link
              href="/terms"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === '/terms'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Terms of Use</span>
            </Link>

            {/* Documentation */}
            <Link
              href="/documentation"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === '/documentation'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Documentation</span>
            </Link>

            {/* Search */}
            <Link
              href="/search"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === '/search'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Search</span>
            </Link>

            {/* Settings */}
            <Link
              href="/settings"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === '/settings'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Settings</span>
            </Link>
          </nav>
        ) : null}

        {/* Bottom Section - Profile with Name and Username */}
        <div className="flex-shrink-0 px-4 pb-6">
          {!mounted || loading ? null : user ? (
            <>
              {/* Profile Section - Matching Reference Style */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen);
                    setIsWalletMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  {/* Profile Icon - uses profile_image_url from database */}
                  {user && (
                    <UserAvatar
                      userId={user.id}
                      firstName={userProfile?.first_name}
                      lastName={userProfile?.last_name}
                      username={userProfile?.username}
                      email={user.email}
                      profileImageUrl={userProfile?.profile_image_url}
                      size="lg"
                    />
                  )}
                  
                  {/* User Name and Username */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                      {getUserDisplayName()}
                    </div>
                    {userProfile?.username && (
                      <div className="text-xs text-gray-400 truncate mt-0.5" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                        @{userProfile.username}
                      </div>
                    )}
                  </div>
                </button>

                {/* User Dropdown Menu - Dark Theme */}
                {isUserMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-gray-700 rounded-lg shadow-lg border border-gray-600 py-2 z-30">
                    <div className="px-4 py-3">
                      <div className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                        {getUserDisplayName()}
                      </div>
                      {userProfile?.username && (
                        <div className="text-xs text-gray-300 truncate mt-1" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                          @{userProfile.username}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-600 transition-colors rounded-lg"
                      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full text-center text-gray-300 hover:text-white text-sm font-medium transition-colors duration-200 px-4 py-3 rounded-lg hover:bg-gray-700"
                style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="block w-full text-center px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm font-semibold"
                style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </aside>

    </>
  );
}

