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
          <h2 className="text-2xl font-bold text-black">How Xelli Works</h2>
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
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200 shadow-sm flex items-center justify-center font-semibold">
              1
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black tracking-tight mb-1.5">The requester generates a Xelli link</h3>
              <p className="text-gray-600 mb-2">
                They choose:
              </p>
              <ul className="text-gray-600 space-y-1 ml-4 list-disc">
                <li>Amount</li>
                <li>Token</li>
                <li>Chain</li>
                <li>Their receiving wallet</li>
              </ul>
              <p className="text-gray-600 mt-2">
                Xelli produces a shareable link.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200 shadow-sm flex items-center justify-center font-semibold">
              2
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black tracking-tight mb-1.5">The payer clicks the link</h3>
              <p className="text-gray-600 mb-2">
                Your Xelli popup:
              </p>
              <ul className="text-gray-600 space-y-1 ml-4 list-disc">
                <li>Opens automatically</li>
                <li>Detects wallet</li>
                <li>Detects correct chain</li>
                <li>Auto-switches wallet to that chain</li>
                <li>Prepares the exact transaction</li>
                <li>Payer just taps "Pay"</li>
              </ul>
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
