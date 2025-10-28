'use client';

interface MarketTableProps {
  markets: any[];
}

export default function MarketTable({ markets }: MarketTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'sports': 'bg-green-100 text-green-700',
      'music': 'bg-purple-100 text-purple-700',
      'politics': 'bg-red-100 text-red-700',
      'pop-culture': 'bg-pink-100 text-pink-700',
      'other': 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors['other'];
  };

  const handleMarketClick = (market: any) => {
    // Handle market click to open detail view
    console.log('Clicked market:', market);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">$ Agrees</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">$ Disagrees</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Data Agrees</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Data Disagrees</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Starts</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ends</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {markets.map((market) => (
              <tr 
                key={market.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleMarketClick(market)}
              >
                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                  {market.title}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getCategoryColor(market.category)}`}>
                    {market.category}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-right text-gray-900 font-medium">
                  ${parseFloat(market.total_agree_stakes).toFixed(2)}
                </td>
                <td className="px-4 py-4 text-sm text-right text-gray-900 font-medium">
                  ${parseFloat(market.total_disagree_stakes).toFixed(2)}
                </td>
                <td className="px-4 py-4 text-sm text-right text-gray-600">
                  {market.agree_count || '0'}
                </td>
                <td className="px-4 py-4 text-sm text-right text-gray-600">
                  {market.disagree_count || '0'}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {formatDate(market.created_at)}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {formatDate(market.ends_at)}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

