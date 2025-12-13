'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useDisconnect, useSwitchChain, useChainId, useChains } from 'wagmi';
import { formatEther } from 'viem';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getUserGradient, getUserInitials, getAvatarStyle } from '@/lib/userAvatar';
import UserAvatar from '@/components/UserAvatar';
import { AVAILABLE_CHAINS, getChainConfig } from '@/lib/tokenConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface HeaderProps {
  onWalletConnect?: (address: string) => void;
}

export default function Header({ onWalletConnect }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [showChainMenu, setShowChainMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const walletMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Profile modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Use wagmi hooks for wallet connection
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();
  const chains = useChains();
  
  // Track if we should open modal after disconnect
  const [shouldOpenModal, setShouldOpenModal] = useState(false);
  const { data: balance } = useBalance({
    address: address,
    query: {
      enabled: !!address,
    },
  });


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

  // Get wallet name dynamically from connector - PRIORITIZE CONNECTOR over window.ethereum
  // This ensures the name updates correctly when switching wallets
  const getWalletName = useMemo(() => {
    if (!connector) return 'Wallet';
    
    // PRIORITY 1: Use connector's actual name/id (wagmi/RainbowKit provides the real wallet name)
    // This is the most reliable source when switching wallets
    const connectorName = connector.name || connector.id || '';
    
    if (connectorName && connectorName !== 'Wallet' && connectorName !== 'Injected') {
      const formatted = formatWalletName(connectorName);
      if (formatted !== 'Browser Wallet') {
        return formatted;
      }
    }
    
    // PRIORITY 2: Check window.ethereum properties (fallback for injected wallets)
    if (typeof window !== 'undefined' && window.ethereum) {
      const ethereum = window.ethereum as any;
      
      // Check for wallet-specific properties dynamically
      // Look for properties like isMetaMask, isCoinbaseWallet, isPhantom, etc.
      const walletProperties = Object.keys(ethereum).filter(key => 
        key.startsWith('is') && typeof ethereum[key] === 'boolean' && ethereum[key] === true
      );
      
      if (walletProperties.length > 0) {
        // Extract wallet name from property (e.g., "isMetaMask" -> "MetaMask")
        const propertyName = walletProperties[0];
        const walletName = propertyName
          .replace(/^is/, '') // Remove "is" prefix
          .replace(/([A-Z])/g, ' $1') // Add space before capital letters
          .trim();
        
        if (walletName) {
          return walletName;
        }
      }
      
      // Check for providerName property
      if (ethereum.providerName) {
        return formatWalletName(ethereum.providerName);
      }
      
      // Check constructor name
      if (ethereum.constructor?.name && ethereum.constructor.name !== 'Object') {
        return formatWalletName(ethereum.constructor.name);
      }
      
      // Check for wallet name in various properties
      if (ethereum.walletName) {
        return formatWalletName(ethereum.walletName);
      }
      
      if (ethereum.name) {
        return formatWalletName(ethereum.name);
      }
    }
    
    // Fallback
    return formatWalletName(connectorName || 'Browser Wallet');
  }, [connector, address, isConnected]); // Re-compute when connector, address, or connection status changes

  const walletName = getWalletName;

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
        setShowChainMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
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

  const handleSwitchChain = async (targetChainId: number) => {
    if (!switchChain) {
      toast.error('Chain switching not available');
      return;
    }

    if (currentChainId === targetChainId) {
      toast.success('Already on this chain');
      setShowChainMenu(false);
      setIsWalletMenuOpen(false);
      return;
    }

    try {
      const chainConfig = getChainConfig(targetChainId);
      const chainName = chainConfig?.name || `Chain ${targetChainId}`;
      
      toast.loading(`Switching to ${chainName}...`);
      
      await switchChain({ chainId: targetChainId as any });
      
      toast.dismiss();
      toast.success(`Switched to ${chainName}`);
      
      setShowChainMenu(false);
      setIsWalletMenuOpen(false);
    } catch (error: any) {
      toast.dismiss();
      const errorMessage = error?.message || error?.shortMessage || 'Failed to switch chain';
      const errorCode = error?.code;
      
      if (errorCode === 4902 || 
          errorMessage.includes('Unsupported chain') || 
          errorMessage.includes('not support') ||
          errorMessage.includes('Unsupported network')) {
        toast.error(`Your wallet doesn't support this network. Please add it to your wallet first.`);
      } else if (errorCode === 4001) {
        toast.error('Chain switch was rejected');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  useEffect(() => {
    // Simple auth check: if session exists, user is logged in; otherwise not
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setCurrentUserId(session.user.id);
          
          // Use user_metadata immediately (available from session)
          setUserProfile({
            first_name: session.user.user_metadata?.first_name || '',
            last_name: session.user.user_metadata?.last_name || '',
            username: session.user.user_metadata?.username || '',
            profile_image_url: session.user.user_metadata?.profile_image_url || null,
          });
          
          // Silently fetch profile from database in background (non-blocking, no errors)
          Promise.resolve(
            supabase
              .from('users')
              .select('first_name, last_name, username, profile_image_url')
              .eq('id', session.user.id)
              .single()
          )
            .then(({ data: profile, error }) => {
              if (!error && profile) {
                setUserProfile(profile);
              }
            })
            .catch(() => {
              // Silently fail - we already have user_metadata
            });
          
          // Ensure user record exists in background (non-blocking)
          const { ensureUserRecord } = await import('@/lib/auth-utils');
          ensureUserRecord(session.user).catch(() => {
            // Silently fail - not critical
          });
        } else {
          setUser(null);
          setUserProfile(null);
          setCurrentUserId(null);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setUser(null);
        setUserProfile(null);
        setCurrentUserId(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes - simple: session exists = logged in, no session = logged out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setCurrentUserId(session.user.id);
        
        // Use user_metadata immediately (available from session)
        setUserProfile({
          first_name: session.user.user_metadata?.first_name || '',
          last_name: session.user.user_metadata?.last_name || '',
          username: session.user.user_metadata?.username || '',
          profile_image_url: session.user.user_metadata?.profile_image_url || null,
        });
        
        // Silently fetch profile from database in background (non-blocking, no errors)
        Promise.resolve(
          supabase
            .from('users')
            .select('first_name, last_name, username, profile_image_url')
            .eq('id', session.user.id)
            .single()
        )
          .then(({ data: profile, error }) => {
            if (!error && profile) {
              setUserProfile(profile);
            }
          })
          .catch(() => {
            // Silently fail - we already have user_metadata
          });
        
        // Ensure user record exists in background (non-blocking)
        const { ensureUserRecord } = await import('@/lib/auth-utils');
        ensureUserRecord(session.user).catch(() => {
          // Silently fail - not critical
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setCurrentUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      // Refresh user profile from users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('first_name, last_name, username, profile_image_url')
        .eq('id', user.id)
        .single();
      
      if (!error && profile) {
        setUserProfile(profile);
      }

      // Refresh user session to get updated metadata (including gradient preference)
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

  // 3D sphere gradients with top-left highlight, center-right warm tone, bottom-left shadow
  const sphereGradients = [
    // Magenta/pink top-left, orange center-right, grayish-purple bottom-left
    { 
      topLeft: '#ec4899',      // Vibrant magenta/pink
      centerRight: '#f97316',  // Warm orange/gold
      bottomLeft: '#8b5cf6'   // Muted purple-gray
    },
    {
      topLeft: '#d946ef',      // Fuchsia
      centerRight: '#fb923c',  // Orange
      bottomLeft: '#a78bfa'    // Lavender-gray
    },
    {
      topLeft: '#f43f5e',      // Rose
      centerRight: '#f59e0b',  // Amber
      bottomLeft: '#9f7aea'    // Purple-gray
    },
    {
      topLeft: '#a855f7',      // Purple
      centerRight: '#f97316',  // Orange
      bottomLeft: '#7c3aed'    // Deep purple-gray
    },
    {
      topLeft: '#ec4899',      // Pink
      centerRight: '#eab308',  // Yellow-gold
      bottomLeft: '#8b5cf6'    // Purple-gray
    },
    {
      topLeft: '#d946ef',      // Fuchsia
      centerRight: '#fb923c',  // Orange
      bottomLeft: '#a78bfa'    // Lavender
    },
    {
      topLeft: '#f43f5e',      // Rose
      centerRight: '#f97316',  // Orange
      bottomLeft: '#9f7aea'    // Purple-gray
    },
    {
      topLeft: '#a855f7',      // Purple
      centerRight: '#f59e0b',  // Amber
      bottomLeft: '#7c3aed'    // Deep purple
    },
    {
      topLeft: '#ec4899',      // Pink
      centerRight: '#fb923c',  // Light orange
      bottomLeft: '#8b5cf6'    // Purple-gray
    },
    {
      topLeft: '#d946ef',      // Fuchsia
      centerRight: '#eab308',  // Yellow
      bottomLeft: '#a78bfa'    // Lavender
    },
  ];

  // Generate unique 3D sphere gradient for each user based on their ID or saved preference
  const getUserGradient = (userId: string, userMetadata?: any) => {
    // Check if user has a saved gradient preference
    const savedGradient = userMetadata?.gradient_preference;
    if (savedGradient !== undefined && savedGradient >= 0 && savedGradient < sphereGradients.length) {
      return sphereGradients[savedGradient];
    }
    
    // Default: Use the user ID to generate consistent colors
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const gradientIndex = Math.abs(hash) % sphereGradients.length;
    return sphereGradients[gradientIndex];
  };

  // Search users function
  const searchUsers = async (query: string) => {
    const cleanQuery = query.trim().replace(/^@+/, '');
    
    if (!cleanQuery || cleanQuery.length < 1) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearching(true);

      const response = await axios.get(`${API_URL}/users/search`, {
        params: { q: cleanQuery, userId: currentUserId },
        timeout: 5000
      });

      // Get current user's email to also filter by email
      let currentUserEmail: string | null = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserEmail = session?.user?.email || null;
      } catch (err) {
        console.error('Error getting user email:', err);
      }

      // Filter out current user from results (by ID and email to be safe)
      const filtered = response.data.filter((user: any) => {
        if (user.id === currentUserId) return false;
        if (currentUserEmail && user.email === currentUserEmail) return false;
        return true;
      });

      setSearchResults(filtered);
      setShowSearchResults(true);
    } catch (error: any) {
      console.error('Error searching users:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 1) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, currentUserId]);

  const handleUserSelect = (user: any) => {
    if (user.username) {
      setSearchQuery('');
      setShowSearchResults(false);
      router.push(`/user/${user.username}`);
    } else {
      toast.error('User does not have a username');
    }
  };

  return (
    <>
      <header className="bg-white z-50">
        <div className="mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex items-center gap-3 py-3.5 border-b border-gray-200">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 bg-white gap-3">
              <Link href="/feed" className="inline-flex items-center gap-3 bg-white">
                <img 
                  src="/applogo.png" 
                  alt="Blockbook" 
                  className="w-12 h-12 object-contain"
                />
                <h1 className="text-xl font-blockbook text-black">blockbook</h1>
              </Link>
            </div>

            {/* Search Bar */}
            {loading ? null : user ? (
              <div className="flex-1 max-w-xl mx-6 relative" ref={searchRef}>
                <div className="relative bg-gray-100 rounded-full p-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 1 && searchResults.length > 0) {
                        setShowSearchResults(true);
                      }
                    }}
                    placeholder="Search users or transactions..."
                    className="w-full pl-12 pr-10 py-2 border-0 rounded-full focus:outline-none focus:ring-0 transition-all bg-transparent text-black placeholder-gray-400 text-sm font-semibold"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowSearchResults(false);
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-black transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-auto">
                    {searching ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">Searching...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-200">
                          Users
                        </div>
                        {searchResults.map((user: any, index: number) => {
                          const isContact = user.isContact || false;
                          const isFirstNonContact = !isContact && index > 0 && searchResults[index - 1]?.isContact;
                          
                          return (
                            <div key={user.id}>
                              {isFirstNonContact && (
                                <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-t border-b border-gray-200">
                                  Others
                                </div>
                              )}
                              <div
                                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0"
                                onClick={() => handleUserSelect(user)}
                              >
                                {/* Avatar - uses profile_image_url from database */}
                                <UserAvatar
                                  userId={user.id}
                                  firstName={user.first_name}
                                  lastName={user.last_name}
                                  username={user.username}
                                  email={user.email}
                                  profileImageUrl={user.profile_image_url}
                                  size="md"
                                />
                                
                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-black text-sm">
                                      {(() => {
                                        // Check if nickname matches the search (for highlighting)
                                        const searchTerm = searchQuery.replace(/^@+/, '').trim().toLowerCase();
                                        const nicknameMatches = user.nickname && user.nickname.toLowerCase().includes(searchTerm);
                                        const displayName = user.first_name && user.last_name 
                                          ? `${user.first_name} ${user.last_name}`
                                          : user.first_name || user.displayName || user.username || 'User';
                                        // Show nickname first if it matches the search, otherwise show displayName
                                        const primaryName = nicknameMatches ? user.nickname : displayName;
                                        const secondaryName = nicknameMatches ? displayName : (user.nickname || null);
                                        return (
                                          <>
                                            {primaryName}
                                            {secondaryName && (
                                              <span className="ml-2 text-gray-400 font-normal">({secondaryName})</span>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </h3>
                                    {isContact && (
                                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-black rounded-full font-medium">
                                        Contact
                                      </span>
                                    )}
                                  </div>
                                  {user.username && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      @{user.username}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : searchQuery.trim().length >= 1 ? (
                      <div className="p-4 text-center">
                        <p className="text-gray-600 text-sm">No users found</p>
                        <p className="text-xs text-gray-500 mt-1">Try searching with a different username</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}


            {/* Right Side Actions */}
            {loading ? null : user ? (
              <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
                {/* Wallet Connection */}
                {isConnected && address ? (
                  <div className="relative" ref={walletMenuRef}>
                    <button
                      onClick={() => {
                        setIsWalletMenuOpen(!isWalletMenuOpen);
                        setIsUserMenuOpen(false);
                        if (!isWalletMenuOpen) {
                          setShowChainMenu(false);
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all h-10 border border-black ${
                        isWalletMenuOpen
                          ? 'bg-white text-black shadow-sm'
                          : 'bg-white text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-sm font-semibold leading-tight">
                          {walletName}
                        </div>
                        <div className="text-xs font-mono leading-tight">
                          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                        </div>
                      </div>
                      {balance && (
                        <div className="text-xs ml-2 whitespace-nowrap">
                          {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                        </div>
                      )}
                      <svg 
                        className={`w-4 h-4 transition-transform flex-shrink-0 ${isWalletMenuOpen ? 'rotate-180' : ''}`}
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
                        <div className="px-4 py-3 border-b border-gray-200">
                          <div className="text-sm font-semibold text-black">{walletName}</div>
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
                        <div className="relative">
                          <button
                            onClick={() => setShowChainMenu(!showChainMenu)}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                              showChainMenu ? 'bg-gray-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>Switch Chain</span>
                            <svg 
                              className={`w-4 h-4 transition-transform ${showChainMenu ? 'rotate-180' : ''}`}
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showChainMenu && (
                            <div className="w-full bg-gray-50 border-t border-gray-200">
                              {AVAILABLE_CHAINS.map((chain) => {
                                const chainId = typeof chain.id === 'string' ? parseInt(chain.id) : chain.id;
                                const isActive = currentChainId === chainId;
                                return (
                                  <button
                                    key={chain.id}
                                    onClick={() => handleSwitchChain(chainId)}
                                    disabled={isActive}
                                    className={`w-full px-8 py-2 text-left text-sm transition-colors ${
                                      isActive
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{chain.name}</span>
                                      {isActive && (
                                        <span className="text-xs text-gray-400">Current</span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
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

                {/* Separator Line */}
                <div className="h-6 w-px bg-gray-200"></div>

                {/* User Profile */}
                <div className="relative flex items-center gap-2" ref={userMenuRef}>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(!isUserMenuOpen);
                      setIsWalletMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50 transition-colors h-10"
                  >
                    {/* Avatar - uses profile_image_url from database */}
                    {user && (
                      <UserAvatar
                        userId={user.id}
                        firstName={userProfile?.first_name}
                        lastName={userProfile?.last_name}
                        username={userProfile?.username}
                        email={user.email}
                        profileImageUrl={userProfile?.profile_image_url}
                        size="sm"
                      />
                    )}
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
                  
                  {/* Share payment link Button */}
                  {userProfile?.username && (
                    <button
                      onClick={async () => {
                        const profileUrl = `${window.location.origin}/${userProfile.username}`;
                        try {
                          await navigator.clipboard.writeText(profileUrl);
                          toast.success('Profile link copied to clipboard!');
                        } catch (error) {
                          console.error('Failed to copy link:', error);
                          toast.error('Failed to copy link');
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-gray-50 transition-colors"
                      title="Share payment link"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span className="text-sm text-gray-600 font-medium">Share payment link</span>
                    </button>
                  )}

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
                        <Link
                          href="/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </Link>
                      </div>

                      {/* Share payment link */}
                      {userProfile?.username && (
                        <button
                          onClick={async () => {
                            const profileUrl = `${window.location.origin}/${userProfile.username}`;
                            try {
                              await navigator.clipboard.writeText(profileUrl);
                              toast.success('Profile link copied to clipboard!');
                              setIsUserMenuOpen(false);
                            } catch (error) {
                              console.error('Failed to copy link:', error);
                              toast.error('Failed to copy link');
                            }
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          Share payment link
                        </button>
                      )}

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

                      {/* Set Preferred Wallets */}
                      <Link
                        href="/settings?tab=preferred-wallets"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors block"
                      >
                        Set Preferred Wallets
                      </Link>

                      {/* Contacts */}
                      <Link
                        href="/settings?tab=contacts"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors block"
                      >
                        Contacts
                      </Link>

                      {/* Documentation */}
                      <Link
                        href="/settings?tab=documentation"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors block"
                      >
                        Documentation
                      </Link>

                      {/* Terms of Use */}
                      <Link
                        href="/settings?tab=terms"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors block"
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

        {/* Subheader Navigation */}
        {loading ? null : user ? (
          <div className="bg-white border-t border-gray-200 pt-3 pb-3">
            <div className="mx-auto px-4 sm:px-6 max-w-7xl flex justify-center">
              <div className="flex items-center bg-gray-100 rounded-full p-1 gap-1">
                {/* Activity */}
                <Link
                  href="/feed"
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-full ${
                    pathname === '/feed' || pathname === '/'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Activity
                </Link>

                {/* Pay & Request */}
                <Link
                  href="/pay-request"
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-full ${
                    pathname === '/pay-request' || pathname?.includes('/payment-request') || pathname?.includes('/pay') || pathname?.includes('/request')
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Pay & Request
                </Link>

                {/* Profile/Settings */}
                <Link
                  href="/settings"
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-full ${
                    pathname === '/settings' || pathname === '/profile'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

    </>
  );
}
