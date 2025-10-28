'use client';

interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

interface CommentsProps {
  marketId: string;
}

export default function Comments({ marketId }: CommentsProps) {
  // This is a placeholder - comments are now integrated in MarketDetailPopup
  return null;
}

