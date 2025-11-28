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

  // Create public client for the chain
  // Only supported EVM chains: Ethereum, BNB Chain, Base, Polygon
  // Note: Solana is handled separately (not an EVM chain)
  let client;
  let nativeCoinGeckoId: string;
  let nativePrice: number = 3000; // Fallback

  if (chainId === 8453) {
    client = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });
    nativeCoinGeckoId = 'ethereum';
  } else if (chainId === 1) {
    client = createPublicClient({ chain: mainnet, transport: http('https://eth.llamarpc.com') });
    nativeCoinGeckoId = 'ethereum';
  } else if (chainId === 56) {
    client = createPublicClient({ chain: bsc, transport: http('https://bsc-dataseed.binance.org') });
    nativeCoinGeckoId = 'binancecoin';
  } else if (chainId === 137) {
    client = createPublicClient({ chain: polygon, transport: http('https://polygon-rpc.com') });
    nativeCoinGeckoId = 'matic-network';
  } else {
    throw new Error(`Unsupported chain: ${chainId}. Supported chains: Ethereum (1), BNB Chain (56), Base (8453), Polygon (137), Solana`);
  }

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

  // Get LATEST gas price (critical - this is the final calculation)
  // Add timeout to prevent hanging
  const gasPrice = await Promise.race([
    client.getGasPrice(),
    new Promise<bigint>((_, reject) => 
      setTimeout(() => reject(new Error('Gas price fetch timeout')), 10000)
    )
  ]);

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
  try {
    // Try to estimate actual gas needed with timeout
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
        setTimeout(() => reject(new Error('Gas estimation timeout')), 10000)
      )
    ]);
    // Use exact estimated gas (no buffer)
  } catch (err) {
    console.warn('Gas estimation failed, using fallback:', err);
    // Fallback to standard ERC20 transfer gas (typically ~65,000)
    estimatedGas = 65000n;
  }

  // Calculate fees
  const feeInWei = gasPrice * estimatedGas;
  const feeInNative = parseFloat(formatUnits(feeInWei, 18));
  const feeInUSD = feeInNative * nativePrice;
  const feeInToken = feeInUSD / tokenPrice;

  // For EIP-1559 chains, get fee history for maxFeePerGas
  let maxFeePerGas: bigint | undefined;
  let maxPriorityFeePerGas: bigint | undefined;

  try {
    // Add timeout to prevent hanging
    const feeHistory = await Promise.race([
      client.getFeeHistory({
        blockCount: 1,
        rewardPercentiles: [50] // 50th percentile (median)
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fee history timeout')), 8000)
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
    console.warn('Fee history not available, using legacy gas price');
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

