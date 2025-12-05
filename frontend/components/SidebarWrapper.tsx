'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide header on login and signup pages
  const hideHeader = pathname === '/login' || pathname === '/signup' || pathname?.startsWith('/auth/');
  
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


