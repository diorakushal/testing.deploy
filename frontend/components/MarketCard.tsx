'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Sparkline from '@/components/Sparkline';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface MarketCardProps {
  market: {
    id: string;
    title: string;
    category: string;
    created_at: string;
    ends_at: string;
    total_agree_stakes: number | string;
    total_disagree_stakes: number | string;
    creator_address: string;
    status?: string;
    winner?: number;
  };
  onBetClick?: (marketId: string, marketTitle: string, side: 'agree' | 'disagree', amount: string) => void;
  userAddress?: string;
}

export default function MarketCard({ market, onBetClick, userAddress }: MarketCardProps) {
  const [selectedSide, setSelectedSide] = useState<'agree' | 'disagree' | null>(null);
  const [stakeAmount, setStakeAmount] = useState('10');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [maxAmount] = useState(1000); // Max bet amount
  const [userPayout, setUserPayout] = useState<number | null>(null);
  const [timeProgress, setTimeProgress] = useState(1); // 1 -> full time remaining, 0 -> ended

  const isResolved = market.status === 'resolved' || new Date(market.ends_at).getTime() < Date.now();
  const isWinnerAgree = market.winner === 1;
  const agreeStakes = typeof market.total_agree_stakes === 'string' ? parseFloat(market.total_agree_stakes) : market.total_agree_stakes;
  const disagreeStakes = typeof market.total_disagree_stakes === 'string' ? parseFloat(market.total_disagree_stakes) : market.total_disagree_stakes;
  const totalVolume = agreeStakes + disagreeStakes;
  const agreePct = totalVolume > 0 ? (agreeStakes / totalVolume * 100).toFixed(0) : '0';
  const disagreePct = totalVolume > 0 ? (disagreeStakes / totalVolume * 100).toFixed(0) : '0';

  const formatVolume = (volume: number) => {
    if (volume === 0) return '0.00';
    return volume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCompactVolume = (volume: number) => {
    if (!volume) return '0';
    if (volume < 1000) return Math.round(volume).toString();
    if (volume < 1_000_000) return `${(volume / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    if (volume < 1_000_000_000) return `${(volume / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    return `${(volume / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  };

  const formatTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    // If less than 1 hour, only show minutes
    if (hours === 0) {
      return `${minutes}m`;
    }
    
    // Show both hours and minutes
    return `${hours}h ${minutes}m`;
  };

  useEffect(() => {
    if (!isResolved) {
      const updateTimer = () => {
        setTimeRemaining(formatTimeRemaining(market.ends_at));
        const endTs = new Date(market.ends_at).getTime();
        // Assume all markets run for 24 hours; derive start from end for consistent progress
        const startTs = endTs - 24 * 60 * 60 * 1000;
        const nowTs = Date.now();
        const total = Math.max(1, endTs - startTs);
        const remaining = Math.min(Math.max(endTs - nowTs, 0), total);
        // Progress represents remaining time fraction (1.0 at start, 0.0 at end)
        setTimeProgress(remaining / total);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }
  }, [market.created_at, market.ends_at, isResolved]);

  useEffect(() => {
    if (isResolved && userAddress && market.id) {
      // Fetch user payout
      axios.get(`${API_URL}/markets/${market.id}/user/${userAddress}/payout`)
        .then(response => {
          if (response.data.won && response.data.payout) {
            setUserPayout(response.data.payout);
          }
        })
        .catch(() => {
          // User doesn't have a stake or market not resolved yet
          setUserPayout(null);
        });
    }
  }, [isResolved, userAddress, market.id]);

  const getCategoryColor = (category: string) => {
    // Consistent styling for all categories
    return 'bg-gray-200 text-gray-700';
  };

  const handleIncrement = (amount: number) => {
    const current = parseFloat(stakeAmount) || 0;
    const newAmount = Math.min(maxAmount, current + amount);
    setStakeAmount(newAmount.toString());
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setStakeAmount(value.toString());
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || value === '0') {
      setStakeAmount('');
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= maxAmount) {
      setStakeAmount(value);
    }
  };

  const handlePlaceBet = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) < 1) {
      toast.error('Minimum bet is 1 USDC');
      return;
    }

    if (!selectedSide) {
      toast.error('Please select Agree or Disagree');
      return;
    }

    // Require wallet connection to proceed
    if (!userAddress) {
      toast.error('Connect your wallet to place a stake');
      return;
    }

    // Check if onBetClick handler is provided (for PostTakeModal integration)
    if (onBetClick) {
      onBetClick(market.id, market.title, selectedSide, stakeAmount);
      // Keep the side and amount selected in case user comes back
      return;
    }
    
    // Fallback to old behavior (should not happen in production)
    setIsPlacingBet(true);
    toast.loading('Placing bet...');
    
    setTimeout(() => {
      toast.dismiss();
      toast.success('Bet placed!');
      setSelectedSide(null);
      setStakeAmount('10');
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
    <div className="bg-white flex flex-col h-full border-b border-gray-200 px-4 py-4">
      {/* Header with Category and Status */}
      <div className="pt-0 pb-2 flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(market.category)} leading-5`}>
          {market.category}
        </span>
        {isResolved ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 bg-gray-200 text-gray-700">
            RESOLVED <span className="text-[#00D07E]">✓</span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#00D07E]/20 text-[#00D07E] flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#00D07E] rounded-full"></span>
            Live · {timeRemaining}
          </span>
        )}
      </div>

      <div className="pb-2 space-y-2 flex flex-col relative">
        {/* Title */}
        <h3 className="text-[15px] font-semibold text-black leading-snug">
          {market.title}
        </h3>

        {/* Resolved Market View */}
        {isResolved ? (
          <>
            {/* Meta - compact like active markets */}
            <div className="text-xs text-gray-600 flex items-center gap-2">
              <span>${formatCompactVolume(totalVolume)} resolved</span>
            </div>

            {/* Winner indicator - compact */}
            <div className="mt-1">
              <span className="text-xs text-gray-600">Winner: </span>
              <span className="text-sm font-semibold text-black">
                {isWinnerAgree ? 'AGREE' : 'DISAGREE'}
              </span>
            </div>

            {/* Final Breakdown - match active market conviction display */}
            <div className="mt-2">
              <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden relative">
                <div
                  className="absolute inset-0 transition-all"
                  style={{
                    background: `linear-gradient(to right, #00D07E 0%, #00D07E ${agreePct}%, #2952FF ${agreePct}%, #9333EA 100%)`
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] mt-1">
                <span className={`font-semibold ${isWinnerAgree ? 'text-[#00D07E]' : 'text-gray-600'}`}>
                  AGREE {agreePct}%
                </span>
                <span className={`font-semibold ${!isWinnerAgree ? 'text-blue-600' : 'text-gray-600'}`}>
                  DISAGREE {disagreePct}%
                </span>
              </div>
              <div className="flex justify-between text-[11px] mt-0.5 text-gray-600">
                <span>${formatCompactVolume(agreeStakes)}</span>
                <span>${formatCompactVolume(disagreeStakes)}</span>
              </div>
            </div>

            {userPayout !== null && userPayout > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-[#00D07E]">
                  Your payout: ${formatVolume(userPayout)}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Meta - compact like tweet stats */}
            <div className="text-xs text-gray-600 flex items-center gap-2">
              <span>{formatCompactVolume(totalVolume)} USDC vol</span>
              <span className="text-gray-400">·</span>
              <span className="flex items-center gap-1.5 text-[#00D07E]">
                {/* Countdown ring */}
                <span
                  className="inline-block w-5 h-5 rounded-full relative"
                  style={{
                    background: `conic-gradient(rgb(16,185,129) ${Math.round(
                      timeProgress * 360
                    )}deg, rgb(229,231,235) 0deg)`
                  }}
                  aria-hidden
                >
                  <span className="absolute inset-[3px] rounded-full bg-white"></span>
                </span>
                {timeRemaining}
              </span>
            </div>

            {/* If we have priceHistory, show sparkline; else show conviction bar */}
            {Array.isArray((market as any).priceHistory) && (market as any).priceHistory.length > 1 ? (
              <div className="mt-2">
                <Sparkline
                  data={(market as any).priceHistory as number[]}
                  width={260}
                  height={36}
                  stroke={parseFloat(agreePct) >= 50 ? '#00D07E' : '#2952FF'}
                  fill={parseFloat(agreePct) >= 50 ? 'rgba(0,208,126,0.10)' : 'rgba(41,82,255,0.10)'}
                />
                <div className="flex justify-between text-[11px] mt-1">
                  <span className="font-semibold text-[#00D07E]">AGREE {agreePct}%</span>
                  <span className="font-semibold text-blue-600">DISAGREE {disagreePct}%</span>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden relative">
                  <div
                    className="absolute inset-0 transition-all"
                    style={{
                      background: `linear-gradient(to right, #00D07E 0%, #00D07E ${agreePct}%, #2952FF ${agreePct}%, #9333EA 100%)`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] mt-1">
                  <span className="font-semibold text-[#00D07E]">AGREE {agreePct}%</span>
                  <span className="font-semibold text-blue-600">DISAGREE {disagreePct}%</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Compact actions row */}
        {!isResolved && (
          <>
            {!selectedSide ? (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSide('agree')}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 hover:bg-[#00D07E]/10 hover:border-[#00D07E]/40 hover:text-[#00D07E]"
                  >
                    Agree
                  </button>
                  <button
                    onClick={() => setSelectedSide('disagree')}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 hover:bg-[#2952FF]/10 hover:border-[#2952FF]/40 hover:text-[#2952FF]"
                  >
                    Disagree
                  </button>
                </div>
                <button 
                  onClick={handleShare}
                  className="text-gray-600 hover:text-[#2952FF] transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="Share market"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                {/* Inline amount selector */}
                <div className="flex items-center gap-2">
                  {/* Amount input and increment buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={handleAmountInputChange}
                        className="w-16 pl-5 pr-1.5 py-1 bg-gray-50 border border-gray-300 rounded text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500 [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                        min="1"
                        max={maxAmount}
                      />
                    </div>
                    <button
                      onClick={() => handleIncrement(1)}
                      className="px-1.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[10px] font-medium transition-colors"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleIncrement(10)}
                      className="px-1.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[10px] font-medium transition-colors"
                    >
                      +10
                    </button>
                  </div>
                  
                  {/* Slider */}
                  <div className="flex-1 relative max-w-xs">
                    <input
                      type="range"
                      min="1"
                      max={maxAmount}
                      value={stakeAmount || '10'}
                      onChange={handleSliderChange}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: selectedSide === 'agree'
                          ? `linear-gradient(to right, rgb(0, 208, 126) 0%, rgb(0, 208, 126) ${((parseFloat(stakeAmount || '10') - 1) / (maxAmount - 1)) * 100}%, rgb(229, 231, 235) ${((parseFloat(stakeAmount || '10') - 1) / (maxAmount - 1)) * 100}%, rgb(229, 231, 235) 100%)`
                          : `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(147, 51, 234) ${((parseFloat(stakeAmount || '10') - 1) / (maxAmount - 1)) * 100}%, rgb(229, 231, 235) ${((parseFloat(stakeAmount || '10') - 1) / (maxAmount - 1)) * 100}%, rgb(229, 231, 235) 100%)`
                      }}
                    />
                  </div>
                </div>

                {/* Confirm action as the single primary button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlaceBet}
                    disabled={!stakeAmount || parseFloat(stakeAmount) < 1 || isPlacingBet}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-black text-white hover:bg-gray-800"
                  >
                    {isPlacingBet ? 'Processing...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSide(null);
                      setStakeAmount('10');
                    }}
                    className="px-2 py-1 text-gray-600 hover:text-black text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Resolved posts - show share only */}
        {isResolved && (
          <div className="flex justify-end pt-1">
            <button 
              onClick={handleShare}
              className="text-gray-600 hover:text-[#2952FF] transition-colors p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Share market"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
