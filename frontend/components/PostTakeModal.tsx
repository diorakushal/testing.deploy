'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

interface PostTakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketId?: string;
  marketTitle?: string;
  userAddress?: string;
  marketData?: {
    total_agree_stakes: number;
    total_disagree_stakes: number;
  };
  initialSide?: 'agree' | 'disagree';
  initialAmount?: string;
}

// Contract addresses (should be in .env)
const DOXA_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const POLYGON_CHAIN_ID = 137;
const POLYGON_CHAIN_ID_HEX = '0x89';
const USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'; // Polygon USDC

// USDC ABI (minimal)
const USDC_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function balanceOf(address account) public view returns (uint256)',
  'function decimals() public view returns (uint8)'
];

// Doxa Contract ABI (minimal)
const DOXA_ABI = [
  'function stakeAgree(uint256 marketId, uint256 amount) public',
  'function stakeDisagree(uint256 marketId, uint256 amount) public',
  'event StakePlaced(address indexed user, uint256 indexed marketId, uint256 amount, uint8 side)'
];

export default function PostTakeModal({ isOpen, onClose, marketId, marketTitle, userAddress, marketData, initialSide, initialAmount }: PostTakeModalProps) {
  const [step, setStep] = useState<'network' | 'approve' | 'betting' | 'confirming' | 'success'>('network');
  const [selectedSide, setSelectedSide] = useState<'agree' | 'disagree' | null>(null);
  const [amount, setAmount] = useState('');
  const [usdcApproved, setUsdcApproved] = useState(false);
  const [balance, setBalance] = useState('0');
  const [gasEstimate, setGasEstimate] = useState('0.05');
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && userAddress) {
      checkNetwork();
    }
  }, [isOpen, userAddress]);

  useEffect(() => {
    if (isOpen && initialSide) {
      setSelectedSide(initialSide);
    }
  }, [isOpen, initialSide]);

  useEffect(() => {
    if (isOpen && initialAmount) {
      setAmount(initialAmount);
    }
  }, [isOpen, initialAmount]);

  const checkNetwork = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask');
      return;
    }

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdNumber = parseInt(chainId, 16);
      setCurrentChainId(chainIdNumber);

      if (chainIdNumber !== POLYGON_CHAIN_ID) {
        setStep('network');
        toast.error('Please switch to Polygon network');
      } else {
        await checkTokenApproval();
      }
    } catch (error) {
      console.error('Error checking network:', error);
    }
  };

  const handleSwitchNetwork = async () => {
    if (!window.ethereum) return;
    
    try {
      toast.loading('Switching to Polygon...');
      
      // Try to switch to Polygon
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_CHAIN_ID_HEX }]
      });
      
      // Give it a moment
      setTimeout(async () => {
        await checkNetwork();
        toast.dismiss();
        toast.success('Switched to Polygon!');
      }, 1000);
    } catch (switchError: any) {
      toast.dismiss();
      
      // If the chain hasn't been added to MetaMask yet, add it
      if (switchError.code === 4902 && window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: POLYGON_CHAIN_ID_HEX,
              chainName: 'Polygon Mainnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls: ['https://polygon-rpc.com/'],
              blockExplorerUrls: ['https://polygonscan.com/']
            }]
          });
          
          await handleSwitchNetwork();
        } catch (addError) {
          toast.error('Failed to add Polygon network');
        }
      } else {
        toast.error('Failed to switch network');
      }
    }
  };

  const checkTokenApproval = async () => {
    if (!window.ethereum || !userAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      
      // Check balance
      const balance_ = await usdcContract.balanceOf(userAddress);
      const decimals = await usdcContract.decimals();
      setBalance(ethers.formatUnits(balance_, decimals));
      
      // Check allowance
      const allowance = await usdcContract.allowance(userAddress, DOXA_CONTRACT_ADDRESS);
      
      if (allowance === 0n) {
        setStep('approve');
        setUsdcApproved(false);
      } else {
        setStep('betting');
        setUsdcApproved(true);
      }
    } catch (error) {
      console.error('Error checking approval:', error);
      toast.error('Error checking token approval');
    }
  };

  const handleApproveUSDC = async () => {
    if (!window.ethereum || !userAddress) return;

    try {
      toast.loading('Approving USDC...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      
      const maxAmount = ethers.MaxUint256;
      const tx = await usdcContract.approve(DOXA_CONTRACT_ADDRESS, maxAmount);
      
      toast.dismiss();
      toast.loading('Waiting for confirmation...', { id: 'approve' });
      await tx.wait();
      
      toast.dismiss('approve');
      toast.success('USDC Approved!');
      
      setUsdcApproved(true);
      setStep('betting');
    } catch (error: any) {
      toast.dismiss();
      if (error.code === 4001) {
        toast.error('Transaction rejected');
      } else {
        toast.error('Failed to approve USDC');
      }
    }
  };

  const handlePlaceStake = async () => {
    if (!window.ethereum || !userAddress || !selectedSide || !amount || !marketId) return;

    const amountNum = parseFloat(amount);
    if (amountNum < 1) {
      toast.error('Minimum stake is 1 USDC');
      return;
    }

    try {
      setStep('confirming');
      toast.loading('Placing stake...');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const decimals = await usdcContract.decimals();
      const doxaContract = new ethers.Contract(DOXA_CONTRACT_ADDRESS, DOXA_ABI, signer);
      
      const amountWei = ethers.parseUnits(amount, decimals);
      
      let tx;
      if (selectedSide === 'agree') {
        tx = await doxaContract.stakeAgree(marketId, amountWei);
      } else {
        tx = await doxaContract.stakeDisagree(marketId, amountWei);
      }
      
      toast.dismiss();
      toast.loading('Waiting for confirmation...', { id: 'stake' });
      await tx.wait();
      
      toast.dismiss('stake');
      toast.success('Stake placed successfully!');
      
      setStep('success');
    } catch (error: any) {
      toast.dismiss();
      if (error.code === 4001) {
        toast.error('Transaction rejected');
      } else {
        toast.error('Failed to place stake');
      }
      setStep('betting');
    }
  };

  const quickSelectAmount = (value: string) => {
    if (value === 'MAX') {
      const maxAmount = Math.max(0, (parseFloat(balance) - parseFloat(gasEstimate))).toFixed(2);
      setAmount(maxAmount);
    } else {
      setAmount(value);
    }
  };

  // Calculate potential payout
  const calculatePayout = () => {
    if (!amount || !marketData || !selectedSide) return null;
    
    const stakeAmount = parseFloat(amount);
    const agreeVolume = marketData.total_agree_stakes;
    const disagreeVolume = marketData.total_disagree_stakes;
    
    if (selectedSide === 'agree') {
      // If agreeing, user wins if agree > disagree
      if (agreeVolume + stakeAmount > disagreeVolume) {
        const totalLosingPool = disagreeVolume;
        const myStake = stakeAmount;
        const myTotalContribution = agreeVolume + stakeAmount;
        const winningShare = (myStake / myTotalContribution);
        const rakeDeduction = 0.05; // 5% platform rake
        const payout = winningShare * totalLosingPool * (1 - rakeDeduction);
        return stakeAmount + payout;
      }
    } else {
      // If disagreeing, user wins if disagree > agree
      if (disagreeVolume + stakeAmount > agreeVolume) {
        const totalLosingPool = agreeVolume;
        const myStake = stakeAmount;
        const myTotalContribution = disagreeVolume + stakeAmount;
        const winningShare = (myStake / myTotalContribution);
        const rakeDeduction = 0.05; // 5% platform rake
        const payout = winningShare * totalLosingPool * (1 - rakeDeduction);
        return stakeAmount + payout;
      }
    }
    
    return null; // Not winning
  };

  const potentialPayout = calculatePayout();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Network Verification Step */}
        {step === 'network' && (
          <>
            <div className="px-6 py-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Wrong Network</h2>
                <p className="text-gray-600 mb-1">You're on {currentChainId === 1 ? 'Ethereum' : 'another network'}</p>
                <p className="text-gray-600 mb-6">Please switch to Polygon to place bets</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleSwitchNetwork}
                  className="flex-1 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
                >
                  Switch to Polygon
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}

        {/* Token Approval Step */}
        {step === 'approve' && (
          <>
            <div className="px-6 py-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔐</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Approve USDC</h2>
                <p className="text-gray-600 mb-6">Doxa needs permission to use USDC for your stake</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleApproveUSDC}
                  className="flex-1 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
                >
                  Approve USDC
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}

        {/* Betting Step */}
        {step === 'betting' && marketId && marketTitle && (
          <>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Place Your Stake</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Market Title */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Market</p>
                <h3 className="text-lg font-semibold text-gray-900">{marketTitle}</h3>
              </div>

              {/* Choose Side */}
              <div>
                <p className="text-sm text-gray-500 mb-3">Which side are you taking?</p>
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedSide('agree')}
                    className={`w-full py-4 px-4 rounded-lg border-2 transition-all ${
                      selectedSide === 'agree'
                        ? 'bg-[#00D07E]/20 border-[#00D07E] text-[#00D07E]'
                        : 'border-gray-700 hover:border-[#00D07E] text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✅</span>
                      <div className="text-left">
                        <div className="font-semibold">AGREE</div>
                        <div className="text-sm opacity-75">Supporting this position</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedSide('disagree')}
                    className={`w-full py-4 px-4 rounded-lg border-2 transition-all ${
                      selectedSide === 'disagree'
                        ? 'bg-[#2952FF]/20 border-[#2952FF] text-[#2952FF]'
                        : 'border-gray-700 hover:border-[#2952FF] text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">❌</span>
                      <div className="text-left">
                        <div className="font-semibold">DISAGREE</div>
                        <div className="text-sm opacity-75">Opposing this position</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Wallet Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Your Wallet</span>
                  <span className="text-sm font-mono text-gray-900">{userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">USDC Balance</span>
                  <span className="text-sm font-semibold establishing-900">${balance}</span>
                </div>
              </div>

              {/* Stake Amount */}
              <div>
                <p className="text-sm text-gray-500 mb-2">How much do you want to stake?</p>
                <div className="flex items-center gap-2 px-3 py-3 rounded-lg border-2 border-gray-300 bg-white">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 outline-none text-lg font-semibold"
                    min="1"
                    max={balance}
                  />
                  <span className="text-gray-500 text-sm">USDC</span>
                </div>

                {/* Quick Select */}
                <div className="flex gap-2 mt-2">
                  {['10', '25', '50', '100', 'MAX'].map((val) => (
                    <button
                      key={val}
                      onClick={() => quickSelectAmount(val)}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-cyan-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stake amount</span>
                  <span className="font-semibold text-gray-900">${amount || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gas fee</span>
                  <span className="font-semibold text-gray-900">~${gasEstimate}</span>
                </div>
                <div className="border-t border-cyan-200 pt-2 flex justify-between text-sm">
                  <span className="font-semibold text-gray-900">Total cost</span>
                  <span className="font-bold text-cyan-700">${(parseFloat(amount) + parseFloat(gasEstimate)).toFixed(2)}</span>
                </div>
              </div>

              {/* Potential Payout */}
              {potentialPayout && amount && parseFloat(amount) > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xl">💵</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900 mb-1">Potential Payout</p>
                      <p className="text-lg font-bold text-green-700">${potentialPayout.toFixed(2)} USDC</p>
                      <p className="text-xs text-green-700 mt-1">
                        If your side wins, this amount will be <strong>automatically sent</strong> to your wallet
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex justify-between text-xs text-green-700">
                      <span>Your stake:</span>
                      <span className="font-semibold">${amount}</span>
                    </div>
                    <div className="flex justify-between text-xs text-green-700 mt-1">
                      <span>Winnings:</span>
                      <span className="font-semibold">+${(potentialPayout - parseFloat(amount)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Place Stake Button */}
              <button
                onClick={handlePlaceStake}
                disabled={!selectedSide || !amount || parseFloat(amount) < 1 || parseFloat(amount) > parseFloat(balance)}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg font-bold hover:from-cyan-700 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Place Stake
              </button>
            </div>
          </>
        )}

        {/* Confirming Step */}
        {step === 'confirming' && (
          <>
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Processing...</h2>
              <p className="text-gray-600">Waiting for blockchain confirmation</p>
            </div>
          </>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <>
            <div className="px-6 py-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl年为">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Stake Confirmed!</h2>
              <p className="text-gray-600 mb-6">Your bet has been placed successfully</p>
              
              <button
                onClick={() => {
                  onClose();
                  setStep('betting');
                  setSelectedSide(null);
                  setAmount('');
                }}
                className="w-full py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
