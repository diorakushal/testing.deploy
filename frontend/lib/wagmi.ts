import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, mainnet, bsc, polygon } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Zemme',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '6e4a1dcc02a0169ec9f4e7ffe7a34810',
  chains: [base, mainnet, bsc, polygon],
  ssr: true, // Enable server-side rendering support
});

