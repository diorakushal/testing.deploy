'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide header on login, signup, auth pages, and public profile pages (single-segment usernames)
  const knownRoutes = ['/feed', '/pay', '/request', '/profile', '/settings', '/search', 
    '/payment-request', '/preferred-wallets', '/documentation', '/terms', '/user'];
  const isPublicProfile = pathname && pathname !== '/' && 
    !knownRoutes.some(route => pathname.startsWith(route)) &&
    pathname.split('/').filter(Boolean).length === 1; // Single segment = username
  
  const hideHeader = pathname === '/login' || pathname === '/signup' || pathname?.startsWith('/auth/') || isPublicProfile;
  
  if (hideHeader) {
    return <>{children}</>;
  }
  
  return (
    <>
      <Header />
      {children}
    </>
  );
}


