'use client';

import { useState, useEffect, useRef } from 'react';
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
    requester_username?: string | null; // Username from authenticated user account
    amount: string | number;
    token_symbol: string;
    token_address: string;
    chain_id: number | string;
    chain_name: string;
    caption: string | null;
    status: string;
    paid_by?: string | null;
    paid_by_username?: string | null; // Username of the payer
    tx_hash?: string | null;
    created_at: string;
    paid_at?: string | null;
  };
  userAddress?: string;
  onPaymentSuccess?: () => void;
}

export default function PaymentRequestCard({ request, userAddress, onPaymentSuccess }: PaymentRequestCardProps) {
  console.log('[PaymentRequestCard] 🎨 Component render', {
    requestId: request.id,
    requestStatus: request.status,
    requestTxHash: request.tx_hash,
    requestPaidBy: request.paid_by,
    hasOnPaymentSuccess: !!onPaymentSuccess,
    userAddress
  });

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash,
    query: {
      enabled: !!hash 
    }
  });
  
  console.log('[PaymentRequestCard] 🔗 Wagmi hooks state', {
    address,
    isConnected,
    chainId,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    hasError: !!error
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasMarkedPaid, setHasMarkedPaid] = useState(false);
  const [localPaidStatus, setLocalPaidStatus] = useState(false);
  const [localTxHash, setLocalTxHash] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const isPaid = localPaidStatus || request.status === 'paid';
  const isOpen = request.status === 'open' && !localPaidStatus;
  const isUpdatingStatusRef = useRef(false);
  const retryCountRef = useRef(0);
  // Use address from useAccount() hook (connected wallet) or userAddress prop as fallback
  const currentUserAddress = address || userAddress;
  const isOwnRequest = currentUserAddress?.toLowerCase() === request.requester_address.toLowerCase();

  // Sync local state with request prop when it updates from parent
  useEffect(() => {
    console.log('[PaymentRequestCard] 🔄 Request prop updated', {
      requestStatus: request.status,
      requestTxHash: request.tx_hash,
      localPaidStatus,
      localTxHash,
      requestId: request.id
    });
    
    if (request.status === 'paid') {
      console.log('[PaymentRequestCard] ✅ Request status is paid - syncing local state');
      setLocalPaidStatus(true);
      if (request.tx_hash && !localTxHash) {
        console.log('[PaymentRequestCard] 📝 Setting local tx hash from request prop', {
          txHash: request.tx_hash
        });
        setLocalTxHash(request.tx_hash);
      }
    }
  }, [request.status, request.tx_hash, request.id, localPaidStatus, localTxHash]);

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

  const handleCancelClick = () => {
    if (!address || !isOwnRequest) {
      toast.error('Only the requester can cancel this request');
      return;
    }

    if (!isOpen) {
      toast.error('Only open requests can be cancelled');
      return;
    }

    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!address) return;

    try {
      setIsCancelling(true);
      setShowCancelModal(false);
      toast.loading('Cancelling request...');

      const response = await axios.patch(`${API_URL}/payment-requests/${request.id}/cancel`, {
        requesterAddress: address
      });

      toast.dismiss();
      toast.success('Payment request deleted');
      
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (error: any) {
      toast.dismiss();
      console.error('Error cancelling payment request:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to cancel request');
    } finally {
      setIsCancelling(false);
    }
  };

  // Step 1: Show confirmation modal with final gas fee calculation
  const handleAccept = async () => {
    
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

    // Validate token address
    if (!isAddress(request.token_address)) {
      toast.error('Invalid token address');
      return;
    }

    try {
      const chainConfig = getChainConfig(chainIdNum);
      if (!chainConfig) {
        toast.error('Unsupported chain');
        return;
      }

      // Check if we need to switch chains first
      if (chainId !== chainIdNum) {
        console.log('[PaymentRequestCard] 🔄 Switching chain', { from: chainId, to: chainIdNum });
        toast.loading(`Switching to ${chainConfig.name}...`);
        try {
          if (switchChain) {
            try {
              await switchChain({ chainId: chainIdNum as any });
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (switchError: any) {
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
                await new Promise(resolve => setTimeout(resolve, 1000));
                await switchChain({ chainId: chainIdNum as any });
                await new Promise(resolve => setTimeout(resolve, 1000));
              } else {
                throw switchError;
              }
            }
          }
        } catch (switchError: any) {
          toast.dismiss();
          console.error('[PaymentRequestCard] ❌ Chain switch error:', switchError);
          toast.error('Failed to switch network. Please switch manually in your wallet.');
          return;
        }
      }

      // Get token decimals
      const token = getToken(request.token_symbol, chainIdNum);
      const decimals = token?.decimals || 6;
      const amountInWei = parseUnits(request.amount.toString(), decimals);

      setIsProcessing(true);
      toast.loading('Sending payment...');

      // Send ERC20 transfer - wallet will handle gas calculations
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
      console.error('Error processing payment:', error);
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
    console.log('[PaymentRequestCard] Transaction status effect triggered', {
      isSuccess,
      hash,
      isPaid,
      hasMarkedPaid,
      address,
      requestId: request.id,
      requestStatus: request.status,
      isUpdatingStatus: isUpdatingStatusRef.current,
      localPaidStatus,
      localTxHash
    });

    // Prevent multiple simultaneous calls
    if (isSuccess && hash && !isPaid && !hasMarkedPaid && address && !isUpdatingStatusRef.current) {
      console.log('[PaymentRequestCard] ✅ Transaction succeeded - starting status update flow', {
        hash,
        requestId: request.id,
        address,
        currentRequestStatus: request.status
      });
      
      isUpdatingStatusRef.current = true;
      setHasMarkedPaid(true);
      
      // Immediately update local state to reflect paid status
      console.log('[PaymentRequestCard] 🔄 Setting local paid status to true', { hash });
      setLocalPaidStatus(true);
      setLocalTxHash(hash);
      
      const updateStatus = async (retryCount = 0) => {
        console.log(`[PaymentRequestCard] 📡 Attempting to update payment status (attempt ${retryCount + 1})`, {
          requestId: request.id,
          txHash: hash,
          paidBy: address,
          retryCount
        });
        
        try {
          const response = await axios.patch(`${API_URL}/payment-requests/${request.id}/paid`, {
            txHash: hash,
            paidBy: address
          });
          
          console.log('[PaymentRequestCard] ✅ Status update successful', {
            requestId: request.id,
            responseData: response.data,
            responseStatus: response.status
          });
          
          // Success - reset retry count and update flag
          retryCountRef.current = 0;
          isUpdatingStatusRef.current = false;
          
          // Get explorer URL for the transaction
          const chainConfig = getChainConfig(typeof request.chain_id === 'string' ? request.chain_id : request.chain_id);
          const explorerUrl = chainConfig?.explorer 
            ? `${chainConfig.explorer}/tx/${hash}`
            : `https://basescan.org/tx/${hash}`;
          
          console.log('[PaymentRequestCard] 🎉 Payment completed successfully', {
            explorerUrl,
            requestId: request.id
          });
          
          toast.success(
            <div className="flex flex-col gap-1">
              <span>Payment sent successfully!</span>
              <a 
                href={explorerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs underline hover:no-underline"
                onClick={(e) => e.stopPropagation()}
              >
                Verify transaction →
              </a>
            </div>,
            { duration: 6000 }
          );
          setIsProcessing(false);
          
          // Update local request state if response includes updated data
          if (response?.data) {
            console.log('[PaymentRequestCard] 📦 Response includes updated data', {
              updatedStatus: response.data.status,
              updatedTxHash: response.data.tx_hash,
              updatedPaidBy: response.data.paid_by
            });
            // The parent component should handle this via onPaymentSuccess
            // but we can also trigger a refresh
          }
          
          if (onPaymentSuccess) {
            console.log('[PaymentRequestCard] 🔄 Calling onPaymentSuccess callback after 500ms delay');
            // Add a small delay to ensure backend has processed the update
            setTimeout(() => {
              console.log('[PaymentRequestCard] 🔄 Executing onPaymentSuccess callback now');
              onPaymentSuccess();
            }, 500);
          } else {
            console.warn('[PaymentRequestCard] ⚠️ onPaymentSuccess callback not provided');
          }
        } catch (err: any) {
          console.error('[PaymentRequestCard] ❌ Error updating payment status', {
            error: err,
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
            statusText: err.response?.statusText,
            requestId: request.id,
            txHash: hash,
            paidBy: address,
            retryCount,
            willRetry: retryCount < 3,
            apiUrl: `${API_URL}/payment-requests/${request.id}/paid`,
            requestBody: {
              txHash: hash,
              paidBy: address
            }
          });
          
          // Log the full error for debugging
          if (err.response) {
            console.error('[PaymentRequestCard] ❌ API Error Response Details', {
              status: err.response.status,
              statusText: err.response.statusText,
              data: err.response.data,
              headers: err.response.headers
            });
          } else if (err.request) {
            console.error('[PaymentRequestCard] ❌ Network Error - No response received', {
              request: err.request,
              message: 'The request was made but no response was received'
            });
          } else {
            console.error('[PaymentRequestCard] ❌ Request Setup Error', {
              message: err.message,
              stack: err.stack
            });
          }
          
          // Retry logic - try up to 3 times with exponential backoff
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            retryCountRef.current = retryCount + 1;
            
            console.log(`[PaymentRequestCard] 🔄 Scheduling retry ${retryCount + 1} in ${delay}ms`);
            setTimeout(() => {
              updateStatus(retryCount + 1);
            }, delay);
          } else {
            // Max retries reached - show error but don't reset hasMarkedPaid to prevent re-triggering
            console.error('[PaymentRequestCard] ❌ Max retries reached - status update failed', {
              requestId: request.id,
              txHash: hash,
              finalError: err.message
            });
            isUpdatingStatusRef.current = false;
            toast.error('Payment sent but failed to update status. Please refresh the page.', {
              duration: 5000,
            });
            setIsProcessing(false);
            // Don't reset hasMarkedPaid to prevent the effect from running again
            // The payment listener script should eventually catch it
          }
        }
      };
      
      updateStatus();
    } else {
      console.log('[PaymentRequestCard] ⏭️ Skipping status update - conditions not met', {
        isSuccess,
        hasHash: !!hash,
        isPaid,
        hasMarkedPaid,
        hasAddress: !!address,
        isUpdating: isUpdatingStatusRef.current,
        reason: !isSuccess ? 'Transaction not successful' :
                !hash ? 'No transaction hash' :
                isPaid ? 'Already marked as paid' :
                hasMarkedPaid ? 'Already marked as paid (local)' :
                !address ? 'No address' :
                isUpdatingStatusRef.current ? 'Already updating' : 'Unknown'
      });
    }
    
    // Cleanup function
    return () => {
      // Reset ref if component unmounts
      if (!isSuccess) {
        console.log('[PaymentRequestCard] 🧹 Cleaning up - resetting update ref');
        isUpdatingStatusRef.current = false;
      }
    };
  }, [isSuccess, hash, isPaid, hasMarkedPaid, address, request.id, onPaymentSuccess, localPaidStatus, localTxHash, request.status, request.chain_id]);

  const isLoading = isPending || isConfirming || isProcessing;

  // Debug logging for state changes (placed after isLoading is defined)
  useEffect(() => {
    console.log('[PaymentRequestCard] 📊 State update', {
      requestId: request.id,
      requestStatus: request.status,
      localPaidStatus,
      localTxHash,
      isPaid,
      isOpen,
      hasMarkedPaid,
      isSuccess,
      hash,
      address,
      isProcessing,
      isLoading,
      isPending,
      isConfirming,
    });
  }, [request.id, request.status, localPaidStatus, localTxHash, isPaid, isOpen, hasMarkedPaid, isSuccess, hash, address, isProcessing, isLoading, isPending, isConfirming]);

  return (
    <>
      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Cancel Payment Request</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Are you sure you want to cancel this payment request? This action cannot be undone.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-900">
                    {formatAmount(request.amount)} {request.token_symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Network:</span>
                  <span className="font-medium text-gray-700">{request.chain_name}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep Request
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Request'}
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="bg-white flex flex-col border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
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
              <span className="font-medium">
                Requested by {request.requester_username ? `@${request.requester_username}` : formatAddress(request.requester_address)}
              </span>
            </div>
            {isPaid && request.paid_by && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">
                    Paid by {request.paid_by_username ? `@${request.paid_by_username}` : formatAddress(request.paid_by)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action buttons and verification - combined in one section */}
          <div className="pt-4 space-y-4">
            {/* Accept & Send button, Cancel button, and Share button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const shouldShowButton = isOpen && !isPaid;
                  console.log('[PaymentRequestCard] 🔘 Button visibility check', {
                    isOpen,
                    isPaid,
                    localPaidStatus,
                    requestStatus: request.status,
                    shouldShowButton,
                    isLoading,
                    isConnected,
                    requestId: request.id
                  });
                  return shouldShowButton;
                })() && (
                  <>
                    {isOwnRequest ? (
                      <button
                        onClick={handleCancelClick}
                        disabled={isCancelling || !isConnected}
                        className="px-5 py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 active:scale-[0.98] shadow-sm hover:shadow-md"
                      >
                        {isCancelling ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Cancelling...
                          </span>
                        ) : (
                          'Cancel Request'
                        )}
                      </button>
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

            {/* Transaction verification for paid requests - integrated into same card */}
            {isPaid && (localTxHash || request.tx_hash) && (
              <div className="bg-[#00D07E]/5 border border-[#00D07E]/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00D07E]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h4 className="text-sm font-semibold text-gray-900">Payment Completed</h4>
                </div>
                <p className="text-xs text-gray-600">
                  Your payment has been successfully processed. Verify the transaction on the blockchain explorer.
                </p>
                <a
                  href={getChainConfig(typeof request.chain_id === 'string' ? request.chain_id : request.chain_id)?.explorer 
                    ? `${getChainConfig(typeof request.chain_id === 'string' ? request.chain_id : request.chain_id)!.explorer}/tx/${localTxHash || request.tx_hash}`
                    : `https://basescan.org/tx/${localTxHash || request.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2952FF] text-white rounded-lg hover:bg-[#1a3dcc] font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Verify Transaction</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <div className="pt-2 border-t border-[#00D07E]/10">
                  <p className="text-[10px] text-gray-500 font-mono break-all">
                    TX: {(localTxHash || request.tx_hash)?.slice(0, 20)}...{(localTxHash || request.tx_hash)?.slice(-10)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

