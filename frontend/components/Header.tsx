'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import axios from 'axios';
import DocumentationModal from '@/components/DocumentationModal';
import TermsModal from '@/components/TermsModal';
import SettingsModal from '@/components/SettingsModal';
import PreferredWalletsModal from '@/components/PreferredWalletsModal';
import { getUserGradient, getUserInitials, getAvatarStyle } from '@/lib/userAvatar';
import UserAvatar from '@/components/UserAvatar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface HeaderProps {
  onWalletConnect?: (address: string) => void;
}

export default function Header({ onWalletConnect }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [isDocumentationOpen, setIsDocumentationOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreferredWalletsOpen, setIsPreferredWalletsOpen] = useState(false);
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

  useEffect(() => {
    // Check for authenticated user and fetch profile
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setCurrentUserId(session.user.id);
          
          // Fetch user profile from users table (with timeout)
          try {
            const profilePromise = supabase
              .from('users')
              .select('first_name, last_name, username, profile_image_url')
              .eq('id', session.user.id)
              .single();
            
            const profileTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Profile fetch timeout')), 3000);
            });
            
            const { data: profile, error } = await Promise.race([
              profilePromise,
              profileTimeoutPromise
            ]) as { data: any; error: any };
            
            if (!error && profile) {
              setUserProfile(profile);
            } else {
              // Fallback to user_metadata if profile not found
              setUserProfile({
                first_name: session.user.user_metadata?.first_name || '',
                last_name: session.user.user_metadata?.last_name || '',
                username: session.user.user_metadata?.username || '',
                profile_image_url: session.user.user_metadata?.profile_image_url || null,
              });
            }
          } catch (profileError) {
            // On timeout or error, use fallback
            console.error('[Header] Profile fetch error:', profileError);
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setCurrentUserId(session.user.id);
        
        // Ensure user record exists in public.users table (non-blocking)
        const { ensureUserRecord } = await import('@/lib/auth-utils');
        ensureUserRecord(session.user).catch(err => {
          console.error('[Header] Background ensureUserRecord failed:', err);
        });
        
        // Fetch user profile from users table (with timeout)
        try {
          const profilePromise = supabase
            .from('users')
            .select('first_name, last_name, username, profile_image_url')
            .eq('id', session.user.id)
            .single();
          
          const profileTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile fetch timeout')), 3000);
          });
          
          const { data: profile, error } = await Promise.race([
            profilePromise,
            profileTimeoutPromise
          ]) as { data: any; error: any };
          
          if (!error && profile) {
            setUserProfile(profile);
          } else {
            // Fallback to user_metadata if profile not found
            setUserProfile({
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              username: session.user.user_metadata?.username || '',
              profile_image_url: session.user.user_metadata?.profile_image_url || null,
            });
          }
        } catch (profileError) {
          // On timeout or error, use fallback
          console.error('[Header] Profile fetch error in onAuthStateChange:', profileError);
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
        params: { q: cleanQuery },
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

  const handleUserSelect = (selectedUser: any) => {
    if (selectedUser.username) {
      // Copy username to clipboard and navigate to Pay page
      navigator.clipboard.writeText(`@${selectedUser.username}`);
      toast.success(`Username @${selectedUser.username} copied! Navigating to Pay...`);
      setSearchQuery('');
      setShowSearchResults(false);
      setTimeout(() => {
        router.push(`/pay?to=${encodeURIComponent(`@${selectedUser.username}`)}`);
      }, 500);
    }
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

            {/* Search Bar */}
            {loading ? null : user ? (
              <div className="flex-1 max-w-xl mx-6 relative" ref={searchRef}>
                <div className="relative">
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
                    className="w-full pl-12 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black placeholder-gray-400 text-sm"
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
                  <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto">
                    {searching ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">Searching...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                          Users
                        </div>
                        {searchResults.map((user: any) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
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
                              <h3 className="font-semibold text-black text-sm">
                                {user.first_name && user.last_name 
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.first_name || user.username || 'User'}
                              </h3>
                              {user.username && (
                                <p className="text-xs text-gray-500 mt-0.5">@{user.username}</p>
                              )}
                            </div>
                          </div>
                        ))}
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

            {/* Navigation Tabs */}
            {loading ? null : user ? (
              <div className="flex items-center gap-1">
                {/* Activity Tab */}
                <Link
                  href="/feed"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    pathname === '/feed' || pathname === '/'
                      ? 'bg-gray-100 text-black font-medium'
                      : 'text-gray-600 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">Activity</span>
                </Link>

                {/* Pay & Request Tab */}
                <Link
                  href="/pay-request"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    pathname === '/pay-request' || pathname?.includes('/payment-request') || pathname?.includes('/market')
                      ? 'bg-gray-100 text-black font-medium'
                      : 'text-gray-600 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">Pay & Request</span>
                </Link>
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
                <div className="relative flex items-center" ref={userMenuRef}>
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
                        <button 
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsSettingsOpen(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
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

                      {/* Set Preferred Wallets */}
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsPreferredWalletsOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Set Preferred Wallets
                      </button>

                      {/* Documentation */}
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsDocumentationOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Documentation
                      </button>

                      {/* Terms of Use */}
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsTermsOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Terms of Use
                      </button>

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

      {/* Modals */}
      <DocumentationModal 
        isOpen={isDocumentationOpen} 
        onClose={() => setIsDocumentationOpen(false)} 
      />
      <TermsModal 
        isOpen={isTermsOpen} 
        onClose={() => setIsTermsOpen(false)} 
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        userProfile={userProfile}
        onUpdate={refreshUserProfile}
      />
      <PreferredWalletsModal
        isOpen={isPreferredWalletsOpen}
        onClose={() => setIsPreferredWalletsOpen(false)}
        userId={user?.id || ''}
      />
    </>
  );
}
