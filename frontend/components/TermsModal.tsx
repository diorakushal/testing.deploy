'use client';

import { useEffect, useState } from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Set date only on client side to avoid hydration mismatch
    setLastUpdated(new Date().toLocaleDateString());
  }, []);

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
            <h2 className="text-xl font-bold text-black">Terms of Use</h2>
            <p className="text-gray-600 text-xs mt-1">
              <strong>Last Updated:</strong> {lastUpdated || 'Loading...'}
            </p>
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
        <div className="p-4 space-y-2 flex-1 text-xs overflow-y-auto">
          <section>
            <p className="text-gray-700 leading-relaxed text-xs">
              Welcome to Blockbook. These Terms of Use ("Terms") govern your access to and use of the Blockbook platform 
              ("Platform", "Service", "we", "us", or "our"). By using Blockbook, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-black mb-2">1. Acceptance of Terms</h3>
            <p className="text-gray-700 leading-relaxed text-xs">
              By accessing or using Blockbook, you acknowledge that you have read, understood, and agree to be bound by 
              these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-black mb-2">2. Description of Service</h3>
            <p className="text-gray-700 leading-relaxed text-xs mb-1">
              Blockbook is a non-custodial cryptocurrency payment platform that enables:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-xs space-y-0.5 ml-4">
              <li>Creating and managing payment requests</li>
              <li>Sending and receiving direct cryptocurrency payments</li>
              <li>Managing user profiles and payment history</li>
              <li>Interacting with multiple blockchain networks</li>
            </ul>
            <p className="text-gray-700 leading-relaxed text-xs mt-2">
              Blockbook does not hold, custody, or control your cryptocurrency. All transactions occur directly between 
              user wallets through blockchain networks.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-black mb-2">3. Eligibility</h3>
            <p className="text-gray-700 leading-relaxed text-xs">
              You must be at least 18 years old and have the legal capacity to enter into contracts in your jurisdiction. 
              You are responsible for ensuring that your use of Blockbook complies with all applicable laws and regulations 
              in your jurisdiction.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-black mb-2">4. User Accounts</h3>
            <div className="space-y-1 text-gray-700 text-xs">
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

          <section>
            <h3 className="text-sm font-bold text-black mb-2">5. Wallet Connection</h3>
            <div className="space-y-1 text-gray-700 text-xs">
              <p>
                <strong>5.1 Wallet Security:</strong> You are solely responsible for the security of your connected 
                cryptocurrency wallet and private keys. Blockbook never has access to your private keys or wallet funds.
              </p>
              <p>
                <strong>5.2 Network Fees:</strong> All blockchain network fees (gas fees) are your responsibility. 
                Blockbook does not charge additional fees for transactions, but network fees apply to all on-chain operations.
              </p>
              <p>
                <strong>5.3 Chain Switching:</strong> Blockbook may automatically switch your wallet to the required 
                blockchain network. You must approve all network switches and transactions in your wallet.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-black mb-2">6. Payments and Transactions</h3>
            <div className="space-y-1 text-gray-700 text-xs">
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
                <strong>6.4 No Refunds:</strong> Blockbook does not process refunds. All transactions are final once 
                confirmed on the blockchain.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-black mb-2">7. Prohibited Uses</h3>
            <p className="text-gray-700 leading-relaxed text-xs mb-1">
              You agree not to use Blockbook to:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-xs space-y-0.5 ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Engage in fraud, money laundering, or other illegal activities</li>
              <li>Impersonate others or provide false information</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service for any purpose that could harm Blockbook or its users</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold text-black mb-2">8. Smart Contracts</h3>
            <p className="text-gray-700 leading-relaxed text-xs">
              Blockbook uses smart contracts deployed on various blockchain networks. While we strive to use audited and 
              secure contracts, smart contracts are experimental technology. You acknowledge the risks associated with 
              smart contract interactions, including potential bugs, vulnerabilities, or failures.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-black mb-2">9. Disclaimers</h3>
            <div className="space-y-1 text-gray-700 text-xs">
              <p>
                <strong>9.1 No Warranty:</strong> Blockbook is provided "as is" and "as available" without warranties of 
                any kind, either express or implied.
              </p>
              <p>
                <strong>9.2 Blockchain Risks:</strong> You acknowledge the inherent risks of blockchain technology, 
                including network congestion, high fees, and potential network failures.
              </p>
              <p>
                <strong>9.3 Third-Party Services:</strong> Blockbook integrates with third-party wallet providers and 
                blockchain networks. We are not responsible for their services or any issues arising from their use.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-black mb-2">10. Limitation of Liability</h3>
            <p className="text-gray-700 leading-relaxed text-xs">
              To the maximum extent permitted by law, Blockbook and its operators shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether 
              incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting 
              from your use of the Service.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-black mb-2">11. Indemnification</h3>
            <p className="text-gray-700 leading-relaxed text-xs">
              You agree to indemnify, defend, and hold harmless Blockbook and its operators from any claims, damages, 
              losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation 
              of these Terms, or infringement of any rights of another.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-black mb-2">12. Modifications to Terms</h3>
            <p className="text-gray-700 leading-relaxed text-xs">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via 
              email or through the Service. Your continued use of Blockbook after changes become effective constitutes 
              acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-black mb-2">13. Termination</h3>
            <p className="text-gray-700 leading-relaxed text-xs">
              We may suspend or terminate your access to Blockbook at any time, with or without cause or notice, for any 
              reason including violation of these Terms. You may stop using the Service at any time.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-black mb-2">14. Contact Information</h3>
            <p className="text-gray-700 leading-relaxed text-xs">
              If you have questions about these Terms, please contact us through the platform or at the contact 
              information provided in our Privacy Policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
