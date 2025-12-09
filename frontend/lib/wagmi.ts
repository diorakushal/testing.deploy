import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, mainnet, bsc, polygon, arbitrum, optimism } from 'wagmi/chains';
import {
  metaMaskWallet,
  rainbowWallet,
  coinbaseWallet,
  walletConnectWallet,
  injectedWallet,
  trustWallet,
  phantomWallet,
  okxWallet,
  binanceWallet,
  braveWallet,
  ledgerWallet,
  safeWallet,
} from '@rainbow-me/rainbowkit/wallets';

export const config = getDefaultConfig({
  appName: 'Blockbook',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '6e4a1dcc02a0169ec9f4e7ffe7a34810',
  chains: [base, mainnet, bsc, polygon, arbitrum, optimism],
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        rainbowWallet,
        coinbaseWallet,
        trustWallet,
        phantomWallet,
      ],
    },
    {
      groupName: 'More Wallets',
      wallets: [
        okxWallet,
        binanceWallet,
        braveWallet,
        ledgerWallet,
        walletConnectWallet,
        safeWallet,
        injectedWallet,
      ],
    },
  ],
  ssr: true, // Enable server-side rendering support
});

