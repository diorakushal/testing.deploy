'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, Address, isAddress, formatUnits, decodeEventLog } from 'viem';
import toast from 'react-hot-toast';
import axios from 'axios';
import { ESCROW_ADDRESSES } from '@/lib/escrowConfig';
import { getToken, getChainConfig } from '@/lib/tokenConfig';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Escrow Contract ABI
const ESCROW_ABI = [
  {
    inputs: [{ name: 'paymentId', type: 'uint256' }],
    name: 'claimPayment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'paymentId', type: 'uint256' }],
    name: 'cancelPayment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'paymentId', type: 'uint256' }],
    name: 'getPayment',
    outputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'expiry', type: 'uint64' },
      { name: 'claimed', type: 'bool' },
      { name: 'cancelled', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'paymentId', type: 'uint256' },
      { indexed: true, name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'PaymentClaimed',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'paymentId', type: 'uint256' },
      { indexed: true, name: 'sender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'PaymentCancelled',
    type: 'event'
  }
] as const;

interface EscrowPayment {
  id: string;
  onchain_id: number;
  sender_address: string;
  recipient_address: string;
  chain_id: number;
  token_address: string;
  token_symbol: string;
  amount: string;
  expiry: string | null;
  status: string;
  tx_hash_create: string;
  tx_hash_claim: string | null;
  tx_hash_cancel: string | null;
  created_at: string;
  claimed_at: string | null;
  cancelled_at: string | null;
}

interface EscrowPaymentCardProps {
  payment: EscrowPayment;
  userAddress?: string;
  onUpdate?: () => void;
}

export default function EscrowPaymentCard({ payment, userAddress, onUpdate }: EscrowPaymentCardProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash,
    enabled: !!hash 
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<'claim' | 'cancel' | null>(null);
  const currentUserAddress = address || userAddress;
  const isRecipient = currentUserAddress?.toLowerCase() === payment.recipient_address.toLowerCase();
  const isSender = currentUserAddress?.toLowerCase() === payment.sender_address.toLowerCase();
  const isClaimed = payment.status === 'claimed';
  const isCancelled = payment.status === 'cancelled';
  const isPendingStatus = payment.status === 'pending';

  const token = getToken(payment.token_symbol, payment.chain_id);
  const chain = getChainConfig(payment.chain_id);
  const amountDisplay = token ? formatUnits(BigInt(payment.amount), token.decimals) : payment.amount;

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash && actionType) {
      handleTransactionSuccess(hash, actionType);
    }
  }, [isSuccess, hash, actionType]);

  // Handle transaction errors
  useEffect(() => {
    if (error && actionType) {
      toast.dismiss();
      toast.error(error.message || `Failed to ${actionType} payment`);
      setIsProcessing(false);
      setActionType(null);
    }
  }, [error, actionType]);

  const handleTransactionSuccess = async (txHash: string, type: 'claim' | 'cancel') => {
    try {
      toast.dismiss();
      toast.loading('Syncing payment status...');

      // Sync with backend
      await axios.post(`${API_URL}/escrow-payments/${payment.id}/sync`, {
        txHashClaim: type === 'claim' ? txHash : undefined,
        txHashCancel: type === 'cancel' ? txHash : undefined
      });

      toast.dismiss();
      toast.success(type === 'claim' ? 'Payment claimed successfully!' : 'Payment cancelled successfully!');
      setIsProcessing(false);
      setActionType(null);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      toast.dismiss();
      console.error('Error syncing payment:', error);
      toast.error('Payment processed but failed to sync. Please refresh.');
      setIsProcessing(false);
      setActionType(null);
    }
  };

  const handleClaim = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!isRecipient) {
      toast.error('You are not the recipient of this payment');
      return;
    }

    if (isClaimed) {
      toast.error('Payment already claimed');
      return;
    }

    const escrowAddress = ESCROW_ADDRESSES[payment.chain_id.toString()];
    if (!escrowAddress) {
      toast.error('Escrow contract not found for this chain');
      return;
    }

    // Check if we need to switch chains
    if (payment.chain_id !== chainId && switchChain) {
      try {
        toast.loading('Switching chain...');
        await switchChain({ chainId: payment.chain_id as any });
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.dismiss();
      } catch (error) {
        toast.dismiss();
        toast.error('Failed to switch chain');
        return;
      }
    }

    try {
      setIsProcessing(true);
      setActionType('claim');
      toast.loading('Claiming payment...');

      writeContract({
        address: escrowAddress as Address,
        abi: ESCROW_ABI,
        functionName: 'claimPayment',
        args: [BigInt(payment.onchain_id)],
      });
    } catch (error: any) {
      toast.dismiss();
      console.error('Error claiming payment:', error);
      toast.error(error.message || 'Failed to claim payment');
      setIsProcessing(false);
      setActionType(null);
    }
  };

  const handleCancel = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!isSender) {
      toast.error('You are not the sender of this payment');
      return;
    }

    if (isCancelled || isClaimed) {
      toast.error('Payment cannot be cancelled');
      return;
    }

    const escrowAddress = ESCROW_ADDRESSES[payment.chain_id.toString()];
    if (!escrowAddress) {
      toast.error('Escrow contract not found for this chain');
      return;
    }

    // Check if we need to switch chains
    if (payment.chain_id !== chainId && switchChain) {
      try {
        toast.loading('Switching chain...');
        await switchChain({ chainId: payment.chain_id as any });
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.dismiss();
      } catch (error) {
        toast.dismiss();
        toast.error('Failed to switch chain');
        return;
      }
    }

    try {
      setIsProcessing(true);
      setActionType('cancel');
      toast.loading('Cancelling payment...');

      writeContract({
        address: escrowAddress as Address,
        abi: ESCROW_ABI,
        functionName: 'cancelPayment',
        args: [BigInt(payment.onchain_id)],
      });
    } catch (error: any) {
      toast.dismiss();
      console.error('Error cancelling payment:', error);
      toast.error(error.message || 'Failed to cancel payment');
      setIsProcessing(false);
      setActionType(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold text-black">{amountDisplay}</span>
            <span className="text-lg font-semibold text-gray-600">{payment.token_symbol}</span>
            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
              {chain?.name || `Chain ${payment.chain_id}`}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {isRecipient ? 'From' : 'To'}: {isRecipient ? payment.sender_address.slice(0, 6) + '...' + payment.sender_address.slice(-4) : payment.recipient_address.slice(0, 6) + '...' + payment.recipient_address.slice(-4)}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isClaimed ? 'bg-green-100 text-green-700' :
          isCancelled ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {isClaimed ? 'Claimed' : isCancelled ? 'Cancelled' : 'Pending'}
        </div>
      </div>

      {payment.expiry && (
        <p className="text-xs text-gray-500 mb-4">
          Expires: {new Date(payment.expiry).toLocaleString()}
        </p>
      )}

      <div className="flex gap-2 mt-4">
        {isRecipient && isPendingStatus && (
          <button
            onClick={handleClaim}
            disabled={isProcessing || isPending || isConfirming}
            className="flex-1 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {(isProcessing || isPending || isConfirming) && actionType === 'claim' && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Accept Payment
          </button>
        )}

        {isSender && isPendingStatus && (
          <button
            onClick={handleCancel}
            disabled={isProcessing || isPending || isConfirming}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {(isProcessing || isPending || isConfirming) && actionType === 'cancel' && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Cancel
          </button>
        )}

        {payment.tx_hash_create && (
          <a
            href={`${chain?.explorer || 'https://etherscan.io'}/tx/${payment.tx_hash_create}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            View TX
          </a>
        )}
      </div>
    </div>
  );
}

