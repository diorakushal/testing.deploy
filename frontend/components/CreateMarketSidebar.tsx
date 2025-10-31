'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

const ABI = [
  "function createMarket(string memory _title, address _stakingToken) returns (uint256)",
  "function marketCounter() view returns (uint256)",
];

interface CreateMarketSidebarProps {
  onSuccess: () => void;
}

export default function CreateMarketSidebar({ onSuccess }: CreateMarketSidebarProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'music',
    tokenType: 'USDC'
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'creating' | 'success'>('form');
  const [createdMarketId, setCreatedMarketId] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 300) {
      setFormData({ ...formData, title: value });
      setCharCount(value.length);
      adjustTextareaHeight();
    } else {
      // If pasted text is too long, truncate it
      const truncated = value.slice(0, 300);
      setFormData({ ...formData, title: truncated });
      setCharCount(300);
      adjustTextareaHeight();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Let the paste happen first, then handle it in onChange
    setTimeout(() => {
      adjustTextareaHeight();
    }, 0);
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [formData.title]);

  const validateForm = () => {
    if (!formData.title.trim() || formData.title.length < 5) {
      toast.error('Opinion statement must be 5-300 characters');
      return false;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check wallet connection
    if (typeof window.ethereum === 'undefined') {
      toast.error('Please install MetaMask');
      return;
    }

    try {
      setLoading(true);
      setStep('creating');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Determine token address
      const tokenAddress = formData.tokenType === 'USDC' 
        ? '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
        : '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

      // Step 1: Create market on blockchain
      toast.loading('Creating market on blockchain...');
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.createMarket(formData.title, tokenAddress);
      const receipt = await tx.wait();

      // Get market ID from counter
      const marketCounter = await contract.marketCounter();
      const marketId = (Number(marketCounter) - 1).toString();

      setCreatedMarketId(marketId);

      // Step 2: Save to database
      const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await axios.post(`${API_URL}/markets`, {
        creatorAddress: address,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        agreeLabel: 'Agree',
        disagreeLabel: 'Disagree',
        endsAt: endsAt.toISOString(),
        smartContractAddress: CONTRACT_ADDRESS,
        tokenType: formData.tokenType
      });

      // Step 3: Create/update user
      await axios.post(`${API_URL}/users`, {
        walletAddress: address,
        username: `user_${address.slice(0, 6)}`
      });

      toast.dismiss();
      setStep('success');
      toast.success('Market created successfully!');
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({ title: '', description: '', category: 'music', tokenType: 'USDC' });
        setCharCount(0);
        setStep('form');
        setCreatedMarketId(null);
        onSuccess();
      }, 2000);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error creating market:', error);
      toast.error(error.message || 'Failed to create market');
      setStep('form');
      setLoading(false);
    }
  };

  const categories = [
    { value: 'music', label: 'Music' },
    { value: 'sports', label: 'Sports' },
    { value: 'politics', label: 'Politics' },
    { value: 'pop-culture', label: 'Pop Culture' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold text-black tracking-tight mb-5 pb-3 border-b border-gray-200">Create Opinion Market</h3>
      
      {step === 'success' ? (
        <div className="text-center py-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="text-base font-bold mb-0.5">Market Created!</h4>
          <p className="text-xs text-gray-600">Refreshing...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-0">
          {/* Main Text Area - Twitter Style */}
          <div className="relative pb-8">
            <textarea
              ref={textareaRef}
              value={formData.title}
              onChange={handleTitleChange}
              onPaste={handlePaste}
              className="w-full px-0 py-3 border-0 border-b border-gray-200 bg-transparent placeholder-gray-400 text-base focus:outline-none focus:border-gray-400 transition-colors resize-none overflow-hidden"
              placeholder="What's your take?"
              required
              disabled={loading}
              rows={4}
              style={{ minHeight: '100px' }}
            />
            {/* Character counter - Circular progress ring */}
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
          </div>

          {/* Bottom Section - Category, Token, Info, Button */}
          <div className="pt-3 space-y-3">
            {/* Category & Token - Inline */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full appearance-none px-3 py-2 pr-8 rounded-full border border-gray-300 bg-transparent text-sm focus:outline-none focus:border-black transition-colors cursor-pointer"
                  required
                  disabled={loading}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
              <div className="text-sm text-gray-500 px-2">
                USDC
              </div>
            </div>

            {/* Info - Subtle */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>24-hour blind voting • Winners split pool</span>
            </div>

            {/* Submit Button - Twitter Style */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading || charCount < 5}
                className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {step === 'creating' && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {step === 'creating' ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

