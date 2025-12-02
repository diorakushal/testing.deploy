'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useChainId, useSwitchChain, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';
import { supabase } from '@/lib/supabase';
import { getChainConfig } from '@/lib/tokenConfig';
import { base, mainnet, bsc, polygon } from 'wagmi/chains';
import toast from 'react-hot-toast';

interface HeaderProps {
  onWalletConnect?: (address: string) => void;
}

export default function Header({ onWalletConnect }: HeaderProps) {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const walletMenuRef = useRef<HTMLDivElement>(null);
  const networkMenuRef = useRef<HTMLDivElement>(null);

  // Use wagmi hooks for wallet connection
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
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

  const currentChain = getChainConfig(chainId);
  const availableChains = [
    { id: 1, name: 'Ethereum', chain: mainnet },
    { id: 8453, name: 'Base', chain: base },
    { id: 56, name: 'BNB Chain', chain: bsc },
    { id: 137, name: 'Polygon', chain: polygon },
  ];

  // Get wallet name from connector
  const getWalletName = () => {
    if (!connector) return 'Wallet';
    
    // Get the connector name and format it nicely
    const connectorName = connector.name || connector.id || 'Wallet';
    
    // Format common wallet names
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
    
    // Check if we have a mapped name
    if (walletNameMap[connectorName]) {
      return walletNameMap[connectorName];
    }
    
    // Otherwise, capitalize the first letter of each word
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
      // Wallet has been disconnected, open the modal
      openConnectModal();
      setShouldOpenModal(false);
    }
  }, [shouldOpenModal, isConnected, openConnectModal]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (walletMenuRef.current && !walletMenuRef.current.contains(event.target as Node)) {
        setIsWalletMenuOpen(false);
      }
      if (networkMenuRef.current && !networkMenuRef.current.contains(event.target as Node)) {
        setIsNetworkMenuOpen(false);
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

  const handleSwitchChain = (targetChainId: number) => {
    if (switchChain && targetChainId !== chainId) {
      try {
        switchChain({ chainId: targetChainId as any });
        setIsNetworkMenuOpen(false);
      } catch (error) {
        console.error('Error switching chain:', error);
        toast.error('Failed to switch chain');
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
    
    // If connected, disconnect first, then open modal
    if (isConnected) {
      // Set flag to open modal after disconnect
      setShouldOpenModal(true);
      
      // Disconnect the wallet
      disconnect();
      
      // Also try opening immediately as a fallback
      setTimeout(() => {
        if (openConnectModal) {
          openConnectModal();
        }
      }, 100);
    } else {
      // If not connected, open the connect modal immediately
      if (openConnectModal) {
        openConnectModal();
      }
    }
  };

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

  const getUserDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    return userProfile?.first_name || user.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };

  return (
    <>
      <header className="bg-white z-50 sticky top-0 border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex items-center gap-3 py-3.5">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 bg-white">
              <Link href="/feed" className="inline-block bg-white">
                <img 
                  src="/applogo.png" 
                  alt="Xelli" 
                  className="w-12 h-12 object-contain bg-white"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </Link>
            </div>

            {/* Right Side Actions */}
            {loading ? null : user ? (
              <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
                {/* Network Selector */}
                {isConnected && (
                  <div className="relative" ref={networkMenuRef}>
                    <button
                      onClick={() => {
                        setIsNetworkMenuOpen(!isNetworkMenuOpen);
                        setIsWalletMenuOpen(false);
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
                    >
                      {/* Chain Icon */}
                      <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {currentChain?.name || 'Ethereum'}
                      </span>
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform ${isNetworkMenuOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Network Dropdown */}
                    {isNetworkMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-30">
                        {availableChains.map((chain) => (
                          <button
                            key={chain.id}
                            onClick={() => handleSwitchChain(chain.id)}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                              chainId === chain.id ? 'bg-gray-50 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {chain.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Wallet Connection */}
                {isConnected && address ? (
                  <div className="relative" ref={walletMenuRef}>
                    <button
                      onClick={() => {
                        setIsWalletMenuOpen(!isWalletMenuOpen);
                        setIsNetworkMenuOpen(false);
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
                    >
                      <div className="text-left">
                        <div className="text-sm font-semibold text-gray-900">
                          {walletName}
                        </div>
                        <div className="text-xs text-gray-600 font-mono">
                          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                        </div>
                      </div>
                      {balance && (
                        <div className="text-xs text-gray-600 ml-2">
                          {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                        </div>
                      )}
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform ${isWalletMenuOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Wallet Dropdown */}
                    {isWalletMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-30">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="text-sm font-semibold text-gray-900">{walletName}</div>
                          <div className="text-xs text-gray-600 font-mono mt-1">
                            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                          </div>
                          {balance && (
                            <div className="text-xs text-gray-600 mt-1">
                              {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={copyAddress}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Copy Address
                        </button>
                        <button
                          onClick={handleSwitchWallet}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Switch Wallet
                        </button>
                        <button
                          onClick={disconnectWallet}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rainbowkit-wrapper">
                    <ConnectButton />
                  </div>
                )}

                {/* User Profile */}
                <div className="relative flex items-center" ref={userMenuRef}>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(!isUserMenuOpen);
                      setIsNetworkMenuOpen(false);
                      setIsWalletMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar with gradient */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                      {getUserInitials()}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900">
                        {getUserDisplayName()}
                      </div>
                      {userProfile?.username && (
                        <div className="text-xs text-gray-500">
                          @{userProfile.username}
                        </div>
                      )}
                    </div>
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-30">
                      {/* Profile Header */}
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {getUserDisplayName()}
                          </div>
                          {userProfile?.username && (
                            <div className="text-xs text-gray-500">
                              @{userProfile.username}
                            </div>
                          )}
                        </div>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </div>

                      {/* Dark Mode Toggle */}
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className="text-sm text-gray-700">Dark mode</span>
                        </div>
                        <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 transition-transform"></div>
                        </div>
                      </div>

                      {/* Documentation */}
                      <Link
                        href="/docs"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Documentation
                      </Link>

                      {/* Terms of Use */}
                      <Link
                        href="/terms"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Terms of Use
                      </Link>

                      {/* Logout */}
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
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
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
