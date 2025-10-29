'use client';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-black rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-black border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">How <span className="bg-gradient-to-r from-[#2952FF] to-[#00D07E] bg-clip-text text-transparent">nusense</span> Works</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[#00D07E]/20 text-[#00D07E] rounded-full flex items-center justify-center font-bold text-lg">
              1
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Choose Your Stance</h3>
              <p className="text-gray-400">
                Browse opinion markets and find topics you care about. Each market presents a statement 
                you can either agree or disagree with.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[#00D07E]/20 text-[#00D07E] rounded-full flex items-center justify-center font-bold text-lg">
              2
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Stake Your Position</h3>
              <p className="text-gray-400">
                Choose Agree or Disagree and enter the amount you want to stake in USDC. 
                The minimum stake is 1 USDC.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[#00D07E]/20 text-[#00D07E] rounded-full flex items-center justify-center font-bold text-lg">
              3
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Blind Voting Period</h3>
              <p className="text-gray-400">
                Once you place your stake, voting is blind. You won't be able to see which side is 
                winning until the market closes after 24 hours.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[#00D07E]/20 text-[#00D07E] rounded-full flex items-center justify-center font-bold text-lg">
              4
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Market Resolution</h3>
              <p className="text-gray-400">
                After 24 hours, the market resolves. The winning side is determined by total stake volume. 
                Winners split the losing side's pool.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[#00D07E]/20 text-[#00D07E] rounded-full flex items-center justify-center font-bold text-lg">
              5
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Auto Payouts</h3>
              <p className="text-gray-400">
                If you're on the winning side, you automatically receive proportional payouts to your wallet. 
                We use smart contracts for secure, automated payouts - no claims needed!
              </p>
            </div>
          </div>

          {/* Special Cases */}
          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-3">Special Cases</h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <svg className="w-5 h-5 text-[#00D07E] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-400">
                  <strong>Auto-Refund:</strong> If only one side has stakers, everyone gets a 100% refund with no fees.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <svg className="w-5 h-5 text-[#00D07E] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-400">
                  <strong>Proportional Payouts:</strong> Your winnings are based on your stake as a percentage 
                  of the winning pool.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-black border-t border-gray-800 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#00D07E] text-white rounded-lg hover:bg-[#00D07E]/90 transition-colors font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

