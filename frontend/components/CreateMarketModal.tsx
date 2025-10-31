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

interface CreateMarketModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateMarketModal({ onClose, onSuccess }: CreateMarketModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'music',
    tokenType: 'USDC'
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'approving' | 'creating' | 'success'>('form');
  const [createdMarketId, setCreatedMarketId] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 150) {
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
      toast.error('Opinion statement must be 5-150 characters');
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
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Determine token address
      const tokenAddress = formData.tokenType === 'USDC' 
        ? '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
        : '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

      // Step 1: Create market on blockchain
      setStep('creating');
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
    } catch (error: any) {
      toast.dismiss();
      console.error('Error creating market:', error);
      toast.error(error.message || 'Failed to create market');
      setStep('form');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      onSuccess();
    }
    onClose();
  };

  const categories = [
    { value: 'music', label: 'Music' },
    { value: 'sports', label: 'Sports' },
    { value: 'politics', label: 'Politics' },
    { value: 'pop-culture', label: 'Pop Culture' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold">Create Opinion Market</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {step === 'success' ? (
            // Success State
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Market Created!</h3>
              <p className="text-gray-600 mb-1">Your opinion is now live:</p>
              <p className="text-lg font-semibold text-cyan-600 mb-6">{formData.title}</p>
              
              {createdMarketId && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="text-sm text-gray-500 mb-2">Market Link:</div>
                  <div className="text-sm font-mono text-gray-900 break-all">
                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/market/${createdMarketId}`}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Done
                </button>
                {createdMarketId && (
                  <button
                    onClick={() => {
                      window.location.href = `/market/${createdMarketId}`;
                      onClose();
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold shadow-lg"
                  >
                    View Market
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Form State
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Opinion Statement */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opinion Statement <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-lg"
                  placeholder="e.g., Drake > Kendrick Lamar"
                  required
                  disabled={loading}
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">Between 5-150 characters</span>
                  <span className={`text-xs font-medium ${charCount > 145 ? 'text-red-500' : 'text-gray-500'}`}>
                    {charCount}/150
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Add context to your take..."
                  disabled={loading}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/500 characters
                </div>
              </div>

              {/* Category & Token */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                    disabled={loading}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Staking Token <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tokenType}
                    onChange={(e) => setFormData({ ...formData, tokenType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                    disabled={loading}
                  >
                    <option value="USDC">USDC (Polygon)</option>
                    <option value="USDT">USDT (Polygon)</option>
                  </select>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyan-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-cyan-800">
                    <div className="font-semibold mb-1">Market Details</div>
                    <div className="text-cyan-700">Markets run for 24 hours. Winners split the losing side's pool.</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || charCount < 5}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {step === 'creating' && (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {step === 'creating' ? 'Posting Take...' : 'Post Your Take'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
