'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { api } from '@/lib/api-client';
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, Address, isAddress, formatUnits } from 'viem';
import toast from 'react-hot-toast';
import { AVAILABLE_CHAINS, getTokensForChain, getToken, getChainConfig, type TokenConfig } from '@/lib/tokenConfig';
import { supabase } from '@/lib/supabase';
import { getUserGradient, getUserInitials, getAvatarStyle } from '@/lib/userAvatar';
import UserAvatar from '@/components/UserAvatar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ERC20 ABI for approve and transfer
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  }
] as const;

interface CreateMarketSidebarProps {
  onSuccess: () => void;
  defaultMode?: 'pay' | 'request';
  initialTo?: string;
}

export default function CreateMarketSidebar({ onSuccess, defaultMode = 'request', initialTo }: CreateMarketSidebarProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash,
    query: {
      enabled: !!hash 
    }
  });
  
  // Get mode from URL search params if available, otherwise use defaultMode
  const getInitialMode = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      if (modeParam === 'pay' || modeParam === 'request') {
        return modeParam;
      }
    }
    return defaultMode;
  };
  
  // Mode: 'pay' or 'request'
  const [mode, setMode] = useState<'pay' | 'request'>(getInitialMode());
  
  // Sync mode with URL params when component mounts or URL changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      if (modeParam === 'pay' || modeParam === 'request') {
        setMode(modeParam);
      }
    }
  }, []);
  
  // Initialize with current chain from header, fallback to Base if not connected
  const [formData, setFormData] = useState({
    amount: '',
    to: initialTo || '',
    caption: '',
    chainId: (chainId || 8453) as number | string,
    tokenSymbol: 'USDC',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'creating' | 'success'>('form');
  const [charCount, setCharCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; username: string; displayName: string; walletAddress?: string } | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [preferredWallets, setPreferredWallets] = useState<any[]>([]);
  const [selectedPreferredWallet, setSelectedPreferredWallet] = useState<any | null>(null);
  const [showPreferredWalletModal, setShowPreferredWalletModal] = useState(false);
  const [pendingUserSelection, setPendingUserSelection] = useState<{ id: string; username: string; displayName: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get authenticated user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };
    getUserId();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Search users by username only
  const searchUsers = async (query: string) => {
    const cleanQuery = query.replace(/^@+/, '').trim();
    
    if (!cleanQuery || cleanQuery.length < 1) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchingUsers(true);
      console.log('Calling search API with query:', cleanQuery);
      const response = await axios.get(`${API_URL}/users/search`, {
        params: { q: cleanQuery, userId: userId },
        timeout: 5000
      });
      
      console.log('Search API response:', response.data);
      
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
        if (user.id === userId) return false;
        if (currentUserEmail && user.email === currentUserEmail) return false;
        return true;
      });
      console.log('Filtered results (excluding current user):', filtered);
      
      setSearchResults(filtered);
      setShowSearchResults(true);
      console.log('Setting showSearchResults to true, results count:', filtered.length);
    } catch (error: any) {
      console.error('Error searching users:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Debounced user search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const cleanTo = formData.to.replace(/^@+/, '').trim();
    
    if (cleanTo && cleanTo.length >= 1 && !selectedRecipient) {
      searchTimeoutRef.current = setTimeout(() => {
        console.log('Searching for users by username:', cleanTo);
        searchUsers(cleanTo);
      }, 300);
    } else {
      if (!cleanTo || cleanTo.length < 1 || selectedRecipient) {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [formData.to, userId, selectedRecipient, mode]);

  // Auto-select user when initialTo is provided and search results are available
  useEffect(() => {
    if (initialTo && !selectedRecipient && searchResults.length > 0 && !searchingUsers) {
      const cleanTo = initialTo.replace(/^@+/, '').trim();
      const matchingUser = searchResults.find((u: any) => 
        u.username?.toLowerCase() === cleanTo.toLowerCase()
      );
      if (matchingUser) {
        handleUserSelection(matchingUser);
      }
    }
  }, [searchResults, initialTo, selectedRecipient, searchingUsers]);

  // Helper function to handle user selection
  const handleUserSelection = async (user: any) => {
    const displayName = (user.first_name && user.last_name)
      ? `${user.first_name} ${user.last_name}`
      : user.first_name || user.displayName || user.email?.split('@')[0] || 'User';
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_URL}/preferred-wallets/user/${user.id}`);
      const wallets = response.data || [];
      
      if (wallets.length === 0) {
        toast.error('This user has no preferred wallets set up. They need to configure their preferred wallets first.');
        setLoading(false);
        return;
      }
      
      setPreferredWallets(wallets);
      setPendingUserSelection({
        id: user.id,
        username: user.username || '',
        displayName: displayName
      });
      setShowSearchResults(false);
      setShowPreferredWalletModal(true);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching preferred wallets:', error);
      toast.error(error.response?.data?.error || 'Could not fetch preferred wallets for this user');
      setLoading(false);
      return;
    }
  };

  // Update loading state based on transaction status
  useEffect(() => {
    if (mode === 'pay' && (isPending || isConfirming)) {
      setLoading(true);
      setStep('creating');
    } else if (mode === 'pay' && !isPending && !isConfirming && !isSuccess) {
      setLoading(false);
    }
  }, [mode, isPending, isConfirming, isSuccess]);

  // Update formData when chain changes in header
  useEffect(() => {
    if (chainId) {
      setFormData(prev => {
        if (prev.chainId !== chainId) {
          const allChainTokens = getTokensForChain(chainId);
          const stablecoins = allChainTokens.filter(token => 
            token.symbol === 'USDC' || 
            token.symbol === 'USDT' || 
            token.symbol === 'PYUSD' || 
            token.symbol === 'USDe' ||
            token.symbol === 'WETH'
          );
          const defaultToken = stablecoins.find(t => t.symbol === prev.tokenSymbol)?.symbol || stablecoins[0]?.symbol || 'USDC';
          
          return {
            ...prev,
            chainId: chainId as number | string,
            tokenSymbol: defaultToken
          };
        }
        return prev;
      });
    }
  }, [chainId]);

  // Get available tokens for selected chain
  const allTokens = getTokensForChain(formData.chainId);
  const availableTokens = allTokens.filter(token => 
    token.symbol === 'USDC' || 
    token.symbol === 'USDT' || 
    token.symbol === 'PYUSD' || 
    token.symbol === 'USDe' ||
    token.symbol === 'WETH'
  );
  const selectedToken = getToken(formData.tokenSymbol, formData.chainId);
  const selectedChain = getChainConfig(formData.chainId);
  const chainIdNum = typeof formData.chainId === 'number' 
    ? formData.chainId 
    : parseInt(formData.chainId as string);

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 300) {
      setFormData({ ...formData, caption: value });
      setCharCount(value.length);
    } else {
      const truncated = value.slice(0, 300);
      setFormData({ ...formData, caption: truncated });
      setCharCount(300);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // No need to adjust height - keeping fixed size
  };

  const [paymentSendId, setPaymentSendId] = useState<string | null>(null);
  const processedHashRef = useRef<string | null>(null);

  // Handle transaction success for direct payments
  useEffect(() => {
    console.log('[CreateMarketSidebar] Transaction receipt effect', {
      isSuccess,
      hash,
      mode,
      isConfirming,
      shouldCallHandler: isSuccess && hash && mode === 'pay',
      alreadyProcessed: processedHashRef.current === hash
    });
    
    if (isSuccess && hash && mode === 'pay' && processedHashRef.current !== hash) {
      console.log('[CreateMarketSidebar] ✅ Transaction confirmed, calling handleDirectPaymentSuccess');
      processedHashRef.current = hash;
      handleDirectPaymentSuccess(hash);
    }
  }, [isSuccess, hash, mode, isConfirming]);

  useEffect(() => {
    if (hash && mode === 'pay') {
      console.log('[CreateMarketSidebar] 📝 Transaction hash received:', hash);
      console.log('[CreateMarketSidebar] Waiting for transaction receipt...');
    }
  }, [hash, mode]);

  const handleDirectPaymentSuccess = async (txHash: string) => {
    console.log('[CreateMarketSidebar] 🎉 handleDirectPaymentSuccess called with txHash:', txHash);
    try {
      toast.dismiss();
      
      let paymentSendIdToUpdate: string | null = null;
      
      if (paymentSendId) {
        paymentSendIdToUpdate = paymentSendId;
        console.log('[CreateMarketSidebar] Using stored paymentSendId:', paymentSendIdToUpdate);
      } else {
        console.log('[CreateMarketSidebar] Payment send ID not in state, searching by tx_hash:', txHash);
        try {
          const searchResponse = await axios.get(`${API_URL}/payment-sends`, {
            params: { txHash: txHash }
          });
          
          if (searchResponse.data && searchResponse.data.length > 0) {
            const pendingSend = searchResponse.data.find((send: any) => {
              const sendTxHash = send.tx_hash || send.txHash;
              return sendTxHash === txHash && send.status === 'pending';
            }) || searchResponse.data[0];
            
            if (pendingSend) {
              paymentSendIdToUpdate = pendingSend.id;
              console.log('[CreateMarketSidebar] ✅ Found existing payment send by tx_hash:', paymentSendIdToUpdate);
            }
          }
        } catch (searchError: any) {
          console.warn('[CreateMarketSidebar] Could not search for payment send by tx_hash:', searchError.message);
        }
      }
      
      if (paymentSendIdToUpdate) {
        console.log('[CreateMarketSidebar] Updating payment send status to confirmed:', paymentSendIdToUpdate);
        try {
          await api.patch(`/payment-sends/${paymentSendIdToUpdate}/confirmed`, {
            txHash: txHash
          });
          console.log('[CreateMarketSidebar] ✅ Payment send marked as confirmed');
        } catch (error: any) {
          console.error('[CreateMarketSidebar] ❌ Error updating payment send status:', error);
        }
      } else {
        console.log('[CreateMarketSidebar] Payment send not found, creating new record...');
        const recipientAddress = selectedRecipient?.walletAddress || formData.to;
        
        if (selectedToken && selectedChain && recipientAddress && address) {
          try {
            const payload = {
              senderAddress: address,
              senderUserId: userId,
              recipientAddress: recipientAddress,
              recipientUserId: selectedRecipient?.id || null,
              amount: formData.amount,
              tokenSymbol: selectedToken.symbol,
              tokenAddress: selectedToken.address,
              chainId: formData.chainId,
              chainName: selectedChain.name,
              caption: formData.caption || null,
              txHash: txHash
            };
            console.log('[CreateMarketSidebar] 📤 Creating payment send with payload:', JSON.stringify(payload, null, 2));
            const response = await api.post('/payment-sends', payload);
            console.log('[CreateMarketSidebar] ✅ Payment send record created successfully:', response);
            setPaymentSendId(response.id);
            
            try {
              await api.patch(`/payment-sends/${response.id}/confirmed`, {
                txHash: txHash
              });
              console.log('[CreateMarketSidebar] ✅ Payment send marked as confirmed');
            } catch (error: any) {
              console.error('[CreateMarketSidebar] ❌ Error updating payment send status:', error);
            }
          } catch (error: any) {
            console.error('[CreateMarketSidebar] ❌ Error creating payment send record:', error);
          }
        }
      }
      
      toast.success('Payment sent successfully!');
      setLoading(false);
      setStep('success');
      
      onSuccess();
      
      setTimeout(() => {
        setFormData({ amount: '', to: '', caption: '', chainId: (chainId || 8453) as number | string, tokenSymbol: 'USDC' });
        setCharCount(0);
        setSelectedRecipient(null);
        setPreferredWallets([]);
        setSelectedPreferredWallet(null);
        setPendingUserSelection(null);
        setShowPreferredWalletModal(false);
        setPaymentSendId(null);
        processedHashRef.current = null;
        setStep('form');
      }, 2000);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment');
      setLoading(false);
      setStep('form');
    }
  };

  useEffect(() => {
    if (error && mode === 'pay') {
      toast.dismiss();
      toast.error(error.message || 'Failed to send payment');
      setLoading(false);
      setStep('form');
    }
  }, [error, mode]);

  const validateForm = () => {
    if (mode === 'request' && formData.to && !selectedRecipient) {
      toast.error('Please select a user from the search results');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    if (parseFloat(formData.amount) < 0.01) {
      toast.error('Minimum amount is 0.01 USDC');
      return false;
    }
    if (mode === 'pay' && !formData.to && !selectedRecipient) {
      toast.error('Please enter a recipient username or wallet address');
      return false;
    }
    if (mode === 'pay' && selectedRecipient && !selectedRecipient.walletAddress && !isAddress(formData.to)) {
      toast.error('Please enter a wallet address for the recipient');
      return false;
    }
    return true;
  };

  const handlePaySubmit = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!selectedToken || !selectedChain) {
      toast.error('Invalid token or chain selection');
      return;
    }

    let recipientAddress: string;
    let recipientUserId: string | null = null;
    
    if (selectedRecipient?.walletAddress) {
      recipientAddress = selectedRecipient.walletAddress;
      recipientUserId = selectedRecipient.id;
    } else if (isAddress(formData.to)) {
      recipientAddress = formData.to;
    } else if (selectedRecipient) {
      toast.error('Please enter a wallet address for this recipient');
      return;
    } else {
      const cleanUsername = formData.to.replace(/^@+/, '').trim();
      if (cleanUsername.length > 0) {
        try {
          setLoading(true);
          toast.loading('Looking up recipient...');
          
          const searchResponse = await axios.get(`${API_URL}/users/search`, {
            params: { q: cleanUsername },
            timeout: 5000
          });
          
          const foundUser = searchResponse.data.find((u: any) => 
            u.username?.toLowerCase() === cleanUsername.toLowerCase()
          );
          
          if (!foundUser) {
            toast.dismiss();
            toast.error('Recipient wallet address not found. Please try again.');
            setLoading(false);
            return;
          }
          
          const walletResponse = await axios.get(`${API_URL}/preferred-wallets/user/${foundUser.id}`);
          const preferredWallets = walletResponse.data || [];
          
          const targetChainId = formData.chainId;
          const chainWallet = preferredWallets.find((w: any) => {
            const wChainId = String(w.chain_id).toLowerCase();
            const targetChainIdStr = String(targetChainId).toLowerCase();
            return wChainId === targetChainIdStr;
          });
          
          if (!chainWallet || !chainWallet.receiving_wallet_address) {
            toast.dismiss();
            const chainName = getChainConfig(targetChainId as number)?.name || 'this chain';
            toast.error(`Recipient wallet address not found. ${foundUser.username || 'User'} does not have a preferred wallet for ${chainName}.`);
            setLoading(false);
            return;
          }
          
          recipientAddress = chainWallet.receiving_wallet_address;
          recipientUserId = foundUser.id;
          
          setSelectedRecipient({
            id: foundUser.id,
            username: foundUser.username || '',
            displayName: foundUser.first_name && foundUser.last_name
              ? `${foundUser.first_name} ${foundUser.last_name}`
              : foundUser.first_name || foundUser.displayName || foundUser.email?.split('@')[0] || 'User',
            walletAddress: chainWallet.receiving_wallet_address
          });
          
          toast.dismiss();
        } catch (error: any) {
          toast.dismiss();
          console.error('Error looking up recipient:', error);
          toast.error('Recipient wallet address not found. Please try again.');
          return;
        } finally {
          setLoading(false);
        }
      } else {
        toast.error('Please select a recipient or enter a wallet address');
        return;
      }
    }

    if (!isAddress(recipientAddress)) {
      toast.error('Invalid recipient address');
      return;
    }

    const chainIdNum = typeof formData.chainId === 'number' 
      ? formData.chainId 
      : parseInt(formData.chainId as string);

    if (chainIdNum !== chainId && switchChain) {
      try {
        toast.loading('Switching chain...');
        await switchChain({ chainId: chainIdNum as any });
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.dismiss();
      } catch (error) {
        toast.dismiss();
        console.error('Error switching chain:', error);
        toast.error('Failed to switch chain');
        return;
      }
    }

    try {
      setLoading(true);
      setStep('creating');
      const token = getToken(formData.tokenSymbol, formData.chainId);
      const decimals = token?.decimals || 6;
      const amountInWei = parseUnits(formData.amount.toString(), decimals);

      if (!isAddress(selectedToken.address)) {
        toast.error('Invalid token address');
        setLoading(false);
        setStep('form');
        return;
      }

      toast.loading('Sending payment...');

      const paymentData = {
        senderAddress: address!,
        senderUserId: userId,
        recipientAddress: recipientAddress,
        recipientUserId: recipientUserId || selectedRecipient?.id || null,
        amount: formData.amount,
        tokenSymbol: selectedToken.symbol,
        tokenAddress: selectedToken.address,
        chainId: formData.chainId,
        chainName: selectedChain.name,
        caption: formData.caption || null
      };

      writeContract({
        address: selectedToken.address as Address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [recipientAddress as Address, amountInWei],
      }, {
        onSuccess: async (txHash) => {
          console.log('[CreateMarketSidebar] ✅ writeContract onSuccess called with hash:', txHash);
          toast.loading('Transaction pending...');
          
          if (txHash && mode === 'pay') {
            console.log('[CreateMarketSidebar] 📝 Creating payment send record immediately with hash:', txHash);
            try {
              const payload = {
                ...paymentData,
                txHash: txHash
              };
              console.log('[CreateMarketSidebar] 📤 Creating payment send with payload:', JSON.stringify(payload, null, 2));
              const response = await axios.post(`${API_URL}/payment-sends`, payload);
              console.log('[CreateMarketSidebar] ✅ Payment send record created successfully:', response.data);
              setPaymentSendId(response.data.id);
            } catch (error: any) {
              console.error('[CreateMarketSidebar] ❌ Error creating payment send record (fallback):', error);
            }
          }
        },
        onError: (error: any) => {
          console.error('[CreateMarketSidebar] ❌ writeContract error:', error);
          toast.dismiss();
          
          let errorMessage = 'Failed to send payment';
          if (error?.message?.includes('transfer amount exceeds balance') || 
              error?.message?.includes('exceeds balance') ||
              error?.message?.includes('ERC20: transfer amount exceeds balance')) {
            errorMessage = 'Insufficient balance';
          } else if (error?.message?.includes('user rejected') || 
                     error?.message?.includes('User rejected')) {
            errorMessage = 'Transaction was cancelled';
          } else if (error?.message) {
            errorMessage = error.message;
          }
          
          toast.error(errorMessage);
          setLoading(false);
          setStep('form');
        }
      });
    } catch (error: any) {
      toast.dismiss();
      console.error('Error in payment flow:', error);
      toast.error(error.message || 'Failed to send payment');
      setLoading(false);
      setStep('form');
    }
  };

  const handleRequestSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    const requesterAddress = address;

    try {
      setLoading(true);
      setStep('creating');
      toast.loading('Creating crypto request...');

      if (!selectedToken || !selectedChain) {
        toast.error('Invalid token or chain selection');
        return;
      }

      const amountToSubmit = formData.amount;

      await api.post('/payment-requests', {
        requesterAddress: requesterAddress,
        recipientUserId: selectedRecipient?.id || null,
        amount: amountToSubmit,
        tokenSymbol: selectedToken.symbol,
        tokenAddress: selectedToken.address,
        chainId: formData.chainId,
        chainName: selectedChain.name,
        caption: formData.caption || null
      });

      toast.dismiss();
      setStep('success');
      toast.success('Crypto request created!');
      
      setFormData({ amount: '', to: '', caption: '', chainId: (chainId || 8453) as number | string, tokenSymbol: 'USDC' });
      setCharCount(0);
      setSelectedRecipient(null);
      setPreferredWallets([]);
      setSelectedPreferredWallet(null);
      setPendingUserSelection(null);
      setShowPreferredWalletModal(false);
      
      console.log('Request created successfully, refreshing feed...');
      setTimeout(() => {
        onSuccess();
        setStep('form');
      }, 500);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error creating payment request:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to create crypto request');
      setStep('form');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (mode === 'pay') {
      await handlePaySubmit();
    } else {
      await handleRequestSubmit();
    }
  };

  const handlePreferredWalletSelect = (wallet: any) => {
    if (!pendingUserSelection) return;
    
    setSelectedPreferredWallet(wallet);
    const chainIdNum = typeof wallet.chain_id === 'string' ? parseInt(wallet.chain_id) : wallet.chain_id;
    const allChainTokens = getTokensForChain(chainIdNum);
    const stablecoins = allChainTokens.filter(token => 
      token.symbol === 'USDC' || 
      token.symbol === 'USDT' || 
      token.symbol === 'PYUSD' || 
      token.symbol === 'USDe' ||
      token.symbol === 'WETH'
    );
    const defaultToken = stablecoins.find(t => t.symbol === formData.tokenSymbol)?.symbol || stablecoins[0]?.symbol || 'USDC';
    
    setFormData({ 
      ...formData, 
      chainId: chainIdNum,
      tokenSymbol: defaultToken,
      to: pendingUserSelection.username
    });
    
    setSelectedRecipient({
      id: pendingUserSelection.id,
      username: pendingUserSelection.username,
      displayName: pendingUserSelection.displayName,
      walletAddress: wallet.receiving_wallet_address
    });
    
    if (isConnected && typeof chainIdNum === 'number' && switchChain && chainIdNum !== chainId) {
      try {
        switchChain({ chainId: chainIdNum as any });
      } catch (error) {
        console.error('Error switching chain:', error);
      }
    }
    
    setShowPreferredWalletModal(false);
    setPendingUserSelection(null);
  };

  return (
    <div className="p-4 flex flex-col items-center">
      {/* Pay/Request Toggle */}
      <div className="flex items-center justify-center mb-5 w-full">
        <div className="flex bg-gray-100 rounded-full p-1 w-full max-w-xs">
          <button
            type="button"
            onClick={() => {
              router.push('/pay');
            }}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === 'pay'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            disabled={loading}
          >
            Pay
          </button>
          <button
            type="button"
            onClick={() => {
              router.push('/request');
            }}
            className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === 'request'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            disabled={loading}
          >
            Request
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-center mb-5 pb-3 border-b border-gray-200 w-full">
        <h3 className="text-lg font-bold text-black tracking-tight">
          {mode === 'pay' ? 'Pay crypto' : 'Request crypto'}
        </h3>
      </div>
      
      {step === 'success' ? (
        <div className="text-center py-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="text-base font-bold mb-0.5">
            {mode === 'pay' ? 'Payment Sent!' : 'Request Posted!'}
          </h4>
          <p className="text-xs text-gray-600">Refreshing...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-0 w-full">
          {/* To Field */}
          <div className="mb-4 w-full relative" style={{ position: 'relative' }}>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <div className="relative" style={{ position: 'relative' }}>
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 pointer-events-none font-medium">
                @
              </span>
              <input
                type="text"
                value={selectedRecipient ? selectedRecipient.username : formData.to.replace(/^@/, '')}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/^@+/, '');
                  
                  if (selectedRecipient && value !== selectedRecipient.username) {
                    setSelectedRecipient(null);
                    setPreferredWallets([]);
                    setSelectedPreferredWallet(null);
                    setPendingUserSelection(null);
                    setShowPreferredWalletModal(false);
                  }
                  setFormData({ ...formData, to: value });
                  
                  const cleanValue = value.replace(/^@+/, '').trim();
                  if (cleanValue.length >= 1 && !selectedRecipient) {
                    setShowSearchResults(true);
                    if (cleanValue.length >= 1) {
                      searchUsers(cleanValue);
                    }
                  } else if (cleanValue.length === 0) {
                    setShowSearchResults(false);
                    setSearchResults([]);
                  }
                }}
                onFocus={() => {
                  const cleanTo = formData.to.replace(/^@+/, '').trim();
                  if (cleanTo.length >= 1 && !selectedRecipient) {
                    searchUsers(cleanTo);
                  }
                  if (searchResults.length > 0 && !selectedRecipient) {
                    setShowSearchResults(true);
                  }
                }}
                onBlur={(e) => {
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  if (!relatedTarget || !relatedTarget.closest('.search-results-dropdown')) {
                    setTimeout(() => setShowSearchResults(false), 300);
                  }
                }}
                className="w-full pl-8 pr-4 py-2 rounded-full border border-gray-300 bg-white placeholder-gray-400 text-base focus:outline-none focus:border-black transition-all text-black"
                placeholder="username"
                disabled={loading}
                required={mode === 'request'}
                style={{ height: '40px' }}
              />

              {searchingUsers && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}

              {selectedRecipient && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecipient(null);
                    setPreferredWallets([]);
                    setSelectedPreferredWallet(null);
                    setPendingUserSelection(null);
                    setShowPreferredWalletModal(false);
                    setFormData({ ...formData, to: '' });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Search Results Dropdown */}
              {(() => {
                const cleanTo = formData.to.replace(/^@+/, '').trim();
                const hasText = cleanTo.length >= 1;
                const shouldShow = hasText && !selectedRecipient && (mode === 'request' || mode === 'pay') && showSearchResults;
                
                if (hasText) {
                  console.log('🔍 Dropdown visibility:', {
                    cleanTo,
                    hasText,
                    selectedRecipient: !!selectedRecipient,
                    mode,
                    shouldShow,
                    showSearchResults,
                    searchingUsers,
                    searchResultsCount: searchResults.length,
                    willRender: shouldShow
                  });
                }
                
                return shouldShow;
              })() && (
                <div 
                  className="search-results-dropdown absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto" 
                  style={{ 
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    position: 'absolute',
                    backgroundColor: 'white',
                    minHeight: '40px',
                    zIndex: 9999
                  }}
                >
                  {searchingUsers ? (
                    <div className="px-4 py-3 text-center text-gray-500 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user: any, index: number) => {
                      const displayName = (user.first_name && user.last_name)
                        ? `${user.first_name} ${user.last_name}`
                        : user.first_name || user.displayName || user.email?.split('@')[0] || 'User';
                      const isContact = user.isContact || false;
                      const isFirstNonContact = !isContact && index > 0 && searchResults[index - 1]?.isContact;
                      
                      const searchTerm = formData.to.replace(/^@+/, '').trim().toLowerCase();
                      const nicknameMatches = user.nickname && user.nickname.toLowerCase().includes(searchTerm);
                      const primaryName = nicknameMatches ? user.nickname : displayName;
                      const secondaryName = nicknameMatches ? displayName : (user.nickname || null);
                      
                      return (
                        <div key={user.id}>
                          {isFirstNonContact && (
                            <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-t border-b border-gray-200">
                              Others
                            </div>
                          )}
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                            }}
                            onClick={() => handleUserSelection(user)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0 flex items-center gap-3"
                          >
                            <UserAvatar
                              userId={user.id}
                              firstName={user.first_name}
                              lastName={user.last_name}
                              username={user.username}
                              email={user.email}
                              profileImageUrl={user.profile_image_url}
                              size="md"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-black text-sm leading-tight">
                                  {primaryName}
                                  {secondaryName && (
                                    <span className="ml-2 text-gray-400">({secondaryName})</span>
                                  )}
                                </span>
                                {isContact && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-black rounded-full font-medium">
                                    Contact
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 mt-0.5 leading-tight">
                                @{user.username}
                              </div>
                            </div>
                            
                            <div className="flex-shrink-0 text-gray-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>
                        </div>
                      );
                    })
                  ) : formData.to.replace(/^@+/, '').trim().length >= 1 ? (
                    <div className="px-4 py-3 text-center text-gray-500 text-sm">
                      No users found
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Amount Input */}
          <div className="relative pb-4 mb-4 w-full">
            <div className="flex items-baseline gap-2 border-b border-gray-200 pb-3">
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                    setFormData({ ...formData, amount: value });
                  }
                }}
                className="flex-1 min-w-0 px-0 py-2 border-0 bg-transparent placeholder-gray-400 text-2xl font-semibold focus:outline-none focus:border-gray-400 transition-colors text-black [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
                disabled={loading}
              />

              {/* Token Selector */}
              <div className="relative flex-shrink-0">
                <select
                  value={formData.tokenSymbol}
                  onChange={(e) => {
                    const newToken = availableTokens.find(t => t.symbol === e.target.value);
                    if (newToken) {
                      setFormData({ ...formData, tokenSymbol: e.target.value });
                    }
                  }}
                  className="appearance-none px-2.5 py-1.5 pr-6 rounded-full border border-gray-300 bg-transparent text-sm font-semibold focus:outline-none focus:border-black transition-colors cursor-pointer text-gray-700 whitespace-nowrap"
                  disabled={loading}
                  style={{ minWidth: 'fit-content' }}
                >
                  {availableTokens.map(token => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol === 'WETH' ? 'ETH' : token.symbol}
                    </option>
                  ))}
                </select>
                <svg className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>

            {/* Chain Display */}
            {selectedRecipient && selectedPreferredWallet && (
              <div className="relative mt-3 flex justify-end">
                <div className="px-3 py-1.5 rounded-full border border-gray-300 bg-transparent text-sm font-semibold text-gray-700">
                  {(() => {
                    const chainIdNum = typeof selectedPreferredWallet.chain_id === 'string' 
                      ? parseInt(selectedPreferredWallet.chain_id) 
                      : selectedPreferredWallet.chain_id;
                    const chainConfig = getChainConfig(chainIdNum);
                    return chainConfig?.name || `Chain ${selectedPreferredWallet.chain_id}`;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Caption Field */}
          <div className="relative mb-4 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">For</label>
            <textarea
              ref={textareaRef}
              value={formData.caption}
              onChange={handleCaptionChange}
              onPaste={handlePaste}
              className="w-full px-4 py-2 rounded-full border border-gray-300 bg-white placeholder-gray-400 text-base focus:outline-none focus:border-black transition-colors resize-none overflow-hidden text-black"
              placeholder="Add note"
              disabled={loading}
              rows={1}
              style={{ height: '40px' }}
            />
          </div>

          {/* Bottom Section */}
          <div className="pt-3 space-y-3">
            {mode === 'request' && (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="whitespace-nowrap">Anyone can click Accept to pay directly to your wallet</span>
              </div>
            )}

            {mode === 'pay' && (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="whitespace-nowrap">Payment sent directly to recipient wallet</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={
                  loading || 
                  isPending || 
                  isConfirming ||
                  !formData.amount || 
                  parseFloat(formData.amount) < 0.01 || 
                  (mode === 'pay' && (!isConnected || !formData.to)) ||
                  (mode === 'request' && !isConnected)
                }
                className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {(step === 'creating' || isPending || isConfirming) && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {(() => {
                  if (step === 'success') {
                    return mode === 'pay' ? 'Payment Sent!' : 'Request Posted!';
                  } else if (step === 'creating' || isPending || isConfirming) {
                    return mode === 'pay' ? 'Sending...' : 'Posting...';
                  } else {
                    return mode === 'pay' ? 'Pay crypto' : 'Request crypto';
                  }
                })()}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Preferred Wallet Selection Modal */}
      {showPreferredWalletModal && pendingUserSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:py-12">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowPreferredWalletModal(false);
              setPendingUserSelection(null);
            }}
          />
          
          <div className="relative bg-white max-w-md w-full rounded-lg shadow-xl overflow-hidden">
            <div className="px-8 sm:px-10 pt-8 sm:pt-10 pb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-black mb-2">
                    Select Wallet for
                  </h2>
                  <div className="flex items-center gap-2">
                    <h3 className="text-3xl font-bold text-black">
                      {pendingUserSelection.displayName}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPreferredWalletModal(false);
                    setPendingUserSelection(null);
                  }}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors flex-shrink-0 ml-4"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-8 sm:px-10 pb-8 sm:pb-10 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {preferredWallets.map((wallet: any) => {
                  const chainIdNum = typeof wallet.chain_id === 'string' ? parseInt(wallet.chain_id) : wallet.chain_id;
                  const chainConfig = getChainConfig(chainIdNum);
                  const isSelected = selectedPreferredWallet?.id === wallet.id;
                  
                  return (
                    <button
                      key={wallet.id}
                      type="button"
                      onClick={() => handlePreferredWalletSelect(wallet)}
                      className={`w-full px-4 py-3 rounded-full transition-all ${
                        isSelected
                          ? 'bg-black text-white'
                          : 'bg-gray-200 text-black hover:bg-gray-300'
                      } font-semibold text-sm`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-semibold text-sm">
                            {chainConfig?.name || `Chain ${wallet.chain_id}`}
                          </div>
                        </div>
                        {isSelected && (
                          <svg className="w-5 h-5 flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

