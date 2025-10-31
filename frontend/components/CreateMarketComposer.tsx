'use client';

import { useState } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

const ABI = [
  "function createMarket(string memory _title, address _stakingToken) returns (uint256)",
  "function marketCounter() view returns (uint256)",
];

interface CreateMarketComposerProps {
  onSuccess: (marketId: string) => void;
}

export default function CreateMarketComposer({ onSuccess }: CreateMarketComposerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'music',
    tokenType: 'USDC'
  });
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 300) {
      setFormData({ ...formData, title: value });
      setCharCount(value.length);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setFormData({ ...formData, description: value });
    }
  };

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

    if (typeof window.ethereum === 'undefined') {
      toast.error('Please install MetaMask');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const tokenAddress = formData.tokenType === 'USDC' 
        ? '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
        : '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

      toast.loading('Creating market on blockchain...');
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.createMarket(formData.title, tokenAddress);
      await tx.wait();

      const marketCounter = await contract.marketCounter();
      const marketId = (Number(marketCounter) - 1).toString();

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

      await axios.post(`${API_URL}/users`, {
        walletAddress: address,
        username: `user_${address.slice(0, 6)}`
      });

      toast.dismiss();
      toast.success('Market created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'music',
        tokenType: 'USDC'
      });
      setCharCount(0);
      setIsExpanded(false);
      onSuccess(marketId);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error creating market:', error);
      toast.error(error.message || 'Failed to create market');
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
    <div className="px-4 pt-4">
      <div className="flex items-start gap-3">
        {/* Main Content */}
        <div className="flex-1">
          {!isExpanded ? (
            <>
              <input
                type="text"
                placeholder="What's your take?"
                onClick={() => setIsExpanded(true)}
                readOnly
                className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-xl mb-3 pt-2"
              />

              {/* Post Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full font-semibold text-sm transition-colors"
                >
                  Post
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Opinion Statement */}
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full px-0 py-2 bg-transparent border-0 rounded text-xl text-white placeholder-gray-500 focus:outline-none"
                placeholder="What's your take?"
                required
                disabled={loading}
                autoFocus
              />
              <div className="flex items-center justify-end">
                <span className={`text-xs font-medium ${charCount > 285 ? 'text-red-500' : 'text-gray-500'}`}>
                  {charCount}/300
                </span>
              </div>

              {/* Category and Token - Compact */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    disabled={loading}
                    className="px-3 py-1.5 bg-transparent border border-gray-800 rounded-full text-xs font-semibold text-gray-300 hover:text-white hover:border-gray-700 focus:outline-none transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {categories.find(cat => cat.value === formData.category)?.label || 'Music'}
                    <svg className={`w-3 h-3 text-gray-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Custom Dropdown */}
                  {isCategoryOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsCategoryOpen(false)}
                      />
                      <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 min-w-[140px] overflow-hidden">
                        {categories.map(cat => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, category: cat.value });
                              setIsCategoryOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors flex items-center gap-2 ${
                              formData.category === cat.value
                                ? 'bg-[#2952FF]/20 text-[#2952FF]'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            {formData.category === cat.value && (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            <span className={formData.category === cat.value ? '' : 'ml-6'}>{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <span className="px-3 py-1.5 bg-gray-800/50 border border-gray-800 rounded-full text-xs font-semibold text-gray-400">
                  USDC
                </span>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      setFormData({
                        title: '',
                        description: '',
                        category: 'music',
                        tokenType: 'USDC'
                      });
                      setCharCount(0);
                    }}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading || charCount < 5}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
                >
                  {loading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

