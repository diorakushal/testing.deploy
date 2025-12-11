'use client';

import { useState, useEffect } from 'react';
import { getChainConfig } from '@/lib/tokenConfig';
import { formatUnits } from 'viem';
import { createPublicClient, http } from 'viem';
import { base, mainnet, bsc, polygon } from 'viem/chains';

interface GasFeeDisplayProps {
  chainId: number | string;
  tokenSymbol: string;
  amount: string;
  onTotalAmountChange?: (totalAmount: string) => void;
}

interface GasInfo {
  gasPrice: string;
  estimatedFee: string;
  estimatedFeeUSD: string;
  gasPercentage?: number;
  totalCost?: number;
}

export default function GasFeeDisplay({ chainId, tokenSymbol, amount, onTotalAmountChange }: GasFeeDisplayProps) {
  const [gasInfo, setGasInfo] = useState<GasInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [priceWarning, setPriceWarning] = useState<string | null>(null);

  // Fetch token price from CoinGecko API
  useEffect(() => {
    const fetchTokenPrice = async () => {
      try {
        // Map token symbols to CoinGecko IDs
        const coinGeckoIdMap: Record<string, string> = {
          'USDC': 'usd-coin',
          'USDT': 'tether',
          'DAI': 'dai',
          'WETH': 'weth',
          'WBTC': 'wrapped-bitcoin',
          'ETH': 'ethereum',
          'BTC': 'bitcoin',
          'BNB': 'binancecoin',
          'LINK': 'chainlink',
          'UNI': 'uniswap',
          'MATIC': 'matic-network',
          'AAVE': 'aave',
          'CAKE': 'pancakeswap-token',
          'SHIB': 'shiba-inu',
          'PEPE': 'pepe',
          'DOGE': 'dogecoin',
          'BONK': 'bonk',
          'WIF': 'dogwifcoin',
          'AVAX': 'avalanche-2'
        };

        const coinGeckoId = coinGeckoIdMap[tokenSymbol];
        
        if (!coinGeckoId) {
          // For unknown tokens, try to fetch by symbol directly via backend proxy
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
          const response = await fetch(
            `${API_URL}/crypto-price?ids=${tokenSymbol.toLowerCase()}`
          );
          
          if (response.ok) {
            const data = await response.json();
            const price = data[tokenSymbol.toLowerCase()]?.usd;
            if (price && typeof price === 'number') {
              setTokenPrice(price);
              return;
            }
          }
          
          // If still not found, set error state
          setError(`Token price not found for ${tokenSymbol}`);
          setTokenPrice(null);
          return;
        }

        // Fetch price from backend proxy (which calls CoinGecko API)
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const url = `${API_URL}/crypto-price?ids=${coinGeckoId}`;
        
        let response;
        try {
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (fetchError: any) {
          // Network error - backend server might not be running
          console.error('Network error fetching token price:', fetchError);
          throw new Error(`Cannot reach backend server at ${API_URL}. Please ensure the backend server is running and restart it to load the new /api/crypto-price endpoint.`);
        }
        
        if (!response.ok) {
          // Check if it's a 404 - endpoint doesn't exist (server needs restart)
          if (response.status === 404) {
            throw new Error(`Backend endpoint not found. Please restart the backend server to load the /api/crypto-price endpoint.`);
          }
          
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }
          console.error('Backend error response:', errorData);
          throw new Error(errorData.error || errorData.details || `Failed to fetch price: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if we're using fallback/default prices
        if (data._warning) {
          console.warn('⚠️ Using default prices:', data._warning);
          setPriceWarning(data._warning);
        } else {
          setPriceWarning(null);
        }
        
        const price = data[coinGeckoId]?.usd;
        
        if (price && typeof price === 'number') {
        setTokenPrice(price);
        } else {
          console.error('Invalid price data:', data);
          throw new Error(`Price data not available for ${coinGeckoId}`);
        }
      } catch (err: any) {
        console.error('Failed to fetch token price:', err);
        const errorMessage = err.message || 'Failed to fetch token price';
        setError(errorMessage);
        setTokenPrice(null);
      }
    };
    fetchTokenPrice();
  }, [tokenSymbol]);

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setGasInfo(null);
      setLoading(false);
      return;
    }

    const fetchGasInfo = async () => {
      // Declare variables outside try block for catch block access
      let client;
      let nativePrice: number | null = null;
      let nativeCoinGeckoId: string;
      let chainIdNum: number;
      let chainConfig: any;
      
      try {
        setLoading(true);
        setError(null);
        
        chainIdNum = typeof chainId === 'string' ? parseInt(chainId) : chainId;
        chainConfig = getChainConfig(chainIdNum);
        
        if (!chainConfig) {
          setError('Chain not supported');
          setLoading(false);
          return;
        }

        // Create public client for the chain with reliable RPC endpoints
        // Only supported chains: Ethereum, BNB Chain, Base, Polygon
        if (chainIdNum === 8453) {
          // Base - use public RPC
          client = createPublicClient({ 
            chain: base, 
            transport: http('https://mainnet.base.org') 
          });
          nativeCoinGeckoId = 'ethereum';
        } else if (chainIdNum === 1) {
          // Ethereum
          client = createPublicClient({ 
            chain: mainnet, 
            transport: http('https://eth.llamarpc.com') 
          });
          nativeCoinGeckoId = 'ethereum';
        } else if (chainIdNum === 56) {
          // BNB Chain
          client = createPublicClient({ 
            chain: bsc, 
            transport: http('https://bsc-dataseed.binance.org') 
          });
          nativeCoinGeckoId = 'binancecoin';
        } else if (chainIdNum === 137) {
          // Polygon
          client = createPublicClient({ 
            chain: polygon, 
            transport: http('https://polygon-rpc.com') 
          });
          nativeCoinGeckoId = 'matic-network';
        } else {
          setError('Chain not supported. Supported chains: Ethereum, BNB Chain, Base, Polygon');
          setLoading(false);
          return;
        }

        // Fetch native currency price from backend proxy - REQUIRED, no fallback
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const priceResponse = await fetch(
          `${API_URL}/crypto-price?ids=${nativeCoinGeckoId}`
        );
        
        if (!priceResponse.ok) {
          const errorData = await priceResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch ${chainConfig.nativeCurrency.symbol} price`);
        }
        
        const priceData = await priceResponse.json();
        const fetchedPrice = priceData[nativeCoinGeckoId]?.usd;
        
        if (!fetchedPrice || typeof fetchedPrice !== 'number') {
          throw new Error(`${chainConfig.nativeCurrency.symbol} price data not available`);
        }
        
        nativePrice = fetchedPrice;

        // Get current gas price with timeout - REQUIRED, no fallback
        const gasPrice = await Promise.race([
            client.getGasPrice(),
            new Promise<bigint>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout fetching gas price')), 5000)
            )
          ]);
        
        // Convert gas price to Gwei with proper formatting
        const gasPriceGweiNum = parseFloat(formatUnits(gasPrice, 9));
        const gasPriceGwei = gasPriceGweiNum < 0.01 
          ? gasPriceGweiNum.toFixed(4) 
          : gasPriceGweiNum.toFixed(2);
        
        // Estimate gas for ERC20 transfer (typically ~65,000 gas)
        const estimatedGas = 65000n;
        const estimatedFeeWei = gasPrice * estimatedGas;
        const estimatedFeeEth = parseFloat(formatUnits(estimatedFeeWei, 18));
        const estimatedFeeUSD = estimatedFeeEth * nativePrice;
        
        // Calculate gas as percentage of requested amount
        const amountNum = parseFloat(amount) || 0;
        if (!tokenPrice) {
          throw new Error('Token price not available');
        }
        const amountUSD = amountNum * tokenPrice;
        const gasPercentage = amountUSD > 0 ? (estimatedFeeUSD / amountUSD) * 100 : 0;
        const totalCost = amountUSD + estimatedFeeUSD;

        // Format native currency fee based on chain
        let formattedFeeNative: string;
        const chainIdForFormat = chainIdNum as number; // Type assertion to avoid narrowing
        if (chainIdForFormat === 56) {
          formattedFeeNative = estimatedFeeEth.toFixed(8); // BNB - more precision
        } else if (chainIdForFormat === 137) {
          formattedFeeNative = estimatedFeeEth.toFixed(8); // MATIC - more precision
        } else if (chainIdForFormat === 43114) {
          formattedFeeNative = estimatedFeeEth.toFixed(8); // AVAX - more precision
        } else {
          formattedFeeNative = estimatedFeeEth < 0.0001 
            ? estimatedFeeEth.toFixed(8) 
            : estimatedFeeEth.toFixed(6); // ETH
        }

        setGasInfo({
          gasPrice: `${gasPriceGwei} Gwei`,
          estimatedFee: `${formattedFeeNative} ${chainConfig.nativeCurrency.symbol}`,
          estimatedFeeUSD: `~$${estimatedFeeUSD < 0.01 ? estimatedFeeUSD.toFixed(6) : estimatedFeeUSD.toFixed(4)}`,
          gasPercentage,
          totalCost
        });
      } catch (err: any) {
        console.error('Error fetching gas info:', err);
        setError(err.message || 'Failed to fetch gas fees');
        setGasInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGasInfo();
  }, [chainId, amount, tokenPrice]);

  // Notify parent component of total amount (amount + gas in token)
  // This hook MUST be called before any early returns
  useEffect(() => {
    const amountNum = parseFloat(amount) || 0;
    if (onTotalAmountChange && gasInfo && tokenPrice && amountNum > 0) {
      const gasFeeNum = parseFloat(gasInfo.estimatedFeeUSD.replace(/[^0-9.]/g, '')) || 0;
      const gasFeeInToken = gasFeeNum / tokenPrice;
      const totalAmountInToken = amountNum + gasFeeInToken;
      onTotalAmountChange(totalAmountInToken.toFixed(8));
    } else if (onTotalAmountChange && (!gasInfo || !tokenPrice || amountNum <= 0)) {
      // Reset to base amount if gas info not available
      onTotalAmountChange(amount);
    }
  }, [gasInfo, tokenPrice, amount, onTotalAmountChange]);

  if (loading) {
    return (
      <div className="text-xs text-gray-500 mt-1">
        <span className="animate-pulse">Loading gas fees...</span>
      </div>
    );
  }

  if (error && !gasInfo) {
    return (
      <div className="text-xs text-red-500 mt-1">
        Error: {error}
      </div>
    );
  }

  if (!gasInfo || !amount || parseFloat(amount) <= 0) {
    return null;
  }

  const amountNum = parseFloat(amount) || 0;
  if (!tokenPrice) {
    return (
      <div className="text-xs text-red-500 mt-1">
        Error: Token price not available
      </div>
    );
  }
  const amountUSD = amountNum * tokenPrice;
  const gasFeeNum = parseFloat(gasInfo.estimatedFeeUSD.replace(/[^0-9.]/g, '')) || 0;
  
  // Calculate gas fee in the selected token (convert from USD)
  const gasFeeInToken = gasFeeNum / tokenPrice;
  const totalAmountInToken = amountNum + gasFeeInToken;
  
  const gasPercentage = amountUSD > 0 ? (gasFeeNum / amountUSD) * 100 : 0;
  const totalCost = amountUSD + gasFeeNum;

  // No buffer - use exact gas fee estimate
  const gasFeeInTokenDisplay = gasFeeInToken;
  const totalAmountInTokenDisplay = amountNum + gasFeeInTokenDisplay;
  const totalCostDisplay = amountUSD + gasFeeNum;

  return (
    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
      {priceWarning && (
        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-[10px] text-yellow-800">
          ⚠️ {priceWarning}
        </div>
      )}
      <div className="mb-1.5">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-gray-700">Estimated gas fee (paid in {tokenSymbol}):</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-600">
            <span className="text-[10px] text-gray-500">Est. gas fee in {tokenSymbol}:</span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              {gasFeeInTokenDisplay < 0.0001 
                ? gasFeeInTokenDisplay.toFixed(10) 
                : gasFeeInTokenDisplay < 1 
                ? gasFeeInTokenDisplay.toFixed(8) 
                : gasFeeInTokenDisplay.toFixed(4)} {tokenSymbol}
            </div>
            <div className="text-gray-500 text-[10px]">{gasInfo.estimatedFee} ({gasInfo.estimatedFeeUSD})</div>
          </div>
        </div>
      </div>
      {amountNum > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-200">
          <div className="flex items-center justify-between text-[10px] text-gray-600">
            <span>Requested amount:</span>
            <span className="font-medium text-gray-700">
              {amountNum < 0.0001 
                ? amountNum.toFixed(10) 
                : amountNum < 1 
                ? amountNum.toFixed(8) 
                : amountNum.toFixed(4)} {tokenSymbol}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-600 mt-0.5">
            <span className="font-semibold">Est. total ({tokenSymbol} + gas):</span>
            <span className="font-bold text-gray-900">
              {totalAmountInTokenDisplay < 0.0001 
                ? totalAmountInTokenDisplay.toFixed(10) 
                : totalAmountInTokenDisplay < 1 
                ? totalAmountInTokenDisplay.toFixed(8) 
                : totalAmountInTokenDisplay.toFixed(4)} {tokenSymbol}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 mt-0.5">
            <span>Est. total in USD:</span>
            <span className="font-medium">${totalCostDisplay.toFixed(4)}</span>
          </div>
          <div className="mt-1 pt-1 border-t border-gray-200">
            <div className="text-[9px] text-gray-400 italic">
              ⚠️ Final fee calculated at transaction time. Actual cost may vary slightly.
            </div>
          </div>
        </div>
      )}
      <div className="mt-1 text-[10px] text-gray-500">
        Gas price: {gasInfo.gasPrice}
      </div>
    </div>
  );
}

