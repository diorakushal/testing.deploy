'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

const ABI = [
  "function stakeAgree(uint256 _marketId, uint256 _amount) external",
  "function stakeDisagree(uint256 _marketId, uint256 _amount) external",
];

interface BetModalProps {
  market: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BetModal({ market, onClose, onSuccess }: BetModalProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);

  useEffect(() => {
    checkWallet();
  }, []);

  const checkWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        setAccount(accounts[0].address);
      }
    }
  };

  const handleQuickSelect = (amount: string) => {
    setStakeAmount(amount);
  };

  const handleStake = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!selectedSide) {
      toast.error('Please select a side');
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) < 1) {
      toast.error('Please enter an amount between $1 and $1,000');
      return;
    }

    if (!window.ethereum) {
      toast.error('Please install MetaMask');
      return;
    }

    try {
      setIsStaking(true);
      toast.loading('Preparing transaction...');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const marketIdInt = parseInt(market.id, 16);
      const amount = ethers.parseUnits(stakeAmount, 6);

      const tx = selectedSide === 1 
        ? await contract.stakeAgree(marketIdInt, amount)
        : await contract.stakeDisagree(marketIdInt, amount);
      
      toast.loading('Transaction pending...');
      await tx.wait();
      
      toast.dismiss();
      toast.success('Bet placed successfully!');

      await axios.post(`${API_URL}/stakes`, {
        marketId: market.id,
        userWallet: account,
        amount: stakeAmount,
        side: selectedSide,
        txHash: tx.hash
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Failed to                                           place bet');
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Place Bet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {/* Market Info */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">{market.title}</h3>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded text-xs font-medium">
                {market.category}
              </span>
              <span className="text-xs text-gray-500">
                ${(parseFloat(market.total_agree_stakes) + parseFloat(market.total_disagree_stakes)).toLocaleString()}
              </span>
            </div>
          </div>

          {!selectedSide ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedSide(1)}
                className="px-4 py-6 bg-cyan-50 border border-cyan-200 hover:border-cyan-400 hover:bg-cyan-100 rounded-lg transition-all"
              >
                <div className="flex flex-col items-center">
                  <div className="text-2xl mb-1 text-cyan-600">✓</div>
                  <div className="text-sm font-semibold text-cyan-700">Agree</div>
                </div>
              </button>
              <button
                onClick={() => setSelectedSide(2)}
                className="px-4 py-6 bg-gray-50 border border-gray-200 hover:border-gray-400 hover:bg-gray-100 rounded-lg transition-all"
              >
                <div className="flex flex-col items-center">
                  <div className="text-2xl mb-1 text-gray-600">✗</div>
                  <div className="text-sm font-semibold text-gray-700">Disagree</div>
                </div>
              </button>
            </div>
          ) : (
            <>
              {/* Selected Side */}
              <div className="flex items-center justify-between mb-3 p-2 rounded bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${selectedSide === 1 ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-white'}`}>
                    {selectedSide === 1 ? '✓ Agree' : '✗ Disagree'}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedSide(null)} 
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  Change
                </button>
              </div>

              {/* Amount Input */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Amount</label>
                
                <div className="relative mb-2">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">$</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm font-semibold"
                    placeholder="0"
                  />
                </div>
                
                <div className="flex gap-1.5">
                  {['10', '25', '50', '100', '250'].map(amt => (
                    <button
                      key={amt}
                      onClick={() => handleQuickSelect(amt)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                        stakeAmount === amt
                          ? 'bg-cyan-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedSide(null);
                    setStakeAmount('');
                  }}
                  disabled={isStaking}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStake}
                  disabled={isStaking || !stakeAmount}
                  className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStaking ? 'Processing...' : 'Place Bet'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
