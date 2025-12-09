'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, Locale } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import { useState, useEffect } from 'react';
import { lightTheme } from '@rainbow-me/rainbowkit';

const customTheme = lightTheme({
  accentColor: '#000000',
  accentColorForeground: '#ffffff',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
});

// Supported locales in RainbowKit
const SUPPORTED_LOCALES: Locale[] = [
  'en-US', 'zh-CN', 'zh-HK', 'zh-TW', 'hi-IN', 'es-419', 'fr-FR', 'ar-AR',
  'pt-BR', 'ru-RU', 'id-ID', 'ja-JP', 'tr-TR', 'ko-KR', 'th-TH', 'uk-UA',
  'vi-VN', 'de-DE', 'ms-MY'
];

// Map browser language to RainbowKit locale
function getLocaleFromBrowser(): Locale {
  if (typeof window === 'undefined') return 'en-US';
  
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en-US';
  
  // Check for exact match
  if (SUPPORTED_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }
  
  // Check for language code match (e.g., 'en' -> 'en-US')
  const langCode = browserLang.split('-')[0];
  const matchedLocale = SUPPORTED_LOCALES.find(locale => 
    locale.toLowerCase().startsWith(langCode.toLowerCase())
  );
  
  if (matchedLocale) {
    return matchedLocale;
  }
  
  // Default to English
  return 'en-US';
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [locale, setLocale] = useState<Locale>('en-US');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Allow override via environment variable, otherwise auto-detect
    const envLocale = process.env.NEXT_PUBLIC_RAINBOWKIT_LOCALE as Locale | undefined;
    if (envLocale && SUPPORTED_LOCALES.includes(envLocale)) {
      setLocale(envLocale);
    } else {
      setLocale(getLocaleFromBrowser());
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={customTheme}
          locale={mounted ? locale : 'en-US'}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

