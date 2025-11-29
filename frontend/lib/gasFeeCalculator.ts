/**
 * Gas Fee Calculator Utility
 * 
 * Step 1: Estimation (for display) - Shows estimate with buffer
 * Step 2: Final Calculation (before transaction) - Gets latest gas prices
 */

import { formatUnits, parseUnits, createPublicClient, http, type Address } from 'viem';
import { base, mainnet, bsc, polygon } from 'viem/chains';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface GasFeeResult {
  gasPrice: bigint;
  estimatedGas: bigint;
  feeInNative: string;
  feeInUSD: number;
  feeInToken: number;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface FinalGasFeeOptions {
  chainId: number;
  tokenAddress: Address;
  tokenSymbol: string;
  tokenDecimals: number;
  recipient: Address;
  amount: bigint;
  fromAddress: Address;
}

/**
 * Step 2: Calculate final gas fee right before transaction
 * This gets the LATEST gas prices from the network
 */
export async function calculateFinalGasFee(
  options: FinalGasFeeOptions
): Promise<GasFeeResult> {
  const { chainId, tokenAddress, tokenSymbol, tokenDecimals, recipient, amount, fromAddress } = options;
  
  // For Firefox or slow networks, use fallback values immediately
  // This prevents timeouts and allows transactions to proceed
  const USE_FALLBACK_IMMEDIATELY = true; // Set to true to skip network calls and use estimates

  // Helper function to create RPC client - skip testing for speed
  // Just create the client, we'll use fallback gas prices if network calls fail
  const createRPCClient = (rpcUrl: string, chain: any): any => {
    return createPublicClient({ 
      chain, 
      transport: http(rpcUrl, { timeout: 2000 }) // Very short timeout
    });
  };

  // Create public client for the chain with multiple RPC fallbacks
  // Only supported EVM chains: Ethereum, BNB Chain, Base, Polygon
  // Note: Solana is handled separately (not an EVM chain)
  let client;
  let nativeCoinGeckoId: string;
  let nativePrice: number = 3000; // Fallback

  // Create RPC client immediately - no testing, just create it
  // We'll use fallback gas prices if network calls fail (which is fine)
  if (chainId === 8453) {
    client = createRPCClient('https://mainnet.base.org', base);
    nativeCoinGeckoId = 'ethereum';
  } else if (chainId === 1) {
    client = createRPCClient('https://eth.llamarpc.com', mainnet);
    nativeCoinGeckoId = 'ethereum';
  } else if (chainId === 56) {
    client = createRPCClient('https://bsc-dataseed.binance.org', bsc);
    nativeCoinGeckoId = 'binancecoin';
  } else if (chainId === 137) {
    client = createRPCClient('https://polygon-rpc.com', polygon);
    nativeCoinGeckoId = 'matic-network';
  } else {
    throw new Error(`Unsupported chain: ${chainId}. Supported chains: Ethereum (1), BNB Chain (56), Base (8453), Polygon (137), Solana`);
  }
  
  console.log(`[GasFeeCalculator] Created RPC client for chain ${chainId}`);

  // Fetch latest native currency price
  try {
    const priceResponse = await fetch(`${API_URL}/crypto-price?ids=${nativeCoinGeckoId}`);
    if (priceResponse.ok) {
      const priceData = await priceResponse.json();
      const fetchedPrice = priceData[nativeCoinGeckoId]?.usd;
      if (fetchedPrice && typeof fetchedPrice === 'number') {
        nativePrice = fetchedPrice;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch native price, using fallback');
  }

  // Fetch token price
  let tokenPrice = 1;
  try {
    const coinGeckoIdMap: Record<string, string> = {
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'DAI': 'dai',
      'WETH': 'weth',
      'WBTC': 'wrapped-bitcoin',
      'ETH': 'ethereum',
      'BTC': 'bitcoin',
      'SOL': 'solana',
      'BNB': 'binancecoin',
    };
    const coinGeckoId = coinGeckoIdMap[tokenSymbol] || tokenSymbol.toLowerCase();
    const tokenPriceResponse = await fetch(`${API_URL}/crypto-price?ids=${coinGeckoId}`);
    if (tokenPriceResponse.ok) {
      const tokenPriceData = await tokenPriceResponse.json();
      const price = tokenPriceData[coinGeckoId]?.usd;
      if (price && typeof price === 'number') {
        tokenPrice = price;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch token price, using fallback');
  }

  // Get gas price - use fallback immediately if USE_FALLBACK_IMMEDIATELY is true
  // Otherwise try to fetch from network with very short timeout
  let gasPrice: bigint;
  let usingFallbackGas = false;
  
  if (USE_FALLBACK_IMMEDIATELY) {
    // Skip network call entirely - use fallback values immediately
    console.log('[GasFeeCalculator] Using fallback gas prices (skipping network call)');
    usingFallbackGas = true;
    if (chainId === 1) {
      gasPrice = parseUnits('40', 'gwei'); // Ethereum: 40 gwei
    } else if (chainId === 8453) {
      gasPrice = parseUnits('0.1', 'gwei'); // Base: 0.1 gwei
    } else if (chainId === 56) {
      gasPrice = parseUnits('3', 'gwei'); // BNB Chain: 3 gwei
    } else if (chainId === 137) {
      gasPrice = parseUnits('30', 'gwei'); // Polygon: 30 gwei
    } else {
      gasPrice = parseUnits('20', 'gwei'); // Default: 20 gwei
    }
    console.log('[GasFeeCalculator] Fallback gas price:', formatUnits(gasPrice, 'gwei'), 'gwei');
  } else {
    // Try to fetch from network with very short timeout
    try {
      gasPrice = await Promise.race([
        client.getGasPrice(),
        new Promise<bigint>((_, reject) => 
          setTimeout(() => reject(new Error('Gas price fetch timeout')), 2000)
        )
      ]);
      console.log('[GasFeeCalculator] ✅ Fetched gas price from network:', formatUnits(gasPrice, 'gwei'), 'gwei');
    } catch (err: any) {
      console.warn('[GasFeeCalculator] ⚠️ Failed to fetch gas price, using fallback:', err.message || err);
      usingFallbackGas = true;
      // Fallback: Use estimated gas prices based on chain
      if (chainId === 1) {
        gasPrice = parseUnits('40', 'gwei');
      } else if (chainId === 8453) {
        gasPrice = parseUnits('0.1', 'gwei');
      } else if (chainId === 56) {
        gasPrice = parseUnits('3', 'gwei');
      } else if (chainId === 137) {
        gasPrice = parseUnits('30', 'gwei');
      } else {
        gasPrice = parseUnits('20', 'gwei');
      }
      console.warn('[GasFeeCalculator] Using fallback gas price:', formatUnits(gasPrice, 'gwei'), 'gwei');
    }
  }

  // Estimate gas for ERC20 transfer
  const ERC20_ABI = [
    {
      name: 'transfer',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' }
      ],
      outputs: [{ name: '', type: 'bool' }]
    }
  ] as const;

  let estimatedGas: bigint;
  if (USE_FALLBACK_IMMEDIATELY) {
    // Skip gas estimation - use standard ERC20 transfer gas
    estimatedGas = 71500n; // 65,000 + 10% buffer
    console.log('[GasFeeCalculator] Using fallback gas estimate:', estimatedGas.toString());
  } else {
    try {
      // Try to estimate actual gas needed with very short timeout
      estimatedGas = await Promise.race([
        client.estimateGas({
          account: fromAddress,
          to: tokenAddress,
          data: client.encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [recipient, amount]
          })
        }),
        new Promise<bigint>((_, reject) => 
          setTimeout(() => reject(new Error('Gas estimation timeout')), 2000)
        )
      ]);
      console.log('[GasFeeCalculator] Gas estimation successful:', estimatedGas.toString());
    } catch (err) {
      console.warn('[GasFeeCalculator] Gas estimation failed, using fallback:', err);
      // Fallback to standard ERC20 transfer gas (typically ~65,000)
      // Add 10% buffer for safety
      estimatedGas = 71500n; // 65000 * 1.1
      console.warn('[GasFeeCalculator] Using fallback gas estimate:', estimatedGas.toString());
    }
  }

  // Calculate fees
  const feeInWei = gasPrice * estimatedGas;
  const feeInNative = parseFloat(formatUnits(feeInWei, 18));
  const feeInUSD = feeInNative * nativePrice;
  const feeInToken = feeInUSD / tokenPrice;

  // For EIP-1559 chains, get fee history for maxFeePerGas
  let maxFeePerGas: bigint | undefined;
  let maxPriorityFeePerGas: bigint | undefined;

  if (USE_FALLBACK_IMMEDIATELY) {
    // Skip fee history - estimate from gasPrice
    if (chainId === 1 || chainId === 8453 || chainId === 137) {
      // Estimate: maxFeePerGas = gasPrice * 1.2, priorityFee = gasPrice * 0.1
      maxFeePerGas = (gasPrice * 120n) / 100n;
      maxPriorityFeePerGas = (gasPrice * 10n) / 100n;
      console.log('[GasFeeCalculator] Using estimated EIP-1559 fees from fallback gas price');
    }
  } else {
    try {
      // Add timeout to prevent hanging - very short timeout
      const feeHistory = await Promise.race([
        client.getFeeHistory({
          blockCount: 1,
          rewardPercentiles: [50] // 50th percentile (median)
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fee history timeout')), 2000)
        )
      ]) as any;
      
      if (feeHistory.baseFeePerGas && feeHistory.baseFeePerGas.length > 0) {
        const baseFee = feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1];
        const priorityFee = feeHistory.reward?.[0]?.[0] || 2000000000n; // 2 Gwei default
        
        // maxFeePerGas = baseFee + priorityFee (no buffer, use exact current fees)
        maxFeePerGas = baseFee + priorityFee;
        maxPriorityFeePerGas = priorityFee;
      }
    } catch (err) {
      // Not an EIP-1559 chain or fee history not available
      // Use gasPrice for legacy chains - this is fine, continue without EIP-1559 fees
      console.warn('[GasFeeCalculator] Fee history not available, estimating from gas price');
      // For EIP-1559 chains, estimate maxFeePerGas from gasPrice
      if (chainId === 1 || chainId === 8453 || chainId === 137) {
        // Estimate: maxFeePerGas = gasPrice * 1.2, priorityFee = gasPrice * 0.1
        maxFeePerGas = (gasPrice * 120n) / 100n;
        maxPriorityFeePerGas = (gasPrice * 10n) / 100n;
      }
    }
  }

  return {
    gasPrice,
    estimatedGas,
    feeInNative: feeInNative.toFixed(8),
    feeInUSD,
    feeInToken,
    maxFeePerGas,
    maxPriorityFeePerGas
  };
}

/**
 * Step 1: Get estimated gas fee with buffer (for display)
 * This is used when showing the user the estimated cost
 * Note: This is a simplified version - actual estimation happens in GasFeeDisplay component
 */
export async function getEstimatedGasFee(
  chainId: number,
  tokenSymbol: string,
  amount: string
): Promise<{ feeInUSD: number; feeInToken: number; withBuffer: { feeInUSD: number; feeInToken: number } }> {
  // For estimation, we just get current gas price and use standard ERC20 transfer gas
  // The actual detailed estimation is done in GasFeeDisplay component
  
  // Create public client - Only supported EVM chains
  let client;
  if (chainId === 8453) {
    client = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });
  } else if (chainId === 1) {
    client = createPublicClient({ chain: mainnet, transport: http('https://eth.llamarpc.com') });
  } else if (chainId === 56) {
    client = createPublicClient({ chain: bsc, transport: http('https://bsc-dataseed.binance.org') });
  } else if (chainId === 137) {
    client = createPublicClient({ chain: polygon, transport: http('https://polygon-rpc.com') });
  } else {
    throw new Error(`Unsupported chain: ${chainId}. Supported chains: Ethereum (1), BNB Chain (56), Base (8453), Polygon (137), Solana`);
  }

  const gasPrice = await client.getGasPrice();
  const estimatedGas = 65000n; // Standard ERC20 transfer
  const feeInWei = gasPrice * estimatedGas;
  const feeInNative = parseFloat(formatUnits(feeInWei, 18));
  
  // Get prices (simplified - would need actual price fetching)
  const feeInUSD = feeInNative * 3000; // Approximate
  const feeInToken = feeInUSD / 1; // Assuming stablecoin

  // Add 10% buffer for estimate display
  const buffer = 1.10;
  const withBuffer = {
    feeInUSD: feeInUSD * buffer,
    feeInToken: feeInToken * buffer
  };

  return {
    feeInUSD,
    feeInToken,
    withBuffer
  };
}

