'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useSwitchChain, useChainId, useChains } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { isAddress } from 'viem';
import { supabase } from '@/lib/supabase';
import { AVAILABLE_CHAINS, getChainConfig, isEVMChain } from '@/lib/tokenConfig';
import toast from 'react-hot-toast';
import axios from 'axios';
import UserAvatar from '@/components/UserAvatar';
import { api } from '@/lib/api-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface PreferredWallet {
  id: string;
  chain_id: number | string;
  receiving_wallet_address: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();
  const chains = useChains();
  const { openConnectModal } = useConnectModal();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Preferred Wallets state
  const [preferredWallets, setPreferredWallets] = useState<PreferredWallet[]>([]);
  const [connectingChain, setConnectingChain] = useState<number | string | null>(null);
  const [editingChain, setEditingChain] = useState<number | string | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const currentChainIdRef = useRef(currentChainId);
  
  // Contacts state
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState('');
  
  
  useEffect(() => {
    currentChainIdRef.current = currentChainId;
  }, [currentChainId]);

  // Read tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'preferred-wallets', 'contacts', 'documentation', 'terms'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/settings?tab=${tabId}`, { scroll: false });
  };

  useEffect(() => {
    // Non-blocking auth check - load data in background
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('first_name, last_name, username')
        .eq('id', session.user.id)
        .single();
      
      if (!error && profile) {
        setUserProfile(profile);
        setFormData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          username: profile.username || '',
          email: session.user.email || '',
        });
      } else {
        setUserProfile({
          first_name: session.user.user_metadata?.first_name || '',
          last_name: session.user.user_metadata?.last_name || '',
          username: session.user.user_metadata?.username || '',
        });
        setFormData({
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          username: session.user.user_metadata?.username || '',
          email: session.user.email || '',
        });
      }
      setInitialized(true);
    };

    checkAuth();
  }, [router]);

  // Fetch preferred wallets when switching to that tab
  useEffect(() => {
    if (initialized && activeTab === 'preferred-wallets' && user?.id) {
      fetchPreferredWallets(user.id);
    }
  }, [activeTab, initialized, user?.id]);

  // Fetch contacts when switching to that tab
  useEffect(() => {
    if (initialized && activeTab === 'contacts' && user?.id) {
      fetchContacts(user.id);
    }
  }, [activeTab, initialized, user?.id]);

  const fetchPreferredWallets = async (userId: string) => {
    try {
      const wallets = await api.get('/preferred-wallets', {
        params: { userId }
      });
      setPreferredWallets(Array.isArray(wallets) ? wallets : []);
    } catch (error: any) {
      console.error('Error fetching preferred wallets:', error);
      toast.error('Failed to load preferred wallets');
    }
  };

  const fetchContacts = async (userId: string) => {
    try {
      // Use authenticated API client
      const response = await api.get('/contacts', {
        params: { userId }
      });
      // api.get() returns data directly
      setContacts(Array.isArray(response) ? response : []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load contacts';
      toast.error(errorMessage);
      
      // If table doesn't exist, show helpful message
      if (error.response?.data?.code === '42P01' || errorMessage.includes('does not exist')) {
        console.error('Contacts table does not exist. Please run the database migration.');
      }
    }
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchUsersForContact = async (query: string) => {
    const cleanQuery = query.trim().replace(/^@+/, '');
    
    if (!cleanQuery || cleanQuery.length < 1) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/users/search`, {
        params: { q: cleanQuery, userId: user?.id },
        timeout: 5000
      });
      
      // Filter out current user and existing contacts
      const existingContactIds = new Set(contacts.map(c => c.contact_user_id));
      const filtered = response.data.filter((userResult: any) => {
        if (userResult.id === user?.id) return false;
        if (existingContactIds.has(userResult.id)) return false;
        return true;
      });
      
      setSearchResults(filtered);
      setShowSearchResults(true);
    } catch (error: any) {
      console.error('Error searching users:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 1) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsersForContact(searchQuery);
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
  }, [searchQuery]);

  const handleAddContact = async (contactUserId: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      toast.loading('Adding contact...');
      
      const response = await axios.post(`${API_URL}/contacts`, {
        userId: user.id,
        contactUserId: contactUserId
      });

      toast.dismiss();
      toast.success('Contact added');
      
      setContacts(prev => [...prev, response.data]);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      setLoading(false);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error adding contact:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add contact';
      toast.error(errorMessage);
      
      // If it's a duplicate contact error, refresh the list
      if (error.response?.data?.code === '23505' || errorMessage.includes('already exists')) {
        // Contact already exists, refresh the list
        if (user?.id) {
          fetchContacts(user.id);
        }
      }
      
      setLoading(false);
    }
  };

  const handleUpdateNickname = async (contactId: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      toast.loading('Updating nickname...');
      
      const response = await axios.patch(`${API_URL}/contacts/${contactId}`, {
        userId: user.id,
        nickname: editingNickname.trim() || null
      });

      toast.dismiss();
      toast.success('Nickname updated');
      
      setContacts(prev => prev.map(c => c.id === contactId ? response.data : c));
      setEditingContactId(null);
      setEditingNickname('');
      setLoading(false);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error updating nickname:', error);
      toast.error(error.response?.data?.error || 'Failed to update nickname');
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!user?.id) return;
    if (!confirm('Remove this contact?')) return;

    try {
      setLoading(true);
      toast.loading('Removing contact...');
      
      await axios.delete(`${API_URL}/contacts/${contactId}`, {
        params: { userId: user.id }
      });

      toast.dismiss();
      toast.success('Contact removed');
      
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setLoading(false);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error deleting contact:', error);
      toast.error(error.response?.data?.error || 'Failed to remove contact');
      setLoading(false);
    }
  };

  const getWalletForChain = (chainId: number | string): PreferredWallet | undefined => {
    const wallet = preferredWallets.find(w => {
      // Handle numeric chain IDs
      const walletChainId = typeof w.chain_id === 'string' ? parseInt(w.chain_id) : w.chain_id;
      return walletChainId === chainId;
    });
    return wallet;
  };

  const handleAddWallet = async (targetChainId: number | string) => {
    if (!user?.id) return;
    
    const chainName = getChainConfig(targetChainId)?.name || `Chain ${targetChainId}`;
    
    // EVM chains - use existing logic
    if (!isConnected) {
      if (openConnectModal) {
        openConnectModal();
      }
      return;
    }

    try {
      setConnectingChain(targetChainId as number);
      
      if (isEVMChain(targetChainId) && currentChainId !== targetChainId && switchChain) {
        toast.loading(`Connecting to ${chainName}...`);
        try {
          await switchChain({ chainId: targetChainId as any });
          await new Promise(resolve => setTimeout(resolve, 2000));
          toast.dismiss();
        } catch (switchError: any) {
          toast.dismiss();
          setConnectingChain(null);
          setLoading(false);
          
          const errorMessage = switchError?.message || switchError?.shortMessage || '';
          const errorCode = switchError?.code;
          
          if (errorCode === 4902 || 
              errorMessage.includes('Unsupported chain') || 
              errorMessage.includes('not support') ||
              errorMessage.includes('Unsupported network') ||
              errorMessage.includes('does not support')) {
            toast.error(`Your wallet doesn't support ${chainName}. Please add the network to your wallet first, then try again.`);
          } else if (errorCode === 4001) {
            toast.error('Chain switch was rejected. Please approve the network switch in your wallet.');
          } else {
            toast.error(errorMessage || `Failed to connect to ${chainName}. Your wallet may not support this network.`);
          }
          return;
        }
      }
      
      // Only verify chain switch for EVM chains
      if (isEVMChain(targetChainId)) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const actualChainId = currentChainIdRef.current;
        if (actualChainId !== targetChainId) {
          toast.error(`Failed to switch to ${chainName}. Your wallet may not support this network. Please add the network to your wallet first.`);
          setConnectingChain(null);
          setLoading(false);
          return;
        }
      }
      
      if (!address || !isAddress(address)) {
        toast.error('Invalid wallet address');
        setConnectingChain(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      toast.loading('Saving wallet address...');
      
      const savedWallet = await api.post('/preferred-wallets', {
        userId: user.id,
        chainId: targetChainId,
        receivingWalletAddress: address
      });

      toast.dismiss();
      
      setPreferredWallets(prev => {
        const existing = prev.find(w => {
          const wChainId = typeof w.chain_id === 'string' ? parseInt(w.chain_id) : w.chain_id;
          return wChainId === targetChainId;
        });
        if (existing) {
          return prev.map(w => {
            const wChainId = typeof w.chain_id === 'string' ? parseInt(w.chain_id) : w.chain_id;
            return wChainId === targetChainId ? savedWallet : w;
          });
        } else {
          return [...prev, savedWallet];
        }
      });
      
      await fetchPreferredWallets(user.id);
      
      toast.success('Wallet address saved!');
      setConnectingChain(null);
      setLoading(false);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error adding wallet:', error);
      
      if (error?.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save wallet address. Please ensure your wallet supports this network.');
      }
      
      setConnectingChain(null);
      setLoading(false);
    }
  };

  const handleRemoveWallet = async (walletId: string, chainName: string) => {
    if (!confirm(`Remove wallet for ${chainName}?`)) {
      return;
    }

    try {
      setLoading(true);
      toast.loading('Removing wallet...');
      
      await api.delete(`/preferred-wallets/${walletId}`);
      
      toast.dismiss();
      toast.success('Wallet removed');
      
      if (user?.id) {
        await fetchPreferredWallets(user.id);
      }
      setLoading(false);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error removing wallet:', error);
      toast.error('Failed to remove wallet');
      setLoading(false);
    }
  };

  const handleEditWallet = (chainId: number | string, currentAddress?: string) => {
    setEditingChain(chainId);
    setManualAddress(currentAddress || '');
    setAddressError('');
  };

  const handleCancelEdit = () => {
    setEditingChain(null);
    setManualAddress('');
    setAddressError('');
  };

  const handleSaveManualAddress = async (targetChainId: number | string) => {
    const trimmedAddress = manualAddress.trim();
    
    if (!trimmedAddress) {
      setAddressError('Please enter a wallet address');
      return;
    }

    if (!isAddress(trimmedAddress)) {
      setAddressError('Invalid wallet address format');
      return;
    }

    try {
      setLoading(true);
      setAddressError('');
      toast.loading('Saving wallet address...');
      
      await api.post('/preferred-wallets', {
        userId: user.id,
        chainId: targetChainId,
        receivingWalletAddress: trimmedAddress
      });

      toast.dismiss();
      toast.success('Wallet address saved!');
      
      const savedWallet = await api.post('/preferred-wallets', {
        userId: user.id,
        chainId: targetChainId,
        receivingWalletAddress: trimmedAddress
      });
      setPreferredWallets(prev => {
        const existing = prev.find(w => {
          const wChainId = typeof w.chain_id === 'string' ? parseInt(w.chain_id) : w.chain_id;
          return wChainId === targetChainId;
        });
        if (existing) {
          return prev.map(w => {
            const wChainId = typeof w.chain_id === 'string' ? parseInt(w.chain_id) : w.chain_id;
            return wChainId === targetChainId ? savedWallet : w;
          });
        } else {
          return [...prev, savedWallet];
        }
      });
      
      await fetchPreferredWallets(user.id);
      
      setEditingChain(null);
      setManualAddress('');
      setLoading(false);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error saving manual address:', error);
      
      if (error?.response?.data?.error) {
        setAddressError(error.response.data.error);
        toast.error(error.response.data.error);
      } else {
        setAddressError('Failed to save wallet address');
        toast.error('Failed to save wallet address');
      }
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'firstName' || name === 'lastName') {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return;
    }

    if (!user?.id) return;

    setLoading(true);

    try {
      const { error: profileError } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      toast.success('Profile updated successfully');
      
      const { data: profile } = await supabase
        .from('users')
        .select('first_name, last_name, username')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserProfile(profile);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'preferred-wallets', label: 'Preferred Wallets' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'documentation', label: 'Documentation' },
    { id: 'terms', label: 'Terms of Usage' },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'profile':
        return 'Profile Settings';
      case 'preferred-wallets':
        return 'Set Preferred Wallets';
      case 'contacts':
        return 'Contacts';
      case 'documentation':
        return 'Documentation';
      case 'terms':
        return 'Terms of Use';
      default:
        return 'Settings';
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex gap-8">
            <aside className="w-64 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gray-100 text-black font-medium'
                        : 'text-gray-600 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </aside>
            <div className="flex-1">
              <div className="bg-white">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-black mb-2">{getPageTitle()}</h1>
          </div>
            <div className="space-y-6">
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-100 text-black font-medium'
                      : 'text-gray-600 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1">
            <div className="bg-white">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-black mb-2">{getPageTitle()}</h1>
        </div>

              {/* Profile Tab */}
              {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-black mb-2">
                First name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black placeholder-gray-400"
                placeholder="First name"
                required
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-black mb-2">
                Last name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black placeholder-gray-400"
                placeholder="Last name"
                required
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-black mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                  @
                </span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  readOnly
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="email@example.com"
              />
            </div>

              <button
                type="submit"
                disabled={loading}
                    className="w-full px-4 py-3 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
                </form>
              )}

              {/* Preferred Wallets Tab */}
              {activeTab === 'preferred-wallets' && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600">
                    Connect your wallets for each chain where you want to receive payments. You can either connect your wallet 
                    or manually enter a wallet address. When someone sends you a payment, they'll see your preferred wallet 
                    addresses for the chains you've configured.
                  </p>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Chain</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Receiving Wallet</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {AVAILABLE_CHAINS.map((chain) => {
                          // Parse chain ID (all are numeric for EVM chains)
                          const chainId = typeof chain.id === 'string' ? parseInt(chain.id) : chain.id;
                          const wallet = getWalletForChain(chainId);
                          const isConnecting = connectingChain === chainId;
                          
                          return (
                            <tr key={chain.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium text-gray-900">{chain.name}</span>
                              </td>
                              <td className="px-4 py-3">
                                {editingChain === chainId ? (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={manualAddress}
                                      onChange={(e) => {
                                        setManualAddress(e.target.value);
                                        setAddressError('');
                                      }}
                                      placeholder="0x..."
                                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                                        addressError ? 'border-red-500' : 'border-gray-300'
                                      }`}
                                      disabled={loading}
                                    />
                                    {addressError && (
                                      <p className="text-xs text-red-600">{addressError}</p>
                                    )}
                                  </div>
                                ) : wallet ? (
                                  <span className="text-sm font-mono text-gray-600">
                                    {`${wallet.receiving_wallet_address.slice(0, 6)}...${wallet.receiving_wallet_address.slice(-4)}`}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400 italic">Not set</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {editingChain === chainId ? (
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      onClick={handleCancelEdit}
                                      disabled={loading}
                                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveManualAddress(chain.id)}
                                      disabled={loading || !manualAddress.trim()}
                                      className="px-3 py-1.5 text-sm bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {loading ? 'Saving...' : 'Save'}
                                    </button>
                                  </div>
                                ) : wallet ? (
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      onClick={() => handleEditWallet(chainId, wallet.receiving_wallet_address)}
                                      disabled={loading}
                                      className="px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleRemoveWallet(wallet.id, chain.name)}
                                      disabled={loading}
                                      className="px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded-full hover:bg-red-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      onClick={() => handleEditWallet(chainId)}
                                      disabled={loading}
                                      className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                                    >
                                      Manual Entry
                                    </button>
                                    <button
                                      onClick={() => handleAddWallet(chain.id)}
                                      disabled={loading || isConnecting}
                                      className="px-3 py-1.5 text-sm bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Contacts Tab */}
              {activeTab === 'contacts' && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600">
                    Add other Blockbook users as contacts. They'll appear first when you search to pay or request payments. 
                    You can also add nicknames to help you remember who they are.
                  </p>

                  {/* Add Contact Section */}
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="contact-search" className="block text-sm font-medium text-black mb-2">
                        Add Contact
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="contact-search"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                          }}
                          onFocus={() => {
                            if (searchQuery.trim()) {
                              searchUsersForContact(searchQuery);
                            }
                          }}
                          onBlur={() => {
                            // Delay hiding results to allow clicking on them
                            setTimeout(() => setShowSearchResults(false), 200);
                          }}
                          placeholder="Search by username or nickname (e.g., @username or Mom)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black placeholder-gray-400"
                        />
                        {showSearchResults && searchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.map((userResult) => (
                              <button
                                key={userResult.id}
                                onClick={() => {
                                  if (userResult.username) {
                                    router.push(`/user/${userResult.username}`);
                                    setShowSearchResults(false);
                                  }
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                                disabled={loading}
                              >
                                <UserAvatar
                                  userId={userResult.id}
                                  firstName={userResult.first_name}
                                  lastName={userResult.last_name}
                                  username={userResult.username}
                                  email={userResult.email}
                                  profileImageUrl={userResult.profile_image_url}
                                  size="md"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-black truncate">
                                    {userResult.nickname || userResult.displayName}
                                    {userResult.nickname && (
                                      <span className="ml-2 text-gray-400">({userResult.displayName})</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    @{userResult.username}
                                  </div>
                                </div>
                                {userResult.isContact && (
                                  <span className="text-xs text-blue-600 font-medium">Contact</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contacts List */}
                  {contacts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p className="text-sm">No contacts yet. Search and add users above.</p>
                    </div>
                  ) : (
                    <div>
                      {contacts.map((contact, index) => (
                        <div key={contact.id} className={`flex items-center gap-4 ${index < contacts.length - 1 ? 'border-b border-gray-200 pb-6 mb-6' : ''}`}>
                          {contact.user ? (
                            <div 
                              className="cursor-pointer"
                              onClick={() => {
                                if (contact.user?.username) {
                                  router.push(`/user/${contact.user.username}`);
                                }
                              }}
                            >
                            <UserAvatar
                              userId={contact.user.id}
                              firstName={contact.user.first_name}
                              lastName={contact.user.last_name}
                              username={contact.user.username}
                              email={contact.user.email}
                              profileImageUrl={contact.user.profile_image_url}
                              size="lg"
                            />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-base font-medium text-gray-700 flex-shrink-0">
                              ?
                            </div>
                          )}
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              if (contact.user?.username) {
                                router.push(`/user/${contact.user.username}`);
                              }
                            }}
                          >
                            {editingContactId === contact.id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editingNickname}
                                  onChange={(e) => setEditingNickname(e.target.value)}
                                  placeholder="Nickname (optional)"
                                  className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-all bg-white text-black placeholder-gray-400"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUpdateNickname(contact.id);
                                    } else if (e.key === 'Escape') {
                                      setEditingContactId(null);
                                      setEditingNickname('');
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleUpdateNickname(contact.id)}
                                  disabled={loading}
                                  className="px-3 py-1.5 text-sm bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {loading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingContactId(null);
                                    setEditingNickname('');
                                  }}
                                  disabled={loading}
                                  className="text-sm text-black hover:underline font-medium disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="text-sm font-medium text-black mb-1">
                                  {contact.nickname || contact.user?.displayName || contact.user?.username || 'Unknown User'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  @{contact.user?.username || 'unknown'}
                                  {contact.nickname && contact.user && (
                                    <span className="ml-2 text-gray-400">
                                      ({contact.user.displayName || contact.user.username})
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          {editingContactId !== contact.id && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setEditingContactId(contact.id);
                                  setEditingNickname(contact.nickname || '');
                                }}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm text-black border border-gray-300 rounded-full hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                              >
                                {contact.nickname ? 'Edit' : 'Add Nickname'}
                              </button>
                              <button
                                onClick={() => {
                                  const username = contact.user?.username;
                                  if (username) {
                                    router.push(`/pay?to=${username}`);
                                  }
                                }}
                                disabled={loading || !contact.user?.username}
                                className="px-3 py-1.5 text-sm bg-gray-200 text-black rounded-full hover:bg-gray-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Pay
                              </button>
                              <button
                                onClick={() => {
                                  const username = contact.user?.username;
                                  if (username) {
                                    router.push(`/request?to=${username}`);
                                  }
                                }}
                                disabled={loading || !contact.user?.username}
                                className="px-3 py-1.5 text-sm bg-gray-200 text-black rounded-full hover:bg-gray-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Request
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Documentation Tab */}
              {activeTab === 'documentation' && (
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-bold text-black mb-3">Overview</h3>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      Blockbook is a non-custodial cryptocurrency payment platform that enables seamless wallet-to-wallet transactions. 
                      Create payment requests, send direct payments, and manage your crypto payments across multiple blockchain networks.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-black mb-3">Getting Started</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-black mb-1">1. Create an Account</h4>
                        <p className="text-gray-700 text-sm">
                          Sign up with your email and create a unique username. Your account is linked to your wallet address for seamless payments.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-black mb-1">2. Connect Your Wallet</h4>
                        <p className="text-gray-700 text-sm">
                          Connect your MetaMask, WalletConnect, or other supported wallet. The platform supports multiple chains and will automatically switch networks when needed.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-black mb-1">3. Start Using</h4>
                        <p className="text-gray-700 text-sm">
                          Navigate to the "Pay & Request" tab to create payment requests or send payments to other users.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-black mb-3">Key Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200">
                        <h4 className="font-semibold text-black mb-2">Payment Requests</h4>
                        <p className="text-gray-700 text-sm">
                          Create payment requests with custom amounts and notes. Anyone can accept and pay directly to your wallet.
                        </p>
                      </div>
                      <div className="p-4 border border-gray-200">
                        <h4 className="font-semibold text-black mb-2">Direct Payments</h4>
                        <p className="text-gray-700 text-sm">
                          Send payments directly to recipient wallets. Instant transfers with no escrow delays.
                        </p>
                      </div>
                      <div className="p-4 border border-gray-200">
                        <h4 className="font-semibold text-black mb-2">Multi-Chain Support</h4>
                        <p className="text-gray-700 text-sm">
                          Supports Base, Ethereum, BNB Chain, and Polygon. Automatic chain switching for seamless transactions.
                        </p>
                      </div>
                      <div className="p-4 border border-gray-200">
                        <h4 className="font-semibold text-black mb-2">User Profiles</h4>
                        <p className="text-gray-700 text-sm">
                          Each user has a unique profile with username. Send payments using @username instead of wallet addresses.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-black mb-3">How It Works</h3>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold text-black mb-1">Request Payments</h4>
                          <p className="text-gray-700 text-sm">
                            Go to "Pay & Request" → "Request" tab. Enter the amount, select a chain and token (USDC by default), 
                            optionally specify a recipient by @username, add a note, and post your request.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
                          2
                        </div>
                        <div>
                          <h4 className="font-semibold text-black mb-1">Accept & Pay</h4>
                          <p className="text-gray-700 text-sm">
                            View payment requests in your Activity feed. Click "Accept & Pay" to send the payment. 
                            Your wallet will automatically switch to the correct chain if needed.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
                          3
                        </div>
                        <div>
                          <h4 className="font-semibold text-black mb-1">Send Payments</h4>
                          <p className="text-gray-700 text-sm">
                            Use "Pay & Request" → "Pay" tab to send direct payments. Enter recipient @username, amount, 
                            and optional note. Payments are sent instantly to the recipient's wallet.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
                          4
                        </div>
                        <div>
                          <h4 className="font-semibold text-black mb-1">Track Activity</h4>
                          <p className="text-gray-700 text-sm">
                            View all your payment requests and transactions in the Activity feed. See which requests are open, 
                            paid, or cancelled.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-black mb-3">Supported Chains & Tokens</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-black mb-2">Blockchain Networks</h4>
                        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                          <li>Base (Chain ID: 8453)</li>
                          <li>Ethereum (Chain ID: 1)</li>
                          <li>BNB Chain (Chain ID: 56)</li>
                          <li>Polygon (Chain ID: 137)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-black mb-2">Supported Tokens</h4>
                        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                          <li>USDC (USD Coin) - Primary stablecoin</li>
                          <li>USDT (Tether) - Available on select chains</li>
                          <li>More tokens coming soon</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-black mb-3">Security & Privacy</h3>
                    <div className="space-y-2 text-gray-700 text-sm">
                      <p><strong>Non-custodial:</strong> We never hold your funds. All transactions are wallet-to-wallet.</p>
                      <p><strong>Direct Transfers:</strong> Payments are sent directly wallet-to-wallet using standard ERC-20 transfers.</p>
                      <p><strong>Private Keys:</strong> Your private keys never leave your wallet. We never have access to them.</p>
                      <p><strong>Instant Settlement:</strong> Payments are completed immediately upon transaction confirmation.</p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-black mb-3">Tips & Best Practices</h3>
                    <ul className="space-y-2 text-gray-700 text-sm list-disc list-inside">
                      <li>Always verify the recipient's @username before sending payments</li>
                      <li>Double-check the amount and chain before confirming transactions</li>
                      <li>Keep your wallet connected for seamless chain switching</li>
                      <li>Add descriptive notes to payment requests for context</li>
                      <li>Monitor your Activity feed to track all payment requests</li>
                    </ul>
                  </section>
                </div>
              )}

              {/* Terms Tab */}
              {activeTab === 'terms' && (
                <div className="space-y-6">
                  <div>
                    <p className="text-gray-600 text-sm mb-4">
                      <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
                    </p>
                  </div>

                  <section>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      Welcome to Blockbook. These Terms of Use ("Terms") govern your access to and use of the Blockbook platform 
                      ("Platform", "Service", "we", "us", or "our"). By using Blockbook, you agree to be bound by these Terms.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">1. Acceptance of Terms</h3>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      By accessing or using Blockbook, you acknowledge that you have read, understood, and agree to be bound by 
                      these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use the Service.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">2. Description of Service</h3>
                    <p className="text-gray-700 leading-relaxed text-sm mb-1">
                      Blockbook is a non-custodial cryptocurrency payment platform that enables:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 text-sm space-y-0.5 ml-4">
                      <li>Creating and managing payment requests</li>
                      <li>Sending and receiving direct cryptocurrency payments</li>
                      <li>Managing user profiles and payment history</li>
                      <li>Interacting with multiple blockchain networks</li>
                    </ul>
                    <p className="text-gray-700 leading-relaxed text-sm mt-2">
                      Blockbook does not hold, custody, or control your cryptocurrency. All transactions occur directly between 
                      user wallets through blockchain networks.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">3. Eligibility</h3>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      You must be at least 18 years old and have the legal capacity to enter into contracts in your jurisdiction. 
                      You are responsible for ensuring that your use of Blockbook complies with all applicable laws and regulations 
                      in your jurisdiction.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">4. User Accounts</h3>
                    <div className="space-y-1 text-gray-700 text-sm">
                      <p>
                        <strong>4.1 Account Creation:</strong> You must provide accurate and complete information when creating 
                        an account. You are responsible for maintaining the security of your account credentials.
                      </p>
                      <p>
                        <strong>4.2 Username:</strong> You must choose a unique username. Usernames must comply with our 
                        community guidelines and cannot be offensive, misleading, or infringe on others' rights.
                      </p>
                      <p>
                        <strong>4.3 Account Responsibility:</strong> You are solely responsible for all activities that occur 
                        under your account. You must immediately notify us of any unauthorized use of your account.
                      </p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">5. Wallet Connection</h3>
                    <div className="space-y-1 text-gray-700 text-sm">
                      <p>
                        <strong>5.1 Wallet Security:</strong> You are solely responsible for the security of your connected 
                        cryptocurrency wallet and private keys. Blockbook never has access to your private keys or wallet funds.
                      </p>
                      <p>
                        <strong>5.2 Network Fees:</strong> All blockchain network fees (gas fees) are your responsibility. 
                        Blockbook does not charge additional fees for transactions, but network fees apply to all on-chain operations.
                      </p>
                      <p>
                        <strong>5.3 Chain Switching:</strong> Blockbook may automatically switch your wallet to the required 
                        blockchain network. You must approve all network switches and transactions in your wallet.
                      </p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">6. Payments and Transactions</h3>
                    <div className="space-y-1 text-gray-700 text-sm">
                      <p>
                        <strong>6.1 Payment Requests:</strong> When you create a payment request, you authorize others to send 
                        payments to your wallet address. Payment requests are public and can be accepted by anyone.
                      </p>
                      <p>
                        <strong>6.2 Direct Payments:</strong> Payments are sent directly to recipient wallet addresses. 
                        Once confirmed on the blockchain, payments cannot be reversed. Always verify recipient addresses before sending.
                      </p>
                      <p>
                        <strong>6.3 Irreversibility:</strong> Cryptocurrency transactions are irreversible once confirmed on 
                        the blockchain. You are solely responsible for verifying recipient addresses and payment amounts.
                      </p>
                      <p>
                        <strong>6.4 No Refunds:</strong> Blockbook does not process refunds. All transactions are final once 
                        confirmed on the blockchain.
                      </p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">7. Prohibited Uses</h3>
                    <p className="text-gray-700 leading-relaxed text-sm mb-1">
                      You agree not to use Blockbook to:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 text-sm space-y-0.5 ml-4">
                      <li>Violate any applicable laws or regulations</li>
                      <li>Engage in fraud, money laundering, or other illegal activities</li>
                      <li>Impersonate others or provide false information</li>
                      <li>Interfere with or disrupt the Service or servers</li>
                      <li>Attempt to gain unauthorized access to any part of the Service</li>
                      <li>Use the Service for any purpose that could harm Blockbook or its users</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">8. Smart Contracts</h3>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      Blockbook uses smart contracts deployed on various blockchain networks. While we strive to use audited and 
                      secure contracts, smart contracts are experimental technology. You acknowledge the risks associated with 
                      smart contract interactions, including potential bugs, vulnerabilities, or failures.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">9. Disclaimers</h3>
                    <div className="space-y-1 text-gray-700 text-sm">
                      <p>
                        <strong>9.1 No Warranty:</strong> Blockbook is provided "as is" and "as available" without warranties of 
                        any kind, either express or implied.
                      </p>
                      <p>
                        <strong>9.2 Blockchain Risks:</strong> You acknowledge the inherent risks of blockchain technology, 
                        including network congestion, high fees, and potential network failures.
                      </p>
                      <p>
                        <strong>9.3 Third-Party Services:</strong> Blockbook integrates with third-party wallet providers and 
                        blockchain networks. We are not responsible for their services or any issues arising from their use.
                      </p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">10. Limitation of Liability</h3>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      To the maximum extent permitted by law, Blockbook and its operators shall not be liable for any indirect, 
                      incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether 
                      incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting 
                      from your use of the Service.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">11. Indemnification</h3>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      You agree to indemnify, defend, and hold harmless Blockbook and its operators from any claims, damages, 
                      losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation 
                      of these Terms, or infringement of any rights of another.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">12. Modifications to Terms</h3>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      We reserve the right to modify these Terms at any time. We will notify users of material changes via 
                      email or through the Service. Your continued use of Blockbook after changes become effective constitutes 
                      acceptance of the modified Terms.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">13. Termination</h3>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      We may suspend or terminate your access to Blockbook at any time, with or without cause or notice, for any 
                      reason including violation of these Terms. You may stop using the Service at any time.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-black mb-2">14. Contact Information</h3>
                    <p className="text-gray-700 leading-relaxed text-sm">
                      If you have questions about these Terms, please contact us through the platform or at the contact 
                      information provided in our Privacy Policy.
                    </p>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
