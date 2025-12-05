'use client';

import { useState } from 'react';
import { getChainConfig } from '@/lib/tokenConfig';

interface PaymentSendCardProps {
  send: {
    id: string;
    sender_address: string;
    sender_user_id?: string | null;
    sender_username?: string | null;
    recipient_address: string;
    recipient_user_id?: string | null;
    recipient_username?: string | null;
    amount: string | number;
    token_symbol: string;
    token_address: string;
    chain_id: number | string;
    chain_name: string;
    caption: string | null;
    status: string;
    tx_hash?: string | null;
    created_at: string;
    sent_at?: string | null;
    confirmed_at?: string | null;
  };
  userAddress?: string;
}

export default function PaymentSendCard({ send, userAddress }: PaymentSendCardProps) {
  const [copied, setCopied] = useState(false);

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num < 0.0001) {
      return num.toFixed(10);
    } else if (num < 1) {
      return num.toFixed(8);
    } else {
      return num.toFixed(2);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const isConfirmed = send.status === 'confirmed' || send.confirmed_at;
  const currentUserAddress = userAddress?.toLowerCase();
  const isSentByMe = currentUserAddress === send.sender_address.toLowerCase();
  const isReceivedByMe = currentUserAddress === send.recipient_address.toLowerCase();

  const handleShare = async () => {
    const url = `${window.location.origin}/feed`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getExplorerUrl = () => {
    const chainIdNum = typeof send.chain_id === 'string' ? parseInt(send.chain_id) : send.chain_id;
    return getChainConfig(chainIdNum)?.explorer || '#';
  };

  return (
    <div className="bg-white flex flex-col border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
      <div className="px-6 py-5">
        {/* Header with Status */}
        <div className="flex items-start justify-between mb-4">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 tracking-wide uppercase">
            Payment Sent
          </span>
          <div className="flex items-center">
            {isConfirmed ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 bg-[#00D07E]/10 text-[#00D07E] border border-[#00D07E]/20">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                CONFIRMED
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                PENDING
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-3">
          {/* Amount and Token */}
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-2xl font-bold text-black tracking-tight">
              {formatAmount(send.amount)} {send.token_symbol}
            </h3>
            <span className="text-sm text-gray-500 font-medium">on {send.chain_name}</span>
          </div>

          {/* Caption */}
          {send.caption && (
            <p className="text-base text-gray-800 leading-relaxed font-medium">
              {send.caption}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-3 pt-1">
            {isSentByMe ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">
                  Sent to {send.recipient_username ? `@${send.recipient_username}` : formatAddress(send.recipient_address)}
                </span>
              </div>
            ) : isReceivedByMe ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">
                  Received from {send.sender_username ? `@${send.sender_username}` : formatAddress(send.sender_address)}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">
                    From {send.sender_username ? `@${send.sender_username}` : formatAddress(send.sender_address)}
                  </span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">
                    To {send.recipient_username ? `@${send.recipient_username}` : formatAddress(send.recipient_address)}
                  </span>
                </div>
              </>
            )}
            <div className="ml-auto">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200 active:scale-[0.98]"
                title="Share payment"
                aria-label="Share payment"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons and verification - combined in one section */}
        <div className="pt-4 space-y-4">
          {/* Payment Completion Confirmation Box */}
          {isConfirmed && send.tx_hash && (
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
                href={`${getExplorerUrl()}/tx/${send.tx_hash}`}
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
                  TX: {send.tx_hash.slice(0, 20)}...{send.tx_hash.slice(-10)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
