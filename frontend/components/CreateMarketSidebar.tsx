'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { AVAILABLE_CHAINS, getTokensForChain, getToken, getChainConfig, type TokenConfig } from '@/lib/tokenConfig';
import GasFeeDisplay from './GasFeeDisplay';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface CreateMarketSidebarProps {
  onSuccess: () => void;
}

export default function CreateMarketSidebar({ onSuccess }: CreateMarketSidebarProps) {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState({
    amount: '',
    caption: '',
    chainId: 8453 as number | string, // Default to Base
    tokenSymbol: 'USDC', // Default token
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'creating' | 'success'>('form');
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get available tokens for selected chain
  const availableTokens = getTokensForChain(formData.chainId);
  const selectedToken = getToken(formData.tokenSymbol, formData.chainId);
  const selectedChain = getChainConfig(formData.chainId);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 300) {
      setFormData({ ...formData, caption: value });
      setCharCount(value.length);
      adjustTextareaHeight();
    } else {
      const truncated = value.slice(0, 300);
      setFormData({ ...formData, caption: truncated });
      setCharCount(300);
      adjustTextareaHeight();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    setTimeout(() => {
      adjustTextareaHeight();
    }, 0);
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [formData.caption]);

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
    
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!validateForm()) return;

    try {
      setLoading(true);
      setStep('creating');
      toast.loading('Creating crypto request...');

      if (!selectedToken || !selectedChain) {
        toast.error('Invalid token or chain selection');
        return;
      }

      await axios.post(`${API_URL}/payment-requests`, {
        requesterAddress: address,
        amount: formData.amount,
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
        setFormData({ amount: '', caption: '', chainId: 8453 as number | string, tokenSymbol: 'USDC' });
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
      <h3 className="text-lg font-bold text-black tracking-tight mb-5 pb-3 border-b border-gray-200 text-center w-full">Request crypto</h3>
      
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
            {/* Chain Selector */}
            <div className="mt-2 w-full">
              <div className="relative">
                <select
                  value={formData.chainId}
                  onChange={(e) => {
                    const newChainId = e.target.value === 'solana' ? 'solana' : parseInt(e.target.value);
                    const newChainTokens = getTokensForChain(newChainId);
                    const defaultToken = newChainTokens[0]?.symbol || 'USDC';
                    setFormData({ 
                      ...formData, 
                      chainId: newChainId,
                      tokenSymbol: newChainTokens.find(t => t.symbol === formData.tokenSymbol)?.symbol || defaultToken
                    });
                  }}
                  className="w-full appearance-none px-3 py-2 pr-8 rounded-full border border-gray-300 bg-transparent text-sm focus:outline-none focus:border-black transition-colors cursor-pointer text-gray-700"
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
              {/* Gas Fee Display */}
              <GasFeeDisplay chainId={formData.chainId} tokenSymbol={formData.tokenSymbol} amount={formData.amount} />
            </div>
          </div>

          {/* Main Text Area - Caption */}
          <div className="relative pb-8 w-full">
            <textarea
              ref={textareaRef}
              value={formData.caption}
              onChange={handleCaptionChange}
              onPaste={handlePaste}
              className="w-full px-0 py-3 border-0 border-b border-gray-200 bg-transparent placeholder-gray-400 text-base focus:outline-none focus:border-gray-400 transition-colors resize-none overflow-hidden"
              placeholder="What's this for? (optional)"
              disabled={loading}
              rows={4}
              style={{ minHeight: '100px' }}
            />
            {/* Character counter - Circular progress ring */}
            {formData.caption && (
              <div className="absolute bottom-3 right-0 flex items-center gap-2">
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
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 text-center">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Anyone can click Accept to pay directly to your wallet</span>
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

