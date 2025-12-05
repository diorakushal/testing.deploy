/**
 * User Avatar Utility
 * Provides consistent, unique profile icons for each user across the entire site
 * Based on user ID to ensure the same user always gets the same avatar
 */

export interface UserAvatarGradient {
  topLeft: string;
  centerRight: string;
  bottomLeft: string;
}

/**
 * Convert RGB array to hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
}

/**
 * Generate a unique, vibrant color from a seed value
 * Uses HSL color space for better color distribution across the full spectrum
 */
function generateColorFromSeed(seed: number): string {
  // Normalize seed to 0-1 range using sine for smooth distribution
  const normalized = (Math.abs(Math.sin(seed)) * 10000) % 1;
  
  // Generate HSL values for vibrant colors
  // Hue: 0-360 (full color spectrum)
  // Saturation: 60-100% (vibrant colors)
  // Lightness: 40-60% (good visibility)
  const hue = normalized * 360;
  const saturation = 60 + (normalized * 40); // 60-100%
  const lightness = 40 + ((Math.abs(Math.sin(seed * 2)) * 10000) % 1) * 20; // 40-60%
  
  // Convert HSL to RGB
  const c = (1 - Math.abs(2 * (lightness / 100) - 1)) * (saturation / 100);
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = (lightness / 100) - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (hue >= 0 && hue < 60) {
    r = c; g = x; b = 0;
  } else if (hue >= 60 && hue < 120) {
    r = x; g = c; b = 0;
  } else if (hue >= 120 && hue < 180) {
    r = 0; g = c; b = x;
  } else if (hue >= 180 && hue < 240) {
    r = 0; g = x; b = c;
  } else if (hue >= 240 && hue < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return rgbToHex(r, g, b);
}

/**
 * Generate a unique, consistent gradient for a user based on their ID
 * Each user gets a truly unique gradient with vibrant colors from the full spectrum
 * Same user ID will always return the same gradient
 */
export function getUserGradient(userId: string, userMetadata?: any): UserAvatarGradient {
  // Check if user has a saved gradient preference (for backwards compatibility)
  const savedGradient = userMetadata?.gradient_preference;
  if (savedGradient !== undefined && savedGradient >= 0) {
    // If they have a saved preference, use deterministic colors
    const hash = savedGradient * 7919; // Prime multiplier for better distribution
    return {
      topLeft: generateColorFromSeed(hash),
      centerRight: generateColorFromSeed(hash * 2),
      bottomLeft: generateColorFromSeed(hash * 3),
    };
  }
  
  // Generate consistent hash from user ID
  let hash1 = 0;
  let hash2 = 0;
  let hash3 = 0;
  
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash1 = char + ((hash1 << 5) - hash1);
    hash2 = char * (i + 1) + ((hash2 << 7) - hash2);
    hash3 = char * (i + 2) + ((hash3 << 11) - hash3);
  }
  
  // Generate unique vibrant colors for each gradient position
  // Using different hash seeds ensures each position gets a different color
  // Colors span the full spectrum (red, orange, yellow, green, blue, purple, pink, etc.)
  return {
    topLeft: generateColorFromSeed(hash1),
    centerRight: generateColorFromSeed(hash2),
    bottomLeft: generateColorFromSeed(hash3),
  };
}

/**
 * Get user initials from user data
 */
export function getUserInitials(
  firstName?: string | null,
  lastName?: string | null,
  username?: string | null,
  email?: string | null
): string {
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase();
  }
  if (firstName) {
    return firstName[0]?.toUpperCase() || 'U';
  }
  if (username) {
    return username[0]?.toUpperCase() || 'U';
  }
  if (email) {
    return email[0]?.toUpperCase() || 'U';
  }
  return 'U';
}

/**
 * Get user display name
 */
export function getUserDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  username?: string | null,
  email?: string | null
): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  if (username) {
    return username;
  }
  if (email) {
    return email.split('@')[0];
  }
  return 'User';
}

/**
 * Get avatar style object for inline styles
 * Creates a sphere-like effect with a 3-color radial gradient
 * The gradient creates a 3D sphere appearance with light coming from top-left
 */
export function getAvatarStyle(gradient: UserAvatarGradient): React.CSSProperties {
  return {
    background: `radial-gradient(circle at 30% 30%, ${gradient.topLeft} 0%, ${gradient.topLeft} 35%, ${gradient.centerRight} 50%, ${gradient.bottomLeft} 100%)`,
    boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.1)'
  };
}

/**
 * Profile icon configuration
 * Maps profile_image_url (0-7) to unique profile icons
 * Each user should have a consistent icon across the app
 */
export interface ProfileIcon {
  icon: string; // Emoji or icon character
  background: string; // CSS gradient or color
}

const profileIcons: ProfileIcon[] = [
  { icon: '👤', background: 'linear-gradient(135deg, #2952FF 0%, #001f54 100%)' }, // 0 - Brand Blue to Navy
  { icon: '🎭', background: 'linear-gradient(135deg, #00D07E 0%, #06b6d4 100%)' }, // 1 - Brand Green to Cyan
  { icon: '🎨', background: 'linear-gradient(135deg, #06b6d4 0%, #2952FF 100%)' }, // 2 - Cyan to Brand Blue
  { icon: '🌟', background: 'linear-gradient(135deg, #00D07E 0%, #0891b2 100%)' }, // 3 - Brand Green to Dark Cyan
  { icon: '🚀', background: 'linear-gradient(135deg, #2952FF 0%, #06b6d4 100%)' }, // 4 - Brand Blue to Cyan
  { icon: '🎯', background: 'linear-gradient(135deg, #001f54 0%, #00D07E 100%)' }, // 5 - Navy to Brand Green
  { icon: '⚡', background: 'linear-gradient(135deg, #06b6d4 0%, #00D07E 100%)' }, // 6 - Cyan to Brand Green
  { icon: '🎪', background: 'linear-gradient(135deg, #0891b2 0%, #2952FF 100%)' }, // 7 - Dark Cyan to Brand Blue
];

/**
 * Get profile icon based on profile_image_url (0-7)
 * Returns null if invalid, which will fallback to gradient avatar
 */
export function getProfileIcon(profileImageUrl: number): ProfileIcon | null {
  if (profileImageUrl >= 0 && profileImageUrl <= 7) {
    return profileIcons[profileImageUrl];
  }
  return null;
}

/**
 * Get default profile icon for a user based on their ID
 * This ensures users without a profile_image_url still get a consistent icon
 */
export function getDefaultProfileIcon(userId: string): ProfileIcon {
  // Generate consistent hash from user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = char + ((hash << 5) - hash);
  }
  // Map hash to 0-7 range
  const index = Math.abs(hash) % profileIcons.length;
  return profileIcons[index];
}

