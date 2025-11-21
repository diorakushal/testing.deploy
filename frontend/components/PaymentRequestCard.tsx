'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatUnits, parseUnits, Address, isAddress } from 'viem';
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getChainConfig, getToken } from '@/lib/tokenConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Base USDC address (Base mainnet)
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;

// ERC20 ABI for transfer
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  }
] as const;

interface PaymentRequestCardProps {
  request: {
    id: string;
    requester_address: string;
    amount: string | number;
    token_symbol: string;
    token_address: string;
    chain_id: number;
    chain_name: string;
    caption: string | null;
    status: string;
    paid_by?: string | null;
    tx_hash?: string | null;
    created_at: string;
    paid_at?: string | null;
  };
  userAddress?: string;
  onPaymentSuccess?: () => void;
}

export default function PaymentRequestCard({ request, userAddress, onPaymentSuccess }: PaymentRequestCardProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash,
    enabled: !!hash 
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasMarkedPaid, setHasMarkedPaid] = useState(false);
  const isPaid = request.status === 'paid';
  const isOpen = request.status === 'open';
  const isOwnRequest = userAddress?.toLowerCase() === request.requester_address.toLowerCase();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleShare = async () => {
    const shareableLink = `${window.location.origin}/payment-request/${request.id}`;
    try {
      await navigator.clipboard.writeText(shareableLink);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleAccept = async () => {
    // Check if Solana (requires different handling)
    if (request.chain_id === 'solana' || String(request.chain_id) === 'solana') {
      toast.error('Solana payments require Phantom wallet. Coming soon!');
      return;
    }
    
    // Ensure chain_id is a number for EVM chains
    const chainIdNum = typeof request.chain_id === 'string' ? parseInt(request.chain_id) : request.chain_id;
    if (isNaN(chainIdNum)) {
      toast.error('Invalid chain ID');
      return;
    }
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (isOwnRequest) {
      toast.error('You cannot pay your own request');
      return;
    }

    if (!isOpen) {
      toast.error('This request is no longer open');
      return;
    }

    try {
      setIsProcessing(true);
      toast.loading('Preparing payment...');

      const chainConfig = getChainConfig(chainIdNum);
      if (!chainConfig) {
        toast.error('Unsupported chain');
        setIsProcessing(false);
        return;
      }

      // Check if we need to switch chains
      if (chainId !== chainIdNum) {
        toast.loading(`Switching to ${chainConfig.name}...`);
        try {
          if (switchChain) {
            try {
              await switchChain({ chainId: chainIdNum as any });
              // Wait a bit for chain switch
              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (switchError: any) {
              // If chain not in wallet, add it via window.ethereum
              if (window.ethereum) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: `0x${chainIdNum.toString(16)}`,
                    chainName: chainConfig.name,
                    nativeCurrency: chainConfig.nativeCurrency,
                    rpcUrls: [chainConfig.rpcUrl],
                    blockExplorerUrls: [chainConfig.explorer]
                  }]
                });
                await new Promise(resolve => setTimeout(resolve, 2000));
                // Try switching again
                await switchChain({ chainId: chainIdNum as any });
                await new Promise(resolve => setTimeout(resolve, 2000));
              } else {
                throw switchError;
              }
            }
          } else if (window.ethereum) {
            // Fallback to direct ethereum request
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainIdNum.toString(16)}` }]
              });
              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (switchError: any) {
              if (switchError.code === 4902) {
                // Chain not added, try to add it
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: `0x${chainIdNum.toString(16)}`,
                    chainName: chainConfig.name,
                    nativeCurrency: chainConfig.nativeCurrency,
                    rpcUrls: [chainConfig.rpcUrl],
                    blockExplorerUrls: [chainConfig.explorer]
                  }]
                });
                await new Promise(resolve => setTimeout(resolve, 2000));
              } else {
                throw switchError;
              }
            }
          }
        } catch (switchError: any) {
          toast.dismiss();
          console.error('Chain switch error:', switchError);
          toast.error('Failed to switch network. Please switch manually in your wallet.');
          setIsProcessing(false);
          return;
        }
      }

      // Validate token address
      if (!isAddress(request.token_address)) {
        toast.error('Invalid token address');
        setIsProcessing(false);
        return;
      }

      // Get token decimals
      const token = getToken(request.token_symbol, chainIdNum);
      const decimals = token?.decimals || 6; // Default to 6 for USDC/USDT
      
      // Convert amount to wei
      const amountInWei = parseUnits(request.amount.toString(), decimals);

      toast.loading('Sending payment...');

      // Send ERC20 transfer
      writeContract({
        address: request.token_address as Address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [request.requester_address as Address, amountInWei]
      }, {
        onError: (error) => {
          toast.dismiss();
          console.error('Error sending payment:', error);
          toast.error(error.message || 'Failed to send payment');
          setIsProcessing(false);
        }
      });
    } catch (error: any) {
      toast.dismiss();
      console.error('Error accepting payment:', error);
      toast.error(error.message || 'Failed to process payment');
      setIsProcessing(false);
    }
  };

  // Handle writeContract errors
  useEffect(() => {
    if (error) {
      toast.dismiss();
      toast.error(error.message || 'Transaction failed');
      setIsProcessing(false);
    }
  }, [error]);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash && !isPaid && !hasMarkedPaid && address) {
      setHasMarkedPaid(true);
      // Mark request as paid
      axios.patch(`${API_URL}/payment-requests/${request.id}/paid`, {
        txHash: hash,
        paidBy: address
      })
        .then(() => {
          toast.success('Payment sent successfully!');
          setIsProcessing(false);
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
        })
        .catch((err) => {
          console.error('Error updating payment status:', err);
          toast.error('Payment sent but failed to update status');
          setIsProcessing(false);
          setHasMarkedPaid(false);
        });
    }
  }, [isSuccess, hash, isPaid, hasMarkedPaid, address, request.id, onPaymentSuccess]);

  const isLoading = isPending || isConfirming || isProcessing;

  return (    <div className="bg-white flex flex-col border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
      <div className="px-6 py-5">
        {/* Header with Status */}
        <div className="flex items-start justify-between mb-4">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 tracking-wide uppercase">
            Crypto Request
          </span>
          <div className="flex items-center">
            {isPaid ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 bg-[#00D07E]/10 text-[#00D07E] border border-[#00D07E]/20">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                PAID
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                OPEN
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-3">
          {/* Amount and Token */}
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-2xl font-bold text-black tracking-tight">
              {formatAmount(request.amount)} {request.token_symbol}
            </h3>
            <span className="text-sm text-gray-500 font-medium">on {request.chain_name}</span>
          </div>

          {/* Caption */}
          {request.caption && (
            <p className="text-base text-gray-800 leading-relaxed font-medium">
              {request.caption}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">From {formatAddress(request.requester_address)}</span>
            </div>
            {isPaid && request.paid_by && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Paid by {formatAddress(request.paid_by)}</span>
                </div>
              </>
            )}
          </div>

          {/* Accept & Send button and Share button */}
          <div className="pt-4 flex items-center justify-between">
            <div>
              {isOpen && !isPaid && (
                <>
                  {isOwnRequest ? (
                    <div className="text-xs text-gray-400 font-medium">Your request</div>
                  ) : (
                    <button
                      onClick={handleAccept}
                      disabled={isLoading || !isConnected}
                      className="px-5 py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-black text-white hover:bg-gray-800 active:scale-[0.98] shadow-sm hover:shadow-md"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : !isConnected ? (
                        'Connect Wallet to Pay'
                      ) : (
                        'Accept & Send'
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200 active:scale-[0.98]"
              title="Share crypto request"
              aria-label="Share crypto request"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Share</span>
            </button>
          </div>

          {/* Transaction link for paid requests */}
          {isPaid && request.tx_hash && (
            <div className="pt-2">
              <a
                href={getChainConfig(typeof request.chain_id === 'string' ? request.chain_id : request.chain_id)?.explorer 
                  ? `${getChainConfig(typeof request.chain_id === 'string' ? request.chain_id : request.chain_id)!.explorer}/tx/${request.tx_hash}`
                  : `https://basescan.org/tx/${request.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#2952FF] hover:text-[#1a3dcc] font-medium transition-colors group"
              >
                <span>View transaction</span>
                <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

