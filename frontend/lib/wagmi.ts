import { createConfig, http } from 'wagmi';
import { base, mainnet, bsc } from 'viem/chains';
import { injected, metaMask } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base, mainnet, bsc],
  connectors: [
    injected({ target: 'metaMask' }),
    metaMask(),
  ],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [bsc.id]: http(),
  },
});

