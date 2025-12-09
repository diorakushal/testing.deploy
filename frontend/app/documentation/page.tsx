'use client';

export default function DocumentationPage() {

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          {/* Overview */}
          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Overview</h2>
            <p className="text-gray-700 leading-relaxed">
              Blockbook is a non-custodial cryptocurrency payment platform that enables seamless wallet-to-wallet transactions. 
              Create payment requests, send direct payments, and manage your crypto payments across multiple blockchain networks.
            </p>
          </section>

          {/* Getting Started */}
          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Getting Started</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-black mb-1">1. Create an Account</h3>
                <p className="text-gray-700 text-sm">
                  Sign up with your email and create a unique username. Your account is linked to your wallet address for seamless payments.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-1">2. Connect Your Wallet</h3>
                <p className="text-gray-700 text-sm">
                  Connect your MetaMask, WalletConnect, or other supported wallet. The platform supports multiple chains and will automatically switch networks when needed.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-1">3. Start Using</h3>
                <p className="text-gray-700 text-sm">
                  Navigate to the "Pay" or "Request" pages to create payment requests or send payments to other users.
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-black mb-2">Payment Requests</h3>
                <p className="text-gray-700 text-sm">
                  Create payment requests with custom amounts and notes. Anyone can accept and pay directly to your wallet.
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-black mb-2">Direct Payments</h3>
                <p className="text-gray-700 text-sm">
                  Send payments directly to recipient wallets. Instant transfers with no escrow delays.
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-black mb-2">Multi-Chain Support</h3>
                <p className="text-gray-700 text-sm">
                  Supports Base, Ethereum, BNB Chain, and Polygon. Automatic chain switching for seamless transactions.
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-black mb-2">User Profiles</h3>
                <p className="text-gray-700 text-sm">
                  Each user has a unique profile with username. Send payments using @username instead of wallet addresses.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section>
            <h2 className="text-2xl font-bold text-black mb-3">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-1">Request Payments</h3>
                  <p className="text-gray-700 text-sm">
                    Go to "Request" page. Enter the amount, select a chain and token (USDC by default), 
                    optionally specify a recipient by @username, add a note, and post your request.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-1">Accept & Pay</h3>
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
                  <h3 className="font-semibold text-black mb-1">Send Payments</h3>
                  <p className="text-gray-700 text-sm">
                    Use "Pay" page to send direct payments. Enter recipient @username, amount, 
                    and optional note. Payments are sent instantly to the recipient's wallet.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-1">Track Activity</h3>
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
            <h2 className="text-2xl font-bold text-black mb-3">Supported Chains & Tokens</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-black mb-2">Blockchain Networks</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Base (Chain ID: 8453)</li>
                  <li>Ethereum (Chain ID: 1)</li>
                  <li>BNB Chain (Chain ID: 56)</li>
                  <li>Polygon (Chain ID: 137)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-2">Supported Tokens</h3>
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
            <h2 className="text-2xl font-bold text-black mb-3">Security & Privacy</h2>
            <div className="space-y-2 text-gray-700 text-sm">
              <p><strong>Non-custodial:</strong> We never hold your funds. All transactions are wallet-to-wallet.</p>
              <p><strong>Direct Transfers:</strong> Payments are sent directly wallet-to-wallet using standard ERC-20 transfers.</p>
              <p><strong>Private Keys:</strong> Your private keys never leave your wallet. We never have access to them.</p>
              <p><strong>Instant Settlement:</strong> Payments are completed immediately upon transaction confirmation.</p>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Tips & Best Practices</h2>
            <ul className="space-y-2 text-gray-700 text-sm list-disc list-inside">
              <li>Always verify the recipient's @username before sending payments</li>
              <li>Double-check the amount and chain before confirming transactions</li>
              <li>Keep your wallet connected for seamless chain switching</li>
              <li>Add descriptive notes to payment requests for context</li>
              <li>Monitor your Activity feed to track all payment requests</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

