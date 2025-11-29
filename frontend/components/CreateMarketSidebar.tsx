'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import toast from 'react-hot-toast';
import { AVAILABLE_CHAINS, getTokensForChain, getToken, getChainConfig, type TokenConfig } from '@/lib/tokenConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface CreateMarketSidebarProps {
  onSuccess: () => void;
}

export default function CreateMarketSidebar({ onSuccess }: CreateMarketSidebarProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId(); // Get current chain from header
  const { switchChain } = useSwitchChain(); // To switch chain in header
  
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    if (parseFloat(formData.amount) < 0.01) {
      toast.error('Minimum amount is 0.01 USDC');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

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
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({ amount: '', to: '', caption: '', chainId: (chainId || 8453) as number | string, tokenSymbol: 'USDC' });
        setCharCount(0);
        setStep('form');
        onSuccess();
      }, 2000);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error creating payment request:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to create crypto request');
      setStep('form');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      {/* Header with chain selector */}
      <div className="flex items-center justify-center gap-2 mb-5 pb-3 border-b border-gray-200 w-full">
        <h3 className="text-lg font-bold text-black tracking-tight">Request crypto</h3>
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

          {/* To Field */}
          <div className="mb-4 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <input
              type="text"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="w-full px-4 py-2 rounded-full border border-gray-300 bg-white placeholder-gray-400 text-base focus:outline-none focus:border-black transition-colors text-black"
              placeholder="search by name, @username, email"
              disabled={loading}
            />
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
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="whitespace-nowrap">Anyone can click Accept to pay directly to your wallet</span>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={loading || !formData.amount || parseFloat(formData.amount) < 0.01 || !isConnected}
                className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {step === 'creating' && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {step === 'creating' ? 'Posting...' : 'Request crypto'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

