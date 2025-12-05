'use client';

import { getUserGradient, getUserInitials, getAvatarStyle } from '@/lib/userAvatar';

interface UserAvatarProps {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  email?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
};

export default function UserAvatar({
  userId,
  firstName,
  lastName,
  username,
  email,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const gradient = getUserGradient(userId);
  const initials = getUserInitials(firstName, lastName, username, email);
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
      style={getAvatarStyle(gradient)}
    >
      {initials}
    </div>
  );
}

