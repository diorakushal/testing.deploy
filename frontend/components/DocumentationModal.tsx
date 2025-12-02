'use client';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentationModal({ isOpen, onClose }: DocumentationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col rounded-2xl shadow-xl overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-4 bg-white flex-shrink-0">
          <h2 className="text-lg font-bold text-black tracking-tight">Documentation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto px-6 py-6 flex-1 min-h-0 scrollbar-hide">
          <div className="space-y-6">
            {/* Overview */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">Overview</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                Xelli is a non-custodial cryptocurrency payment platform that enables seamless wallet-to-wallet transactions. 
                Create payment requests, send payments via escrow, and manage your crypto payments across multiple blockchain networks.
              </p>
            </section>

            {/* Getting Started */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">Getting Started</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-black mb-1">1. Create an Account</h4>
                  <p className="text-gray-700 text-sm">
                    Sign up with your email and create a unique username. Your account is linked to your wallet address for seamless payments.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">2. Connect Your Wallet</h4>
                  <p className="text-gray-700 text-sm">
                    Connect your MetaMask, WalletConnect, or other supported wallet. The platform supports multiple chains and will automatically switch networks when needed.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">3. Start Using</h4>
                  <p className="text-gray-700 text-sm">
                    Navigate to the "Pay & Request" tab to create payment requests or send payments to other users.
                  </p>
                </div>
              </div>
            </section>

            {/* Features */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">Key Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200">
                  <h4 className="font-semibold text-black mb-2">Payment Requests</h4>
                  <p className="text-gray-700 text-sm">
                    Create payment requests with custom amounts and notes. Anyone can accept and pay directly to your wallet.
                  </p>
                </div>
                <div className="p-4 border border-gray-200">
                  <h4 className="font-semibold text-black mb-2">Escrow Payments</h4>
                  <p className="text-gray-700 text-sm">
                    Send payments via smart contract escrow. Funds are held securely until the recipient accepts.
                  </p>
                </div>
                <div className="p-4 border border-gray-200">
                  <h4 className="font-semibold text-black mb-2">Multi-Chain Support</h4>
                  <p className="text-gray-700 text-sm">
                    Supports Base, Ethereum, BNB Chain, and Polygon. Automatic chain switching for seamless transactions.
                  </p>
                </div>
                <div className="p-4 border border-gray-200">
                  <h4 className="font-semibold text-black mb-2">User Profiles</h4>
                  <p className="text-gray-700 text-sm">
                    Each user has a unique profile with username. Send payments using @username instead of wallet addresses.
                  </p>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">How It Works</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Request Payments</h4>
                    <p className="text-gray-700 text-sm">
                      Go to "Pay & Request" → "Request" tab. Enter the amount, select a chain and token (USDC by default), 
                      optionally specify a recipient by @username, add a note, and post your request.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Accept & Pay</h4>
                    <p className="text-gray-700 text-sm">
                      View payment requests in your Activity feed. Click "Accept & Pay" to send the payment. 
                      Your wallet will automatically switch to the correct chain if needed.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Send Payments</h4>
                    <p className="text-gray-700 text-sm">
                      Use "Pay & Request" → "Pay" tab to send payments via escrow. Enter recipient @username, amount, 
                      and optional note. Funds are held in escrow until the recipient accepts.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">Track Activity</h4>
                    <p className="text-gray-700 text-sm">
                      View all your payment requests and transactions in the Activity feed. See which requests are open, 
                      paid, or cancelled.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Supported Chains & Tokens */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">Supported Chains & Tokens</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-black mb-2">Blockchain Networks</h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>Base (Chain ID: 8453)</li>
                    <li>Ethereum (Chain ID: 1)</li>
                    <li>BNB Chain (Chain ID: 56)</li>
                    <li>Polygon (Chain ID: 137)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-2">Supported Tokens</h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>USDC (USD Coin) - Primary stablecoin</li>
                    <li>USDT (Tether) - Available on select chains</li>
                    <li>More tokens coming soon</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Security */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">Security & Privacy</h3>
              <div className="space-y-2 text-gray-700 text-sm">
                <p><strong>Non-custodial:</strong> We never hold your funds. All transactions are wallet-to-wallet.</p>
                <p><strong>Smart Contract Escrow:</strong> Payments are secured by audited smart contracts.</p>
                <p><strong>Private Keys:</strong> Your private keys never leave your wallet. We never have access to them.</p>
                <p><strong>User Control:</strong> You can cancel escrow payments if the recipient doesn't accept them.</p>
              </div>
            </section>

            {/* Tips */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">Tips & Best Practices</h3>
              <ul className="space-y-2 text-gray-700 text-sm list-disc list-inside">
                <li>Always verify the recipient's @username before sending payments</li>
                <li>Double-check the amount and chain before confirming transactions</li>
                <li>Keep your wallet connected for seamless chain switching</li>
                <li>Add descriptive notes to payment requests for context</li>
                <li>Monitor your Activity feed to track all payment requests</li>
              </ul>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

