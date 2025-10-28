'use client';

// Mock data to display when database is not connected
export const mockMarkets = [
  // Resolved markets
  {
    id: 'resolved-1',
    title: 'Drake > Kendrick Lamar',
    description: 'Who has better overall catalog and flow? Drake with his commercial success or Kendrick with his lyrical mastery?',
    category: 'music',
    creator_address: '0x742d35...0bEb',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    total_agree_stakes: 125000.50,
    total_disagree_stakes: 98750.25,
    status: 'resolved',
    winner: 1,
    resolved: true
  },
  {
    id: 'resolved-2',
    title: 'Taylor Swift is the greatest pop artist of all time',
    description: 'Her longevity, album sales, and cultural impact make her unmatched in pop music history.',
    category: 'music',
    creator_address: '0x5c0d3b...4a6',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    total_agree_stakes: 87500.00,
    total_disagree_stakes: 112500.50,
    status: 'resolved',
    winner: 1,
    resolved: true
  },
  {
    id: 'resolved-3',
    title: 'The Sopranos > Breaking Bad',
    description: 'Which TV series is the better crime drama masterpiece?',
    category: 'pop-culture',
    creator_address: '0x2b4d6f...f2b',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    total_agree_stakes: 67890.00,
    total_disagree_stakes: 85620.50,
    status: 'resolved',
    winner: 2,
    resolved: true
  },
  // Active markets
  {
    id: '1',
    title: 'Drake > Kendrick Lamar',
    description: 'Who has better overall catalog and flow? Drake with his commercial success or Kendrick with his lyrical mastery?',
    category: 'music',
    creator_address: '0x742d35...0bEb',
    created_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
    total_agree_stakes: 125000.50,
    total_disagree_stakes: 98750.25,
    status: 'active',
    resolved: false
  },
  {
    id: '2',
    title: 'Tesla is the most innovative car company',
    description: 'Does Tesla lead the industry in innovation, or are legacy automakers catching up?',
    category: 'other',
    creator_address: '0x8ba1f1...C1c',
    created_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    total_agree_stakes: 245000.00,
    total_disagree_stakes: 189250.75,
    status: 'active',
    resolved: false
  },
  {
    id: '3',
    title: 'Taylor Swift is the greatest pop artist of all time',
    description: 'Her longevity, album sales, and cultural impact make her unmatched in pop music history.',
    category: 'music',
    creator_address: '0x5c0d3b...4a6',
    created_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    total_agree_stakes: 87500.00,
    total_disagree_stakes: 112500.50,
    status: 'active',
    resolved: false
  },
  {
    id: '4',
    title: 'LeBron James > Michael Jordan',
    description: 'The GOAT debate continues. LeBron vs MJ based on career achievements and dominance.',
    category: 'sports',
    creator_address: '0x3a7b9c...a1b',
    created_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString(),
    total_agree_stakes: 156250.25,
    total_disagree_stakes: 231500.00,
    status: 'active',
    resolved: false
  },
  {
    id: '5',
    title: 'Tom Brady > Aaron Rodgers',
    description: 'Who is the better quarterback? The GOAT with 7 rings or Rodgers with superior arm talent?',
    category: 'sports',
    creator_address: '0x9f8e7d...f0',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    total_agree_stakes: 98750.50,
    total_disagree_stakes: 134250.75,
    status: 'resolved',
    winner: 2,
    resolved: true
  },
  {
    id: '6',
    title: 'The Sopranos > Breaking Bad',
    description: 'Which TV series is the better crime drama masterpiece?',
    category: 'pop-culture',
    creator_address: '0x2b4d6f...f2b',
    created_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
    total_agree_stakes: 67890.00,
    total_disagree_stakes: 85620.50,
    status: 'active',
    resolved: false
  }
];

