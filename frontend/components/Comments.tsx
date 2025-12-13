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

// DEPRECATED: This component is no longer used
// The platform has pivoted to Blockbook (crypto payment platform)
// Comments functionality has been removed
export default function Comments({ marketId }: CommentsProps) {
  return null;
}

