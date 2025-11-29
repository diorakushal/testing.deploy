'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, Address, isAddress, formatUnits, decodeEventLog } from 'viem';
import toast from 'react-hot-toast';
import { AVAILABLE_CHAINS, getTokensForChain, getToken, getChainConfig, type TokenConfig } from '@/lib/tokenConfig';
import { ESCROW_ADDRESSES } from '@/lib/escrowConfig';
import { supabase } from '@/lib/supabase';

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

// Escrow Contract ABI
const ESCROW_ABI = [
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'expiry', type: 'uint64' }
    ],
    name: 'createPayment',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'paymentId', type: 'uint256' },
      { indexed: true, name: 'sender', type: 'address' },
      { indexed: true, name: 'recipient', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'expiry', type: 'uint64' }
    ],
    name: 'PaymentCreated',
    type: 'event'
  }
] as const;

interface CreateMarketSidebarProps {
  onSuccess: () => void;
}

export default function CreateMarketSidebar({ onSuccess }: CreateMarketSidebarProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId(); // Get current chain from header
  const { switchChain } = useSwitchChain(); // To switch chain in header
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash,
    enabled: !!hash 
  });
  
  // Mode: 'pay' or 'request'
  const [mode, setMode] = useState<'pay' | 'request'>('request');
  
  // Initialize with current chain from header, fallback to Base if not connected
  const [formData, setFormData] = useState({
    amount: '',
    to: '', // Recipient field
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
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; username: string; displayName: string } | null>(null);
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
        params: { q: cleanQuery },
        timeout: 5000
      });
      
      console.log('Search API response:', response.data);
      
      // Filter out current user from results
      const filtered = response.data.filter((user: any) => user.id !== userId);
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

    // Only search if there's text, no recipient selected, and in request mode
    // Remove @ prefix if user typed it
    const cleanTo = formData.to.replace(/^@+/, '').trim();
    
    if (mode === 'request' && cleanTo && cleanTo.length >= 1 && !selectedRecipient) {
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

  // Handle transaction success - need to parse PaymentCreated event
  useEffect(() => {
    if (isSuccess && hash && mode === 'pay') {
      handleEscrowPaymentSuccess(hash);
    }
  }, [isSuccess, hash, mode]);

  const handleEscrowPaymentSuccess = async (txHash: string) => {
    try {
      toast.dismiss();
      toast.loading('Processing payment...');

      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
      
      // Find PaymentCreated event in logs
      const escrowAddress = ESCROW_ADDRESSES[formData.chainId.toString()];
      if (!escrowAddress) {
        throw new Error('Escrow address not found');
      }

      // Parse event from logs
      let paymentId: bigint | null = null;
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === escrowAddress.toLowerCase()) {
          // Try to decode PaymentCreated event
          // Event signature: PaymentCreated(uint256 indexed paymentId, address indexed sender, address indexed recipient, address token, uint256 amount, uint64 expiry)
          try {
            const decoded = decodeEventLog({
              abi: ESCROW_ABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'PaymentCreated') {
              paymentId = decoded.args.paymentId as bigint;
              break;
            }
          } catch (e) {
            // Not the event we're looking for
            continue;
          }
        }
      }

      if (!paymentId) {
        throw new Error('Could not find PaymentCreated event');
      }

      // Save to backend
      const token = getToken(formData.tokenSymbol, formData.chainId);
      const decimals = token?.decimals || 6;
      const amountInWei = parseUnits(formData.amount.toString(), decimals);

      await axios.post(`${API_URL}/escrow-payments`, {
        onchainId: paymentId.toString(),
        senderAddress: address,
        recipientAddress: formData.to,
        chainId: typeof formData.chainId === 'number' ? formData.chainId : parseInt(formData.chainId as string),
        tokenAddress: token?.address,
        tokenSymbol: formData.tokenSymbol,
        amount: amountInWei.toString(),
        expiry: null, // No expiry for now
        txHashCreate: txHash
      });

      toast.dismiss();
      toast.success('Escrow payment created! Recipient can now accept it.');
      setStep('success');
      
      setTimeout(() => {
        setFormData({ amount: '', to: '', caption: '', chainId: (chainId || 8453) as number | string, tokenSymbol: 'USDC' });
        setCharCount(0);
        setStep('form');
        onSuccess();
      }, 2000);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error processing escrow payment:', error);
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
    if (mode === 'pay' && !formData.to) {
      toast.error('Please enter a recipient address');
      return false;
    }
    if (mode === 'pay' && !isAddress(formData.to)) {
      toast.error('Please enter a valid recipient address');
      return false;
    }
    return true;
  };

  const handlePaySubmit = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    // Check if Solana is selected (not supported for escrow payments yet)
    const isSolana = formData.chainId === 'solana' || String(formData.chainId).toLowerCase() === 'solana';
    if (isSolana) {
      toast.error('Escrow payments on Solana are not yet supported. Please use Request mode.');
      return;
    }

    if (!selectedToken || !selectedChain) {
      toast.error('Invalid token or chain selection');
      return;
    }

    // Check if escrow contract is deployed on this chain
    const chainIdNum = typeof formData.chainId === 'number' ? formData.chainId : parseInt(formData.chainId as string);
    const escrowAddress = ESCROW_ADDRESSES[chainIdNum.toString()];
    
    if (!escrowAddress) {
      toast.error(`Escrow contract not deployed on ${selectedChain.name}. Please deploy first.`);
      return;
    }

    // Check if we need to switch chains
    if (chainIdNum !== chainId && switchChain) {
      try {
        toast.loading('Switching chain...');
        await switchChain({ chainId: chainIdNum as any });
        // Wait a bit for chain switch
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

      if (!isAddress(formData.to)) {
        toast.error('Invalid recipient address');
        setLoading(false);
        setStep('form');
        return;
      }

      if (!isAddress(selectedToken.address)) {
        toast.error('Invalid token address');
        setLoading(false);
        setStep('form');
        return;
      }

      if (!isAddress(escrowAddress)) {
        toast.error('Invalid escrow contract address');
        setLoading(false);
        setStep('form');
        return;
      }

      // Step 1: Approve token (always approve for simplicity, or check allowance first)
      toast.loading('Approving token...');
      
      // Approve escrow contract to spend tokens
      // Using a large approval amount for better UX (user can revoke later if needed)
      const maxApproval = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      
      writeContract({
        address: selectedToken.address as Address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [escrowAddress as Address, maxApproval],
      }, {
        onSuccess: (approvalHash) => {
          // Wait for approval transaction to be confirmed
          toast.loading('Waiting for approval confirmation...');
          // Use a separate wait hook or poll for confirmation
          setTimeout(async () => {
          // Wait for approval confirmation using publicClient
          if (publicClient) {
            try {
              await publicClient.waitForTransactionReceipt({ hash: approvalHash });
              toast.dismiss();
              toast.loading('Token approved. Creating escrow payment...');
              createEscrowPayment(escrowAddress, selectedToken.address, amountInWei);
            } catch (error) {
              toast.dismiss();
              toast.error('Failed to confirm approval');
              setLoading(false);
              setStep('form');
            }
          } else {
            // Fallback: wait a bit then proceed
            setTimeout(() => {
              toast.dismiss();
              toast.loading('Token approved. Creating escrow payment...');
              createEscrowPayment(escrowAddress, selectedToken.address, amountInWei);
            }, 3000);
          }
          }, 3000);
        },
        onError: (error) => {
          toast.dismiss();
          toast.error(error.message || 'Failed to approve token');
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

  const createEscrowPayment = async (escrowAddress: string, tokenAddress: string, amountInWei: bigint) => {
    try {
      // No expiry for now (0 = no expiry)
      const expiry = 0;

      toast.loading('Creating escrow payment...');

      // Create payment on escrow contract
      writeContract({
        address: escrowAddress as Address,
        abi: ESCROW_ABI,
        functionName: 'createPayment',
        args: [
          formData.to as Address,
          tokenAddress as Address,
          amountInWei,
          BigInt(expiry)
        ],
      }, {
        onError: (error) => {
          toast.dismiss();
          toast.error(error.message || 'Failed to create escrow payment');
          setLoading(false);
          setStep('form');
        }
      });
    } catch (error: any) {
      toast.dismiss();
      console.error('Error creating escrow payment:', error);
      toast.error(error.message || 'Failed to create escrow payment');
      setLoading(false);
      setStep('form');
    }
  };

  const handleRequestSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Check if Solana chain is selected
    const isSolana = formData.chainId === 'solana' || String(formData.chainId).toLowerCase() === 'solana';
    
    let requesterAddress: string;
    
    if (isSolana) {
      // For Solana, need to connect to Phantom wallet
      if (typeof window.solana === 'undefined') {
        toast.error('Please install Phantom wallet for Solana payments');
        return;
      }
      
      try {
        setLoading(true);
        toast.loading('Connecting to Phantom wallet...');
        
        // Connect to Phantom wallet
        const response = await window.solana.connect();
        requesterAddress = response.publicKey.toString();
        
        toast.dismiss();
      } catch (error: any) {
        toast.dismiss();
        if (error.code === 4001) {
          toast.error('Phantom connection rejected');
        } else {
          toast.error('Failed to connect Phantom wallet');
        }
        setLoading(false);
        return;
      }
    } else {
      // For EVM chains, use MetaMask address
      if (!isConnected || !address) {
        toast.error('Please connect your wallet');
        return;
      }
      requesterAddress = address;
    }

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
            onClick={() => setMode('pay')}
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
            onClick={() => setMode('request')}
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
              const newChainId = e.target.value === 'solana' ? 'solana' : parseInt(e.target.value);
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
          <h4 className="text-base font-bold mb-0.5">Request Posted!</h4>
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
                  if (cleanValue.length >= 1 && !selectedRecipient && mode === 'request') {
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
                className="w-full pl-8 pr-4 py-2 rounded-full border border-gray-300 bg-white placeholder-gray-400 text-base focus:outline-none focus:border-black transition-colors text-black"
                placeholder="username"
                disabled={loading}
                required={mode === 'request'}
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
              
              {/* Search Results Dropdown - Show when typing in request mode */}
              {(() => {
                const cleanTo = formData.to.replace(/^@+/, '').trim();
                const hasText = cleanTo.length >= 1;
                const shouldShow = hasText && !selectedRecipient && mode === 'request';
                
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
                  className="search-results-dropdown absolute z-[9999] w-full mt-1 bg-white border-2 border-blue-500 rounded-lg shadow-2xl max-h-60 overflow-auto" 
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
                    searchResults.map((user: any) => {
                      // Get initials from first_name and last_name, or fallback to username
                      const getInitials = () => {
                        if (user.first_name && user.last_name) {
                          return (user.first_name[0] + user.last_name[0]).toUpperCase();
                        }
                        if (user.first_name) {
                          return user.first_name.substring(0, 2).toUpperCase();
                        }
                        if (user.username) {
                          return user.username.substring(0, 2).toUpperCase();
                        }
                        return 'U';
                      };
                      
                      // Get display name: first_name + last_name, or fallback
                      const displayName = (user.first_name && user.last_name)
                        ? `${user.first_name} ${user.last_name}`
                        : user.first_name || user.displayName || user.email?.split('@')[0] || 'User';
                      
                      const initials = getInitials();
                      
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onMouseDown={(e) => {
                            // Prevent blur from firing before click
                            e.preventDefault();
                          }}
                          onClick={() => {
                            setSelectedRecipient({
                              id: user.id,
                              username: user.username || '',
                              displayName: displayName
                            });
                            setFormData({ ...formData, to: user.username || '' });
                            setShowSearchResults(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                        >
                          {/* Avatar with gradient background - matching image style */}
                          <div 
                            className="inline-block w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff1744 100%)'
                            }}
                          >
                            {initials}
                          </div>
                          
                          {/* Text content - display name on top, username below */}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 text-base leading-tight">
                              {displayName}
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
                {step === 'creating' || isPending || isConfirming
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

