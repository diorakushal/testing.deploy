'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
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
  const chainId = useChainId(); // Get current chain from header
  const { switchChain } = useSwitchChain(); // To switch chain in header
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
    to: initialTo || '', // Recipient field
    caption: '',
    chainId: (chainId || 8453) as number | string, // Use current chain from header, default to Base
    tokenSymbol: 'USDC', // Default token
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'creating' | 'success'>('form');
  const [charCount, setCharCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; username: string; displayName: string; walletAddress?: string } | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);
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
    // Remove @ if present
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
      // Always show dropdown when search completes (to show results or "no results")
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

    // Search if there's text, no recipient selected, in both request and pay modes
    // Remove @ prefix if user typed it
    const cleanTo = formData.to.replace(/^@+/, '').trim();
    
    if (cleanTo && cleanTo.length >= 1 && !selectedRecipient) {
      searchTimeoutRef.current = setTimeout(() => {
        console.log('Searching for users by username:', cleanTo);
        searchUsers(cleanTo);
      }, 300);
    } else {
      // Clear results if conditions not met
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
        // Only update if chain actually changed
        if (prev.chainId !== chainId) {
          const allChainTokens = getTokensForChain(chainId);
          const stablecoins = allChainTokens.filter(token => token.symbol === 'USDC' || token.symbol === 'USDT');
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

  // Get available tokens for selected chain - filter to only stablecoins (USDC, USDT)
  const allTokens = getTokensForChain(formData.chainId);
  const availableTokens = allTokens.filter(token => token.symbol === 'USDC' || token.symbol === 'USDT');
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

  // Store payment send ID to update status later
  const [paymentSendId, setPaymentSendId] = useState<string | null>(null);
  const processedHashRef = useRef<string | null>(null); // Track processed transaction hashes

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
    
    // Only process if transaction is confirmed, we're in pay mode, and we haven't already processed this hash
    if (isSuccess && hash && mode === 'pay' && processedHashRef.current !== hash) {
      console.log('[CreateMarketSidebar] ✅ Transaction confirmed, calling handleDirectPaymentSuccess');
      processedHashRef.current = hash; // Mark as processed before calling
      handleDirectPaymentSuccess(hash);
    }
  }, [isSuccess, hash, mode, isConfirming]);

  // Also listen for hash changes to log when transaction is submitted
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
      
      // First, try to find existing payment send by tx_hash (most reliable method)
      let paymentSendIdToUpdate: string | null = null;
      
      if (paymentSendId) {
        // Use the stored paymentSendId if available
        paymentSendIdToUpdate = paymentSendId;
        console.log('[CreateMarketSidebar] Using stored paymentSendId:', paymentSendIdToUpdate);
      } else {
        // Fallback: Query payment sends by tx_hash to find the existing record
        console.log('[CreateMarketSidebar] Payment send ID not in state, searching by tx_hash:', txHash);
        try {
          const searchResponse = await axios.get(`${API_URL}/payment-sends`, {
            params: { txHash: txHash }
          });
          
          if (searchResponse.data && searchResponse.data.length > 0) {
            // Find the most recent pending payment send with this tx_hash
            // Supabase returns snake_case, so we check both tx_hash and txHash (in case of transformation)
            const pendingSend = searchResponse.data.find((send: any) => {
              const sendTxHash = send.tx_hash || send.txHash;
              return sendTxHash === txHash && send.status === 'pending';
            }) || searchResponse.data[0];
            
            if (pendingSend) {
              paymentSendIdToUpdate = pendingSend.id;
              console.log('[CreateMarketSidebar] ✅ Found existing payment send by tx_hash:', paymentSendIdToUpdate, {
                tx_hash: pendingSend.tx_hash || pendingSend.txHash,
                status: pendingSend.status
              });
            }
          }
        } catch (searchError: any) {
          console.warn('[CreateMarketSidebar] Could not search for payment send by tx_hash:', searchError.message);
        }
      }
      
      // Update the payment send status to confirmed
      if (paymentSendIdToUpdate) {
        console.log('[CreateMarketSidebar] Updating payment send status to confirmed:', paymentSendIdToUpdate);
        try {
          await axios.patch(`${API_URL}/payment-sends/${paymentSendIdToUpdate}/confirmed`, {
            txHash: txHash
          });
          console.log('[CreateMarketSidebar] ✅ Payment send marked as confirmed');
        } catch (error: any) {
          console.error('[CreateMarketSidebar] ❌ Error updating payment send status:', error);
          console.error('[CreateMarketSidebar] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          // Don't fail the whole flow if update fails - payment was still sent
        }
      } else {
        // Last resort: Create payment send if it doesn't exist
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
            const response = await axios.post(`${API_URL}/payment-sends`, payload);
            console.log('[CreateMarketSidebar] ✅ Payment send record created successfully:', response.data);
            setPaymentSendId(response.data.id);
            
            // Update status to confirmed immediately
            try {
              await axios.patch(`${API_URL}/payment-sends/${response.data.id}/confirmed`, {
                txHash: txHash
              });
              console.log('[CreateMarketSidebar] ✅ Payment send marked as confirmed');
            } catch (error: any) {
              console.error('[CreateMarketSidebar] ❌ Error updating payment send status:', error);
            }
          } catch (error: any) {
            console.error('[CreateMarketSidebar] ❌ Error creating payment send record:', error);
            console.error('[CreateMarketSidebar] Error details:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status
            });
            // Don't show error toast - payment was successful, just recording failed
          }
        }
      }
      
      toast.success('Payment sent successfully!');
      setLoading(false); // Reset loading state
      setStep('success');
      
      // Call onSuccess immediately to refresh feed, then reset form after delay
      onSuccess(); // This will refresh the feed
      
      setTimeout(() => {
        setFormData({ amount: '', to: '', caption: '', chainId: (chainId || 8453) as number | string, tokenSymbol: 'USDC' });
        setCharCount(0);
        setSelectedRecipient(null);
        setPaymentSendId(null);
        processedHashRef.current = null; // Reset processed hash when form resets
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

  // Handle transaction errors
  useEffect(() => {
    if (error && mode === 'pay') {
      toast.dismiss();
      toast.error(error.message || 'Failed to send payment');
      setLoading(false);
      setStep('form');
    }
  }, [error, mode]);

  const validateForm = () => {
    // For Request mode, "To" field is required if a recipient is specified
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
    // Allow payment if user has wallet address OR if formData.to is a valid address
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

    // Get recipient wallet address from selected user or form input
    let recipientAddress: string;
    let recipientUserId: string | null = null;
    
    if (selectedRecipient?.walletAddress) {
      // Use preferred wallet from selected recipient
      recipientAddress = selectedRecipient.walletAddress;
      recipientUserId = selectedRecipient.id;
    } else if (isAddress(formData.to)) {
      // Use manually entered wallet address
      recipientAddress = formData.to;
    } else if (selectedRecipient) {
      // User selected but no preferred wallet - need manual address entry
      toast.error('Please enter a wallet address for this recipient');
      return;
    } else {
      // Username entered but not selected - try to look it up
      const cleanUsername = formData.to.replace(/^@+/, '').trim();
      if (cleanUsername.length > 0) {
        try {
          setLoading(true);
          toast.loading('Looking up recipient...');
          
          // Search for user by username
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
          
          // Fetch preferred wallets for this user
          const walletResponse = await axios.get(`${API_URL}/preferred-wallets/user/${foundUser.id}`);
          const preferredWallets = walletResponse.data || [];
          
          // Find wallet for the selected chain
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
          
          // Use the found wallet address
          recipientAddress = chainWallet.receiving_wallet_address;
          recipientUserId = foundUser.id;
          
          // Update selectedRecipient for future reference
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

    // Check if we need to switch chains
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

      // Store form data before transaction (in case component unmounts or state resets)
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

      // Direct transfer to recipient
      writeContract({
        address: selectedToken.address as Address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [recipientAddress as Address, amountInWei],
      }, {
        onSuccess: async (txHash) => {
          console.log('[CreateMarketSidebar] ✅ writeContract onSuccess called with hash:', txHash);
          toast.loading('Transaction pending...');
          
          // FALLBACK: Create payment send immediately when hash is received
          // Don't wait for transaction receipt - create record now, update status later
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
              console.error('[CreateMarketSidebar] Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
              });
              // Don't show error toast here - let the receipt handler try again
            }
          }
        },
        onError: (error: any) => {
          console.error('[CreateMarketSidebar] ❌ writeContract error:', error);
          toast.dismiss();
          
          // Provide user-friendly error messages
          let errorMessage = 'Failed to send payment';
          if (error?.message?.includes('transfer amount exceeds balance') || 
              error?.message?.includes('exceeds balance')) {
            errorMessage = `Insufficient balance. You don't have enough ${selectedToken.symbol} to send this amount.`;
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
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // For EVM chains, use MetaMask address
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

      // Use the base amount (gas fees are calculated when user accepts the request)
      const amountToSubmit = formData.amount;

      await axios.post(`${API_URL}/payment-requests`, {
        requesterAddress: requesterAddress,
        requesterUserId: userId, // Authenticated user ID from Supabase
        recipientUserId: selectedRecipient?.id || null, // User ID of recipient if specified
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
      
      // Reset form immediately
      setFormData({ amount: '', to: '', caption: '', chainId: (chainId || 8453) as number | string, tokenSymbol: 'USDC' });
      setCharCount(0);
      setSelectedRecipient(null);
      
      // Refresh the feed after a short delay to ensure backend has processed the request
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

      {/* Header with chain selector */}
      <div className="flex items-center justify-center gap-2 mb-5 pb-3 border-b border-gray-200 w-full">
        <h3 className="text-lg font-bold text-black tracking-tight">
          {mode === 'pay' ? 'Pay crypto' : 'Request crypto'}
        </h3>
        <div className="relative">
          <select
            value={formData.chainId}
            onChange={(e) => {
              const newChainId = parseInt(e.target.value);
              const allChainTokens = getTokensForChain(newChainId);
              const stablecoins = allChainTokens.filter(token => token.symbol === 'USDC' || token.symbol === 'USDT');
              const defaultToken = stablecoins.find(t => t.symbol === formData.tokenSymbol)?.symbol || stablecoins[0]?.symbol || 'USDC';
              
              // Update form data
              setFormData({ 
                ...formData, 
                chainId: newChainId,
                tokenSymbol: defaultToken
              });
              
              // Also switch chain in header if it's an EVM chain and wallet is connected
              if (isConnected && typeof newChainId === 'number' && switchChain && newChainId !== chainId) {
                try {
                  switchChain({ chainId: newChainId as any });
                } catch (error) {
                  console.error('Error switching chain:', error);
                  // Don't show error toast here as the form chain can still be different from header chain
                }
              }
            }}
            className="appearance-none px-3 py-1.5 pr-8 rounded-full border border-gray-300 bg-transparent text-sm font-semibold focus:outline-none focus:border-black transition-colors cursor-pointer text-gray-700"
            disabled={loading}
          >
            {AVAILABLE_CHAINS.map(chain => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
          <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
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
          {/* Amount Input - Top */}
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
                      {token.symbol}
                    </option>
                  ))}
                </select>
                <svg className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          </div>

          {/* To Field - Show for both modes, but required for Pay mode */}
          <div className="mb-4 w-full relative" style={{ position: 'relative' }}>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <div className="relative" style={{ position: 'relative' }}>
              {/* @ prefix - always visible */}
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 pointer-events-none font-medium">
                @
              </span>
              <input
                type="text"
                value={selectedRecipient ? selectedRecipient.username : formData.to.replace(/^@/, '')}
                onChange={(e) => {
                  let value = e.target.value;
                  // Remove @ if user types it (we show it as prefix)
                  value = value.replace(/^@+/, '');
                  
                  // If user clears the username, clear selection
                  if (selectedRecipient && value !== selectedRecipient.username) {
                    setSelectedRecipient(null);
                  }
                  setFormData({ ...formData, to: value });
                  
                  // Show dropdown immediately when typing (will be populated by useEffect)
                  const cleanValue = value.replace(/^@+/, '').trim();
                  if (cleanValue.length >= 1 && !selectedRecipient) {
                    setShowSearchResults(true);
                    // Also trigger search immediately if we have enough characters
                    if (cleanValue.length >= 1) {
                      searchUsers(cleanValue);
                    }
                  } else if (cleanValue.length === 0) {
                    setShowSearchResults(false);
                    setSearchResults([]);
                  }
                }}
                onFocus={() => {
                  // Show results if we have them when field is focused
                  const cleanTo = formData.to.replace(/^@+/, '').trim();
                  if (cleanTo.length >= 1 && !selectedRecipient) {
                    // Trigger search if we have text
                    searchUsers(cleanTo);
                  }
                  if (searchResults.length > 0 && !selectedRecipient) {
                    setShowSearchResults(true);
                  }
                }}
                onBlur={(e) => {
                  // Delay hiding to allow click on results
                  // Check if the blur is going to the dropdown
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
                    setFormData({ ...formData, to: '' });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Search Results Dropdown - Show when typing in both request and pay modes */}
              {(() => {
                const cleanTo = formData.to.replace(/^@+/, '').trim();
                const hasText = cleanTo.length >= 1;
                const shouldShow = hasText && !selectedRecipient && (mode === 'request' || mode === 'pay') && showSearchResults;
                
                // Debug logging - always log when there's text
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
                      // Get display name: first_name + last_name, or fallback
                      const displayName = (user.first_name && user.last_name)
                        ? `${user.first_name} ${user.last_name}`
                        : user.first_name || user.displayName || user.email?.split('@')[0] || 'User';
                      const isContact = user.isContact || false;
                      const isFirstNonContact = !isContact && index > 0 && searchResults[index - 1]?.isContact;
                      
                      // Check if nickname matches the search (for highlighting)
                      const searchTerm = formData.to.replace(/^@+/, '').trim().toLowerCase();
                      const nicknameMatches = user.nickname && user.nickname.toLowerCase().includes(searchTerm);
                      // Show nickname first if it matches the search, otherwise show displayName
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
                              // Prevent blur from firing before click
                              e.preventDefault();
                            }}
                            onClick={async () => {
                            // For REQUEST mode: We don't need wallet address, just set the recipient
                            // For PAY mode: We need to fetch preferred wallet address for the selected chain
                            if (mode === 'request') {
                              // Just set the recipient - no wallet address needed for requests
                              setSelectedRecipient({
                                id: user.id,
                                username: user.username || '',
                                displayName: displayName,
                                walletAddress: undefined // Not needed for requests
                              });
                              setFormData({ ...formData, to: user.username || '' });
                              setShowSearchResults(false);
                              return;
                            }
                            
                            // For PAY mode: Fetch preferred wallet address for the selected chain
                            if (mode === 'pay') {
                              try {
                                setLoading(true);
                                
                                // Get the chain ID for the current selection
                                const targetChainId = formData.chainId;
                                
                                // Fetch preferred wallets for this user
                                const response = await axios.get(`${API_URL}/preferred-wallets/user/${user.id}`);
                                const preferredWallets = response.data || [];
                                
                                // Find wallet for the selected chain
                                const chainWallet = preferredWallets.find((w: any) => {
                                  const wChainId = String(w.chain_id).toLowerCase();
                                  const targetChainIdStr = String(targetChainId).toLowerCase();
                                  return wChainId === targetChainIdStr;
                                });
                                
                                if (!chainWallet || !chainWallet.receiving_wallet_address) {
                                  const chainName = getChainConfig(targetChainId as number)?.name || 'this chain';
                                  toast.error(`User does not have a preferred wallet for ${chainName}. They need to set it up first.`);
                                  setLoading(false);
                                  return;
                                }
                                
                                setSelectedRecipient({
                                  id: user.id,
                                  username: user.username || '',
                                  displayName: displayName,
                                  walletAddress: chainWallet.receiving_wallet_address
                                });
                                setFormData({ ...formData, to: user.username || '' });
                                setShowSearchResults(false);
                                setLoading(false);
                              } catch (error: any) {
                                console.error('Error fetching preferred wallet:', error);
                                toast.error(error.response?.data?.error || 'Could not find wallet address for this user');
                                setLoading(false);
                                return;
                              }
                            }
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0 flex items-center gap-3"
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
                          
                          {/* Text content - display name on top, username below */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-black text-sm leading-tight">
                                {(() => {
                                  // Check if nickname matches the search (for highlighting)
                                  const searchTerm = formData.to.replace(/^@+/, '').trim().toLowerCase();
                                  const nicknameMatches = user.nickname && user.nickname.toLowerCase().includes(searchTerm);
                                  // Show nickname first if it matches the search, otherwise show displayName
                                  const primaryName = nicknameMatches ? user.nickname : displayName;
                                  const secondaryName = nicknameMatches ? displayName : (user.nickname || null);
                                  return (
                                    <>
                                      {primaryName}
                                      {secondaryName && (
                                        <span className="ml-2 text-gray-400">({secondaryName})</span>
                                      )}
                                    </>
                                  );
                                })()}
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
                          
                          {/* Chevron icon on the right */}
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

          {/* For Field - Caption */}
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
            {/* Character counter - Circular progress ring */}
            {formData.caption && (
              <div className="absolute bottom-2 right-4 flex items-center gap-2">
                <span
                  className="inline-block w-5 h-5 rounded-full relative flex-shrink-0"
                  style={{
                    background: `conic-gradient(${
                      charCount > 290 ? 'rgb(239, 68, 68)' : 
                      charCount > 270 ? 'rgb(249, 115, 22)' : 
                      'rgb(16, 185, 129)'
                    } ${Math.round((charCount / 300) * 360)}deg, rgb(229, 231, 235) 0deg)`
                  }}
                  aria-hidden
                >
                  <span className="absolute inset-[3px] rounded-full bg-white"></span>
                </span>
                <span className={`text-xs font-medium ${
                  charCount > 290 ? 'text-red-500' : 
                  charCount > 270 ? 'text-orange-500' : 
                  'text-gray-500'
                }`}>
                  {300 - charCount}
                </span>
              </div>
            )}
          </div>


          {/* Bottom Section - Info, Button */}
          <div className="pt-3 space-y-3">
            {/* Info - Subtle */}
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
                <span className="whitespace-nowrap">Funds are held in escrow until the recipient accepts</span>
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
                {step === 'success'
                  ? mode === 'pay'
                    ? 'Payment Sent!'
                    : 'Request Posted!'
                  : step === 'creating' || isPending || isConfirming
                    ? mode === 'pay' 
                      ? 'Sending...' 
                      : 'Posting...'
                    : mode === 'pay'
                      ? 'Pay crypto'
                      : 'Request crypto'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}


