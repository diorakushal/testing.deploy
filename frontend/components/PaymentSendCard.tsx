'use client';

import { getChainConfig } from '@/lib/tokenConfig';

interface PaymentSendCardProps {
  send: {
    id: string;
    sender_address: string;
    sender_user_id?: string | null;
    sender_username?: string | null;
    sender_first_name?: string | null;
    sender_last_name?: string | null;
    recipient_address: string;
    recipient_user_id?: string | null;
    recipient_username?: string | null;
    recipient_first_name?: string | null;
    recipient_last_name?: string | null;
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
  userId?: string | null;
}

export default function PaymentSendCard({ send, userAddress, userId }: PaymentSendCardProps) {
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

  const formatName = (username?: string | null, firstName?: string | null, lastName?: string | null, fallback?: string | null) => {
    if (username) {
      return `@${username}`;
    }
    if (firstName || lastName) {
      return [firstName, lastName].filter(Boolean).join(' ');
    }
    return fallback || '';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks}w`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months}mo`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years}y`;
    }
  };

  const isConfirmed = send.status === 'confirmed' || send.confirmed_at;
  const currentUserAddress = userAddress?.toLowerCase();
  const isSentByMe = currentUserAddress === send.sender_address?.toLowerCase() || (userId && send.sender_user_id && userId === send.sender_user_id);
  const isReceivedByMe = currentUserAddress === send.recipient_address?.toLowerCase() || (userId && send.recipient_user_id && userId === send.recipient_user_id);

  const getExplorerUrl = () => {
    const chainIdNum = typeof send.chain_id === 'string' ? parseInt(send.chain_id) : send.chain_id;
    return getChainConfig(chainIdNum)?.explorer || '#';
  };

  return (
    <div className="bg-white flex flex-col border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
      <div className="px-6 py-4">
        {/* Header with Type */}
        <div className="flex items-start justify-between mb-4">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 tracking-wide uppercase">
            Crypto Send
          </span>
        </div>
        
        {/* Main Transaction Info - Feed Style */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {/* Transaction Description */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {isSentByMe ? (
                <span className="text-sm text-gray-900">
                  You paid {formatName(send.recipient_username, send.recipient_first_name, send.recipient_last_name) || formatAddress(send.recipient_address)} <span className="text-xs text-gray-500">on {send.chain_name}</span>
                </span>
              ) : isReceivedByMe ? (
                <span className="text-sm text-gray-900">
                  {formatName(send.sender_username, send.sender_first_name, send.sender_last_name) || formatAddress(send.sender_address)} paid you <span className="text-xs text-gray-500">on {send.chain_name}</span>
                </span>
              ) : (
                <span className="text-sm text-gray-900">
                  {formatName(send.sender_username, send.sender_first_name, send.sender_last_name) || formatAddress(send.sender_address)} paid {formatName(send.recipient_username, send.recipient_first_name, send.recipient_last_name) || formatAddress(send.recipient_address)} <span className="text-xs text-gray-500">on {send.chain_name}</span>
                </span>
              )}
            </div>
            
            {/* Time ago */}
            <p className="text-xs text-gray-500 mb-1">
              {formatTimeAgo(send.created_at)}
            </p>
            
            {/* Caption */}
            {send.caption && (
              <p className="text-sm text-gray-900 font-medium mb-1 mt-1">
                {send.caption}
              </p>
            )}
          </div>
          
          {/* Amount - Right aligned */}
          <div className="text-right">
            <div className={`text-base font-semibold ${isSentByMe ? 'text-red-600' : 'text-green-600'}`}>
              {isSentByMe ? '-' : '+'} {formatAmount(send.amount)} {send.token_symbol}
            </div>
            {send.tx_hash && (
              <a
                href={`${getExplorerUrl()}/tx/${send.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 font-mono hover:text-gray-700 hover:underline transition-colors mt-1 block"
              >
                TX: {send.tx_hash.slice(0, 20)}...{send.tx_hash.slice(-10)}
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
