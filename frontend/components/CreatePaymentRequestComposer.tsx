'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Base mainnet USDC
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const BASE_CHAIN_ID = 8453;
const BASE_CHAIN_NAME = 'Base';

interface CreatePaymentRequestComposerProps {
  onSuccess: () => void;
}

export default function CreatePaymentRequestComposer({ onSuccess }: CreatePaymentRequestComposerProps) {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState({
    amount: '',
    caption: '',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'creating' | 'success'>('form');
  const [charCount, setCharCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 280) {
      setFormData({ ...formData, caption: value });
      setCharCount(value.length);
      adjustTextareaHeight();
    } else {
      const truncated = value.slice(0, 280);
      setFormData({ ...formData, caption: truncated });
      setCharCount(280);
      adjustTextareaHeight();
    }
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

      const response = await axios.post(`${API_URL}/payment-requests`, {
        requesterAddress: address,
        requesterUserId: userId, // Authenticated user ID from Supabase
        amount: formData.amount,
        tokenSymbol: 'USDC',
        tokenAddress: BASE_USDC_ADDRESS,
        chainId: BASE_CHAIN_ID,
        chainName: BASE_CHAIN_NAME,
        caption: formData.caption || null
      });

      toast.dismiss();
      setStep('success');
      toast.success('Crypto request created!');
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({ amount: '', caption: '' });
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
    <div className="p-4">
      <h3 className="text-lg font-bold text-black tracking-tight mb-5 pb-3 border-b border-gray-200">Request Payment</h3>
      
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
        <form onSubmit={handleSubmit} className="space-y-0">
          {/* Amount Input */}
          <div className="relative pb-4">
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
                className="flex-1 px-0 py-2 border-0 bg-transparent placeholder-gray-400 text-2xl font-semibold focus:outline-none focus:border-gray-400 transition-colors text-black"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
                disabled={loading}
              />
              <span className="text-xl font-semibold text-gray-600">USDC</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">on {BASE_CHAIN_NAME}</div>
          </div>

          {/* Caption Text Area */}
          <div className="relative pb-8 pt-4">
            <textarea
              ref={textareaRef}
              value={formData.caption}
              onChange={handleCaptionChange}
              className="w-full px-0 py-3 border-0 border-b border-gray-200 bg-transparent placeholder-gray-400 text-base focus:outline-none focus:border-gray-400 transition-colors resize-none overflow-hidden"
              placeholder="What's this for? (optional)"
              disabled={loading}
              rows={3}
              style={{ minHeight: '80px' }}
            />
            {/* Character counter */}
            {formData.caption && (
              <div className="absolute bottom-3 right-0 flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {280 - charCount}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className="pt-3 space-y-3">
            {/* Info */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Anyone can click Accept to pay directly to your wallet</span>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
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
                {step === 'creating' ? 'Posting...' : 'Post Request'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

