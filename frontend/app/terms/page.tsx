'use client';

import { useEffect, useState } from 'react';

export default function TermsPage() {
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Set date only on client side to avoid hydration mismatch
    setLastUpdated(new Date().toLocaleDateString());
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Terms of Use</h1>
            <p className="text-gray-600 text-sm">
              <strong>Last Updated:</strong> {lastUpdated || 'Loading...'}
            </p>
          </div>

          <section>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Blockbook. These Terms of Use ("Terms") govern your access to and use of the Blockbook platform 
              ("Platform", "Service", "we", "us", or "our"). By using Blockbook, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              By accessing or using Blockbook, you acknowledge that you have read, understood, and agree to be bound by 
              these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed text-sm mb-2">
              Blockbook is a non-custodial cryptocurrency payment platform that enables:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-4">
              <li>Creating and managing payment requests</li>
              <li>Sending and receiving direct cryptocurrency payments</li>
              <li>Managing user profiles and payment history</li>
              <li>Interacting with multiple blockchain networks</li>
            </ul>
            <p className="text-gray-700 leading-relaxed text-sm mt-3">
              Blockbook does not hold, custody, or control your cryptocurrency. All transactions occur directly between 
              user wallets through blockchain networks.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">3. Eligibility</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              You must be at least 18 years old and have the legal capacity to enter into contracts in your jurisdiction. 
              You are responsible for ensuring that your use of Blockbook complies with all applicable laws and regulations 
              in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">4. User Accounts</h2>
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

          <section>
            <h2 className="text-xl font-bold text-black mb-3">5. Wallet Connection</h2>
            <div className="space-y-2 text-gray-700 text-sm">
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
            <h2 className="text-xl font-bold text-black mb-3">6. Payments and Transactions</h2>
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
                <strong>6.4 No Refunds:</strong> Blockbook does not process refunds. All transactions are final once 
                confirmed on the blockchain.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">7. Prohibited Uses</h2>
            <p className="text-gray-700 leading-relaxed text-sm mb-2">
              You agree not to use Blockbook to:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Engage in fraud, money laundering, or other illegal activities</li>
              <li>Impersonate others or provide false information</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service for any purpose that could harm Blockbook or its users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">8. Smart Contracts</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              Blockbook uses smart contracts deployed on various blockchain networks. While we strive to use audited and 
              secure contracts, smart contracts are experimental technology. You acknowledge the risks associated with 
              smart contract interactions, including potential bugs, vulnerabilities, or failures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">9. Disclaimers</h2>
            <div className="space-y-2 text-gray-700 text-sm">
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
            <h2 className="text-xl font-bold text-black mb-3">10. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              To the maximum extent permitted by law, Blockbook and its operators shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether 
              incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting 
              from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">11. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              You agree to indemnify, defend, and hold harmless Blockbook and its operators from any claims, damages, 
              losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation 
              of these Terms, or infringement of any rights of another.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">12. Modifications to Terms</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via 
              email or through the Service. Your continued use of Blockbook after changes become effective constitutes 
              acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">13. Termination</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              We may suspend or terminate your access to Blockbook at any time, with or without cause or notice, for any 
              reason including violation of these Terms. You may stop using the Service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">14. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              If you have questions about these Terms, please contact us through the platform or at the contact 
              information provided in our Privacy Policy.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

