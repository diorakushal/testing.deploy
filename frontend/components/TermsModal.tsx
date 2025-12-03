'use client';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
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
          <h2 className="text-lg font-bold text-black tracking-tight">Terms of Use</h2>
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
            {/* Introduction */}
            <section>
              <p className="text-gray-700 leading-relaxed text-sm">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Welcome to Xelli. These Terms of Use ("Terms") govern your access to and use of the Xelli platform 
                ("Platform", "Service", "we", "us", or "our"). By using Xelli, you agree to be bound by these Terms.
              </p>
            </section>

            {/* Acceptance */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">1. Acceptance of Terms</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                By accessing or using Xelli, you acknowledge that you have read, understood, and agree to be bound by 
                these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use the Service.
              </p>
            </section>

            {/* Description of Service */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">2. Description of Service</h3>
              <p className="text-gray-700 leading-relaxed text-sm mb-2">
                Xelli is a non-custodial cryptocurrency payment platform that enables:
              </p>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-4">
                <li>Creating and managing payment requests</li>
                <li>Sending and receiving direct cryptocurrency payments</li>
                <li>Managing user profiles and payment history</li>
                <li>Interacting with multiple blockchain networks</li>
              </ul>
              <p className="text-gray-700 leading-relaxed text-sm mt-3">
                Xelli does not hold, custody, or control your cryptocurrency. All transactions occur directly between 
                user wallets through blockchain networks.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">3. Eligibility</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                You must be at least 18 years old and have the legal capacity to enter into contracts in your jurisdiction. 
                You are responsible for ensuring that your use of Xelli complies with all applicable laws and regulations 
                in your jurisdiction.
              </p>
            </section>

            {/* User Accounts */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">4. User Accounts</h3>
              <div className="space-y-2 text-gray-700 text-sm">
                <p>
                  <strong>4.1 Account Creation:</strong> You must provide accurate and complete information when creating 
                  an account. You are responsible for maintaining the security of your account credentials.
                </p>
                <p>
                  <strong>4.2 Username:</strong> You must choose a unique username. Usernames must comply with our 
                  community guidelines and cannot be offensive, misleading, or infringe on others' rights.
                </p>
                <p>
                  <strong>4.3 Account Responsibility:</strong> You are solely responsible for all activities that occur 
                  under your account. You must immediately notify us of any unauthorized use of your account.
                </p>
              </div>
            </section>

            {/* Wallet Connection */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">5. Wallet Connection</h3>
              <div className="space-y-2 text-gray-700 text-sm">
                <p>
                  <strong>5.1 Wallet Security:</strong> You are solely responsible for the security of your connected 
                  cryptocurrency wallet and private keys. Xelli never has access to your private keys or wallet funds.
                </p>
                <p>
                  <strong>5.2 Network Fees:</strong> All blockchain network fees (gas fees) are your responsibility. 
                  Xelli does not charge additional fees for transactions, but network fees apply to all on-chain operations.
                </p>
                <p>
                  <strong>5.3 Chain Switching:</strong> Xelli may automatically switch your wallet to the required 
                  blockchain network. You must approve all network switches and transactions in your wallet.
                </p>
              </div>
            </section>

            {/* Payments */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">6. Payments and Transactions</h3>
              <div className="space-y-2 text-gray-700 text-sm">
                <p>
                  <strong>6.1 Payment Requests:</strong> When you create a payment request, you authorize others to send 
                  payments to your wallet address. Payment requests are public and can be accepted by anyone.
                </p>
                <p>
                  <strong>6.2 Direct Payments:</strong> Payments are sent directly to recipient wallet addresses. 
                  Once confirmed on the blockchain, payments cannot be reversed. Always verify recipient addresses before sending.
                </p>
                <p>
                  <strong>6.3 Irreversibility:</strong> Cryptocurrency transactions are irreversible once confirmed on 
                  the blockchain. You are solely responsible for verifying recipient addresses and payment amounts.
                </p>
                <p>
                  <strong>6.4 No Refunds:</strong> Xelli does not process refunds. All transactions are final once 
                  confirmed on the blockchain.
                </p>
              </div>
            </section>

            {/* Prohibited Uses */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">7. Prohibited Uses</h3>
              <p className="text-gray-700 leading-relaxed text-sm mb-2">
                You agree not to use Xelli to:
              </p>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Engage in fraud, money laundering, or other illegal activities</li>
                <li>Impersonate others or provide false information</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Use the Service for any purpose that could harm Xelli or its users</li>
              </ul>
            </section>

            {/* Smart Contracts */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">8. Smart Contracts</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                Xelli uses smart contracts deployed on various blockchain networks. While we strive to use audited and 
                secure contracts, smart contracts are experimental technology. You acknowledge the risks associated with 
                smart contract interactions, including potential bugs, vulnerabilities, or failures.
              </p>
            </section>

            {/* Disclaimers */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">9. Disclaimers</h3>
              <div className="space-y-2 text-gray-700 text-sm">
                <p>
                  <strong>9.1 No Warranty:</strong> Xelli is provided "as is" and "as available" without warranties of 
                  any kind, either express or implied.
                </p>
                <p>
                  <strong>9.2 Blockchain Risks:</strong> You acknowledge the inherent risks of blockchain technology, 
                  including network congestion, high fees, and potential network failures.
                </p>
                <p>
                  <strong>9.3 Third-Party Services:</strong> Xelli integrates with third-party wallet providers and 
                  blockchain networks. We are not responsible for their services or any issues arising from their use.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">10. Limitation of Liability</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                To the maximum extent permitted by law, Xelli and its operators shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether 
                incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting 
                from your use of the Service.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">11. Indemnification</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                You agree to indemnify, defend, and hold harmless Xelli and its operators from any claims, damages, 
                losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation 
                of these Terms, or infringement of any rights of another.
              </p>
            </section>

            {/* Modifications */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">12. Modifications to Terms</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                We reserve the right to modify these Terms at any time. We will notify users of material changes via 
                email or through the Service. Your continued use of Xelli after changes become effective constitutes 
                acceptance of the modified Terms.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">13. Termination</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                We may suspend or terminate your access to Xelli at any time, with or without cause or notice, for any 
                reason including violation of these Terms. You may stop using the Service at any time.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h3 className="text-lg font-bold text-black mb-3">14. Contact Information</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                If you have questions about these Terms, please contact us through the platform or at the contact 
                information provided in our Privacy Policy.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold text-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

