// Token and Chain Configuration for Payment Requests

export interface ChainConfig {
  id: number | string;
  name: string;
  rpcUrl: string;
  explorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number | string;
}

// Chain configurations
export const CHAINS: Record<number | string, ChainConfig> = {
  8453: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  1: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  56: {
    id: 56,
    name: 'BNB Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorer: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    }
  },
  'solana': {
    id: 'solana' as any,
    name: 'Solana',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorer: 'https://solscan.io',
    nativeCurrency: {
      name: 'SOL',
      symbol: 'SOL',
      decimals: 9
    }
  },
  42161: {
    id: 42161,
    name: 'Arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  10: {
    id: 10,
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  137: {
    id: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  43114: {
    id: 43114,
    name: 'Avalanche',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorer: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18
    }
  },
  'tron': {
    id: 'tron' as any,
    name: 'Tron',
    rpcUrl: 'https://api.trongrid.io',
    explorer: 'https://tronscan.org',
    nativeCurrency: {
      name: 'TRX',
      symbol: 'TRX',
      decimals: 6
    }
  }
};

// Token configurations by chain
export const TOKENS: TokenConfig[] = [
  // Base Mainnet
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    chainId: 8453
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    decimals: 6,
    chainId: 8453
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    decimals: 18,
    chainId: 8453
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    chainId: 8453
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x1ce7ae555279c918a0f3b3f1adbb0024004e7a08',
    decimals: 8,
    chainId: 8453
  },
  {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    address: '0x4e9ce36E442e55EcD9025B9a6E0D88485d628A67', // Base SHIB
    decimals: 18,
    chainId: 8453
  },
  // Ethereum Mainnet
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    chainId: 1
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    chainId: 1
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    decimals: 18,
    chainId: 1
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    decimals: 18,
    chainId: 1
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x2260FAC5E5542a773Aa44fBCfeD7f193F2C6F3Aa',
    decimals: 8,
    chainId: 1
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    decimals: 18,
    chainId: 1
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    decimals: 18,
    chainId: 1
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    decimals: 18,
    chainId: 1
  },
  {
    symbol: 'AAVE',
    name: 'Aave',
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    decimals: 18,
    chainId: 1
  },
  {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    decimals: 18,
    chainId: 1
  },
  {
    symbol: 'PEPE',
    name: 'Pepe',
    address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    decimals: 18,
    chainId: 1
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    address: '0x4206931337dc273a630d328dA6441786BfaD668f', // Wrapped DOGE on Ethereum
    decimals: 8,
    chainId: 1
  },
  // BNB Chain
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    decimals: 18,
    chainId: 56
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0x55d398326f99059fF775485246999027B3197955',
    decimals: 18,
    chainId: 56
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
    decimals: 18,
    chainId: 56
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    decimals: 18,
    chainId: 56
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x1CE0c2827e2eF14D5C4f29a91dAA907EF7D172b8',
    decimals: 8,
    chainId: 56
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
    decimals: 18,
    chainId: 56
  },
  {
    symbol: 'CAKE',
    name: 'PancakeSwap',
    address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    decimals: 18,
    chainId: 56
  },
  {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    address: '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D',
    decimals: 18,
    chainId: 56
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', // Wrapped DOGE on BSC
    decimals: 8,
    chainId: 56
  },
  // Solana (SPL tokens - using mint addresses)
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Solana USDC mint
    decimals: 6,
    chainId: 'solana' as any
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // Solana USDT mint
    decimals: 6,
    chainId: 'solana' as any
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    address: 'So11111111111111111111111111111111111111112', // Native SOL wrapped
    decimals: 9,
    chainId: 'solana' as any
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // Solana WBTC
    decimals: 8,
    chainId: 'solana' as any
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // Solana BONK
    decimals: 5,
    chainId: 'solana' as any
  },
  {
    symbol: 'WIF',
    name: 'dogwifhat',
    address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // Solana WIF
    decimals: 6,
    chainId: 'solana' as any
  },
  // Arbitrum
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    decimals: 6,
    chainId: 42161
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    decimals: 6,
    chainId: 42161
  },
  // Optimism
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    decimals: 6,
    chainId: 10
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0x94b008aA00579c1307B0EF2b499aD98a8ce58e58',
    decimals: 6,
    chainId: 10
  },
  // Polygon
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    decimals: 6,
    chainId: 137
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    decimals: 6,
    chainId: 137
  },
  // Avalanche
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    decimals: 6,
    chainId: 43114
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    decimals: 6,
    chainId: 43114
  },
  // Tron (TRC20 tokens)
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', // Tron USDC (TRC20)
    decimals: 6,
    chainId: 'tron' as any
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // Tron USDT (TRC20)
    decimals: 6,
    chainId: 'tron' as any
  }
];

// Get tokens for a specific chain
export function getTokensForChain(chainId: number | string): TokenConfig[] {
  return TOKENS.filter(token => token.chainId === chainId);
}

// Get token by symbol and chain
export function getToken(symbol: string, chainId: number | string): TokenConfig | undefined {
  return TOKENS.find(token => token.symbol === symbol && token.chainId === chainId);
}

// Get chain config
export function getChainConfig(chainId: number | string): ChainConfig | undefined {
  return CHAINS[chainId];
}

// Available chains for selection - Only these 4 chains are supported
export const AVAILABLE_CHAINS = [
  { id: 8453, name: 'Base' },
  { id: 1, name: 'Ethereum' },
  { id: 56, name: 'BNB Chain' },
  { id: 137, name: 'Polygon' }
];

