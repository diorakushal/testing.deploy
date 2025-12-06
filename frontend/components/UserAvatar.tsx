'use client';

import { getUserGradient, getUserInitials, getAvatarStyle, getProfileIcon } from '@/lib/userAvatar';

interface UserAvatarProps {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  email?: string | null;
  profileImageUrl?: string | null; // Number 0-7 from database
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
  profileImageUrl,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const gradient = getUserGradient(userId);
  const initials = getUserInitials(firstName, lastName, username, email);
  const sizeClass = sizeClasses[size];

  // Get profile icon based on profileImageUrl (0-7) or fallback to gradient with initials
  // Handle both string and number types, and empty strings
  const profileIcon = profileImageUrl !== null && profileImageUrl !== undefined && profileImageUrl !== ''
    ? getProfileIcon(typeof profileImageUrl === 'string' ? parseInt(profileImageUrl, 10) : profileImageUrl)
    : null;

  // If user has a profile icon, use it; otherwise use gradient with initials
  if (profileIcon) {
    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
        style={{
          background: profileIcon.background,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <span className="text-white" style={{ fontSize: size === 'sm' ? '16px' : size === 'md' ? '20px' : size === 'lg' ? '24px' : '32px' }}>
          {profileIcon.icon}
        </span>
      </div>
    );
  }

  // Fallback to gradient with initials
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
      style={getAvatarStyle(gradient)}
    >
      {initials}
    </div>
  );
}

