'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface MarketDetailPopupProps {
  market: any;
  onClose: () => void;
}

export default function MarketDetailPopup({ market, onClose }: MarketDetailPopupProps) {
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedSide, setSelectedSide] = useState<'agree' | 'disagree' | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  const totalVolume = parseFloat(market.total_agree_stakes) + parseFloat(market.total_disagree_stakes);

  const handlePlaceBet = async () => {
    if (!selectedSide) {
      toast.error('Please select a side');
      return;
    }
    if (!stakeAmount || parseFloat(stakeAmount) < 1) {
      toast.error('Please enter a valid stake amount');
      return;
    }
    
    setIsPlacingBet(true);
    toast.loading('Placing bet...');
    
    setTimeout(() => {
      toast.dismiss();
      toast.success('Stake confirmed!');
      setStakeAmount('');
      setSelectedSide(null);
      setIsPlacingBet(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#2952FF] to-[#00D07E] bg-clip-text text-transparent tracking-tight">Blockbook</h1>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">{market.title}</h2>

            {/* Stats */}
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-cyan-50 text-cyan-600 rounded-full text-xs font-medium capitalize">
                {market.category}
              </span>
              <span className="text-sm text-gray-500">
                ${(totalVolume / 1000000).toFixed(1)}m Vol.
              </span>
            </div>

            {/* Side Selection */}
            {!selectedSide ? (
              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-700">
                  Choose your side
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedSide('agree')}
                    className="h-20 bg-cyan-50 border-2 border-cyan-200 hover:border-cyan-400 rounded-xl text-base font-bold text-cyan-700 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="text-2xl">✓</span>
                    <span>Agree</span>
                  </button>
                  <button
                    onClick={() => setSelectedSide('disagree')}
                    className="h-20 bg-white border-2 border-gray-200 hover:border-gray-400 rounded-xl text-base font-bold text-gray-700 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="text-2xl">✗</span>
                    <span>Disagree</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSide(null)}
                    className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    ← Change side
                  </button>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Stake amount (USDC)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount (1 - 1000)"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    min="1"
                    max="1000"
                  />
                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>Available: $1,000.00</span>
                    <div className="flex gap-2">
                      {[10, 50, 100, 500].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setStakeAmount(amount.toString())}
                          className="text-cyan-600 hover:text-cyan-700 font-medium"
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceBet}
                  disabled={!stakeAmount || isPlacingBet}
                  className="w-full h-12 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg text-base font-bold hover:from-cyan-700 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlacingBet ? 'Processing...' : 'Confirm Stake'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <p className="text-center text-sm text-gray-600">
            Blind voting active - stakes and results hidden until market resolves
          </p>
        </div>
      </div>
    </div>
  );
}
