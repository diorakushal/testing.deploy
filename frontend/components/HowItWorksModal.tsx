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
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black">How NUMO Works</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-8">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 text-green-700 ring-1 ring-green-200 shadow-sm flex items-center justify-center font-semibold">
              1
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black tracking-tight mb-1.5">Choose Your Stance</h3>
              <p className="text-gray-600">
                Browse opinion markets and find topics you care about. Each market presents a
                statement you can either agree or disagree with.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 text-green-700 ring-1 ring-green-200 shadow-sm flex items-center justify-center font-semibold">
              2
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black tracking-tight mb-1.5">Stake Your Position</h3>
              <p className="text-gray-600">
                Choose Agree or Disagree and enter the amount you want to stake in USDC or USDT.
                The minimum stake is $1 USDC.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 text-green-700 ring-1 ring-green-200 shadow-sm flex items-center justify-center font-semibold">
              3
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black tracking-tight mb-1.5">Blind Voting Period</h3>
              <p className="text-gray-600">
                Once you place your stake, voting is blind. You won't be able to see which side is
                winning until the market closes after 24 hours. This prevents herding and ensures
                you vote based on conviction, not hype.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 text-green-700 ring-1 ring-green-200 shadow-sm flex items-center justify-center font-semibold">
              4
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black tracking-tight mb-1.5">Market Resolution</h3>
              <p className="text-gray-600 mb-3">
                After 24 hours, the market resolves based on the collective stakes of all
                participants. No randomness. No oracle. Just you and everyone else putting your
                money where your mouth is.
              </p>
              <p className="text-gray-800 font-semibold mb-1">THE PEOPLE DECIDE.</p>
              <p className="text-gray-600 mb-3">
                The algorithm simply reflects their collective belief. The outcome reflects where
                participants collectively put their conviction:
              </p>
              <ul className="space-y-2 ml-1">
                <li className="text-gray-700 flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  <span>Total capital staked by participants on each side</span>
                </li>
                <li className="text-gray-700 flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  <span>Number of unique participants backing each side</span>
                </li>
                <li className="text-gray-700 flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  <span>Average conviction (bet size) per participant</span>
                </li>
                <li className="text-gray-700 flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  <span>How evenly distributed stakes are across participants</span>
                </li>
              </ul>
              <p className="text-gray-600 mt-3">
                The exact weighting between these factors is proprietary to ensure fair markets and
                prevent manipulation.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 text-green-700 ring-1 ring-green-200 shadow-sm flex items-center justify-center font-semibold">
              5
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black tracking-tight mb-1.5">Auto Payouts</h3>
              <p className="text-gray-600">
                If you're on the winning side, you automatically receive proportional payouts to
                your wallet. We use smart contracts for secure, automated payouts—no claims
                needed.
              </p>
              <p className="text-gray-600 mt-2">
                Your winnings = (Your stake ÷ Winning pool total) × Losing pool × 97%
                <span className="block text-xs text-gray-500">(We take 3% platform fee)</span>
              </p>
            </div>
          </div>

          {/* Why This Isn't Gambling */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-black mb-3 flex items-center gap-2">
              <span className="text-[#00D07E]">✓</span>
              Why This Isn't Gambling
            </h3>
            <ul className="space-y-3 ml-1">
              <li className="text-gray-700 flex items-start gap-2">
                <svg className="w-4 h-4 text-green-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                <span>Outcome is determined by THE PEOPLE'S stakes, not random chance</span>
              </li>
              <li className="text-gray-700 flex items-start gap-2">
                <svg className="w-4 h-4 text-green-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                <span>Winner = where conviction and capital pooled</span>
              </li>
              <li className="text-gray-700 flex items-start gap-2">
                <svg className="w-4 h-4 text-green-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                <span>Based on predicting social consensus (skill, not luck)</span>
              </li>
              <li className="text-gray-700 flex items-start gap-2">
                <svg className="w-4 h-4 text-green-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                <span>All calculations verifiable on-chain</span>
              </li>
              <li className="text-gray-700 flex items-start gap-2">
                <svg className="w-4 h-4 text-green-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                <span>Similar legal precedent to fantasy sports</span>
              </li>
            </ul>
            <p className="text-gray-600 mt-2">
              You're not gambling. You're predicting what others believe.
            </p>
          </div>

          {/* Special Cases */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-black mb-3">Special Cases</h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <span className="text-[#00D07E] mt-0.5">•</span>
                <p className="text-gray-600">
                  <strong className="text-black">Auto-Refund:</strong> If only one side has stakers (no opposition), everyone gets a 100% refund with no fees.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-[#00D07E] mt-0.5">•</span>
                <p className="text-gray-600">
                  <strong className="text-black">Proportional Payouts:</strong> Your winnings are based on your stake as a percentage of the winning pool, minus our 3% platform fee.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 space-y-1">
                <div className="font-semibold mb-1">Example</div>
                <div>Market volume: $387,750</div>
                <div>AGREE: $215,000 (winning side)</div>
                <div>DISAGREE: $172,750 (losing side)</div>
                <div className="mt-2">You staked: $100 on AGREE</div>
                <div className="mt-1">Your payout:</div>
                <div className="font-mono">($100 ÷ $215,000) × $172,750 × 0.97 = $77.43</div>
                <div className="mt-2">Total received:</div>
                <div className="font-mono">$100 (stake) + $77.43 (winnings) = $177.43</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
