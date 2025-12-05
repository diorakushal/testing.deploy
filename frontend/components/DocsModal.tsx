'use client';

import { useEffect } from 'react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocsModal({ isOpen, onClose }: DocsModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-black">Documentation</h2>
            <p className="text-gray-600 text-xs mt-1">Learn how to use Zemme</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2 flex-1 text-xs">
          {/* Overview */}
          <section>
            <h3 className="text-sm font-bold text-black mb-2">Overview</h3>
            <p className="text-gray-700 leading-relaxed text-xs">
              Zemme is a non-custodial cryptocurrency payment platform that enables seamless wallet-to-wallet transactions. 
              Create payment requests, send direct payments, and manage your crypto payments across multiple blockchain networks.
            </p>
          </section>

          {/* Getting Started */}
          <section>
            <h3 className="text-sm font-bold text-black mb-2">Getting Started</h3>
            <div className="space-y-2">
              <div>
                <h4 className="font-semibold text-black mb-1 text-xs">1. Create an Account</h4>
                <p className="text-gray-700 text-xs">
                  Sign up with your email and create a unique username. Your account is linked to your wallet address for seamless payments.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-black mb-1 text-xs">2. Connect Your Wallet</h4>
                <p className="text-gray-700 text-xs">
                  Connect your MetaMask, WalletConnect, or other supported wallet. The platform supports multiple chains and will automatically switch networks when needed.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-black mb-1 text-xs">3. Start Using</h4>
                <p className="text-gray-700 text-xs">
                  Navigate to the "Pay" or "Request" pages to create payment requests or send payments to other users.
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <h3 className="text-sm font-bold text-black mb-2">Key Features</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-black mb-1 text-xs">Payment Requests</h4>
                <p className="text-gray-700 text-xs">
                  Create payment requests with custom amounts and notes. Anyone can accept and pay directly to your wallet.
                </p>
              </div>
              <div className="p-2 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-black mb-1 text-xs">Direct Payments</h4>
                <p className="text-gray-700 text-xs">
                  Send payments directly to recipient wallets. Instant transfers with no escrow delays.
                </p>
              </div>
              <div className="p-2 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-black mb-1 text-xs">Multi-Chain Support</h4>
                <p className="text-gray-700 text-xs">
                  Supports Base, Ethereum, BNB Chain, and Polygon. Automatic chain switching for seamless transactions.
                </p>
              </div>
              <div className="p-2 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-black mb-1 text-xs">User Profiles</h4>
                <p className="text-gray-700 text-xs">
                  Each user has a unique profile with username. Send payments using @username instead of wallet addresses.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section>
            <h3 className="text-sm font-bold text-black mb-2">How It Works</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-0.5 text-xs">Request Payments</h4>
                  <p className="text-gray-700 text-xs">
                    Go to "Request" page. Enter the amount, select a chain and token (USDC by default), 
                    optionally specify a recipient by @username, add a note, and post your request.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-0.5 text-xs">Accept & Pay</h4>
                  <p className="text-gray-700 text-xs">
                    View payment requests in your Activity feed. Click "Accept & Pay" to send the payment. 
                    Your wallet will automatically switch to the correct chain if needed.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-0.5 text-xs">Send Payments</h4>
                  <p className="text-gray-700 text-xs">
                    Use "Pay" page to send direct payments. Enter recipient @username, amount, 
                    and optional note. Payments are sent instantly to the recipient's wallet.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-0.5 text-xs">Track Activity</h4>
                  <p className="text-gray-700 text-xs">
                    View all your payment requests and transactions in the Activity feed. See which requests are open, 
                    paid, or cancelled.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Supported Chains & Tokens */}
          <section>
            <h3 className="text-sm font-bold text-black mb-2">Supported Chains & Tokens</h3>
            <div className="space-y-2">
              <div>
                <h4 className="font-semibold text-black mb-1 text-xs">Blockchain Networks</h4>
                <ul className="list-disc list-inside text-gray-700 text-xs space-y-0.5">
                  <li>Base (Chain ID: 8453)</li>
                  <li>Ethereum (Chain ID: 1)</li>
                  <li>BNB Chain (Chain ID: 56)</li>
                  <li>Polygon (Chain ID: 137)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-black mb-1 text-xs">Supported Tokens</h4>
                <ul className="list-disc list-inside text-gray-700 text-xs space-y-0.5">
                  <li>USDC (USD Coin) - Primary stablecoin</li>
                  <li>USDT (Tether) - Available on select chains</li>
                  <li>More tokens coming soon</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Security */}
          <section>
            <h3 className="text-sm font-bold text-black mb-2">Security & Privacy</h3>
            <div className="space-y-1 text-gray-700 text-xs">
              <p><strong>Non-custodial:</strong> We never hold your funds. All transactions are wallet-to-wallet.</p>
              <p><strong>Direct Transfers:</strong> Payments are sent directly wallet-to-wallet using standard ERC-20 transfers.</p>
              <p><strong>Private Keys:</strong> Your private keys never leave your wallet. We never have access to them.</p>
              <p><strong>Instant Settlement:</strong> Payments are completed immediately upon transaction confirmation.</p>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-sm font-bold text-black mb-2">Tips & Best Practices</h3>
            <ul className="space-y-1 text-gray-700 text-xs list-disc list-inside">
              <li>Always verify the recipient's @username before sending payments</li>
              <li>Double-check the amount and chain before confirming transactions</li>
              <li>Keep your wallet connected for seamless chain switching</li>
              <li>Add descriptive notes to payment requests for context</li>
              <li>Monitor your Activity feed to track all payment requests</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

