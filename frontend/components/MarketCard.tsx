'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface MarketCardProps {
  market: {
    id: string;
    title: string;
    category: string;
    created_at: string;
    ends_at: string;
    total_agree_stakes: number;
    total_disagree_stakes: number;
    creator_address: string;
    status?: string;
    winner?: number;
  };
  onBetClick?: (marketId: string, marketTitle: string) => void;
}

export default function MarketCard({ market, onBetClick }: MarketCardProps) {
  const [selectedSide, setSelectedSide] = useState<'agree' | 'disagree' | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  const isResolved = market.status === 'resolved' || new Date(market.ends_at).getTime() < Date.now();
  const isWinnerAgree = market.winner === 1;
  const totalVolume = parseFloat(market.total_agree_stakes) + parseFloat(market.total_disagree_stakes);
  const agreePct = totalVolume > 0 ? (parseFloat(market.total_agree_stakes) / totalVolume * 100).toFixed(0) : '0';
  const disagreePct = totalVolume > 0 ? (parseFloat(market.total_disagree_stakes) / totalVolume * 100).toFixed(0) : '0';

  const formatVolume = (volume: number) => {
    if (volume === 0) return '0.00';
    return volume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  useEffect(() => {
    if (!isResolved) {
      const updateTimer = () => {
        setTimeRemaining(formatTimeRemaining(market.ends_at));
      };
      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }
  }, [market.ends_at, isResolved]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'music': 'bg-purple-100 text-purple-700',
      'sports': 'bg-green-100 text-green-700',
      'politics': 'bg-red-100 text-red-700',
      'pop-culture': 'bg-pink-100 text-pink-700',
      'other': 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors['other'];
  };

  const handleIncrement = (amount: number) => {
    const current = parseFloat(stakeAmount) || 0;
    setStakeAmount((current + amount).toString());
  };

  const handlePlaceBet = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) < 1) {
      toast.error('Minimum bet is 1 USDC');
      return;
    }

    // Check if onBetClick handler is provided (for PostTakeModal integration)
    if (onBetClick) {
      onBetClick(market.id, market.title);
      setSelectedSide(null);
      setStakeAmount('');
      return;
    }
    
    // Fallback to old behavior (should not happen in production)
    setIsPlacingBet(true);
    toast.loading('Placing bet...');
    
    setTimeout(() => {
      toast.dismiss();
      toast.success('Bet placed!');
      setSelectedSide(null);
      setStakeAmount('');
      setIsPlacingBet(false);
    }, 1500);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareableLink = `${window.location.origin}/market/${market.id}`;
    
    try {
      await navigator.clipboard.writeText(shareableLink);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
      {/* Header with Category and Status */}
      <div className="px-6 pt-4 pb-3 flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(market.category)}`}>
          {market.category}
        </span>
        {isResolved ? (
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
            isWinnerAgree ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <span className="text-base">{isWinnerAgree ? '✅' : '❌'}</span>
            {isWinnerAgree ? 'AGREED WON' : 'DISAGREED WON'} ({isWinnerAgree ? agreePct : disagreePct}%)
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            Live - {timeRemaining}
          </span>
        )}
      </div>

      <div className="px-6 pb-4 space-y-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 leading-tight">
          {market.title}
        </h3>

        {/* Stats - Volume and Time */}
        <div className="flex items-center gap-8 pb-2 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Volume</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{formatVolume(totalVolume)} USDC</p>
          </div>
          {!isResolved && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Ends In</p>
              <p className="text-xl font-bold text-cyan-600 mt-0.5">{timeRemaining}</p>
            </div>
          )}
        </div>

        {/* Take a Position Section - Only show if not resolved */}
        {!isResolved && (
          <div className="space-y-3 pt-2">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Take a Position</h4>
              <p className="text-xs text-gray-600 mt-0.5">Choose your side and enter amount</p>
            </div>

            <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-sm">
              <span className="text-gray-900 font-medium">Your Wallet Balance</span>
              <span className="text-gray-700">0.00 USDC</span>
            </div>

            {/* Betting Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedSide(selectedSide === 'agree' ? null : 'agree');
                  if (selectedSide === 'agree') {
                    setStakeAmount('');
                  }
                }}
                disabled={isPlacingBet}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                  selectedSide === 'agree'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-white border-gray-200 hover:border-green-300 text-gray-700'
                } disabled:opacity-50`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">Agree</span>
              </button>

              <button
                onClick={() => {
                  setSelectedSide(selectedSide === 'disagree' ? null : 'disagree');
                  if (selectedSide === 'disagree') {
                    setStakeAmount('');
                  }
                }}
                disabled={isPlacingBet}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                  selectedSide === 'disagree'
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-white border-gray-200 hover:border-red-300 text-gray-700'
                } disabled:opacity-50`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-semibold">Disagree</span>
              </button>
            </div>

            {/* Amount Input - Only show when side is selected */}
            {selectedSide ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-50">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="flex-1 outline-none bg-transparent text-gray-900 font-medium placeholder-gray-400"
                    min="1"
                    max="1000"
                  />
                  <span className="text-gray-500 text-sm font-medium">USDC</span>
                  <button
                    onClick={() => handleIncrement(1)}
                    className="px-2.5 py-1 bg-white hover:bg-gray-100 rounded text-xs text-gray-700 font-medium transition-colors border border-gray-300"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleIncrement(10)}
                    className="px-2.5 py-1 bg-white hover:bg-gray-100 rounded text-xs text-gray-700 font-medium transition-colors border border-gray-300"
                  >
                    +10
                  </button>
                </div>

                <button
                  onClick={handlePlaceBet}
                  disabled={!stakeAmount || isPlacingBet}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    selectedSide === 'agree'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isPlacingBet ? 'Processing...' : 'Place Bet'}
                </button>
              </div>
            ) : (
              // Share Button - Only show when no side is selected
              <div className="flex justify-end">
                <button 
                  onClick={handleShare}
                  className="text-gray-400 hover:text-cyan-600 transition-colors"
                  aria-label="Share market"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resolved State - Show share button */}
        {isResolved && (
          <div className="flex justify-end pt-2">
            <button 
              onClick={handleShare}
              className="text-gray-400 hover:text-cyan-600 transition-colors"
              aria-label="Share market"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
