'use client';

import { useState, useEffect } from 'react';
import { getChainConfig } from '@/lib/tokenConfig';
import { formatUnits } from 'viem';
import { createPublicClient, http } from 'viem';
import { base, mainnet, bsc } from 'viem/chains';

interface GasFeeDisplayProps {
  chainId: number | string;
  tokenSymbol: string;
  amount: string;
}

interface GasInfo {
  gasPrice: string;
  estimatedFee: string;
  estimatedFeeUSD: string;
  gasPercentage?: number;
  totalCost?: number;
}

export default function GasFeeDisplay({ chainId, tokenSymbol, amount }: GasFeeDisplayProps) {
  const [gasInfo, setGasInfo] = useState<GasInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);

  // Fetch token price (approximate prices for popular tokens)
  useEffect(() => {
    const fetchTokenPrice = async () => {
      try {
        // Approximate prices (in production, fetch from CoinGecko or similar API)
        const priceMap: Record<string, number> = {
          // Stablecoins
          'USDC': 1,
          'USDT': 1,
          'DAI': 1,
          // Major cryptocurrencies (approximate - should fetch from API)
          'WETH': 3000,
          'WBTC': 65000,
          'ETH': 3000,
          'BTC': 65000,
          'SOL': 150,
          'BNB': 600,
          // DeFi tokens
          'LINK': 15,
          'UNI': 10,
          'MATIC': 0.8,
          'AAVE': 100,
          'CAKE': 3,
          // Meme coins & popular tokens
          'SHIB': 0.00001,
          'PEPE': 0.000001,
          'DOGE': 0.08,
          'BONK': 0.00002,
          'WIF': 3
        };
        
        const price = priceMap[tokenSymbol] || 1;
        setTokenPrice(price);
      } catch (err) {
        setTokenPrice(1); // Default fallback
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

    if (chainId === 'solana') {
      const solPrice = 150; // Approximate SOL price
      const gasFeeSOL = 0.000005;
      const gasFeeUSD = gasFeeSOL * solPrice;
      const amountNum = parseFloat(amount);
      const gasPercentage = (gasFeeUSD / amountNum) * 100;
      
      setGasInfo({
        gasPrice: '~0.000005',
        estimatedFee: `~${gasFeeSOL} SOL`,
        estimatedFeeUSD: `~$${gasFeeUSD.toFixed(4)}`
      });
      setLoading(false);
      return;
    }

    const fetchGasInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const chainIdNum = typeof chainId === 'string' ? parseInt(chainId) : chainId;
        const chainConfig = getChainConfig(chainIdNum);
        
        if (!chainConfig) {
          setError('Chain not supported');
          return;
        }

        // Create public client for the chain with reliable RPC endpoints
        let client;
        let nativePrice: number;
        let fallbackGasPrice: bigint;
        
        if (chainIdNum === 8453) {
          // Base - use public RPC
          client = createPublicClient({ 
            chain: base, 
            transport: http('https://mainnet.base.org') 
          });
          nativePrice = 3000; // ETH price
          fallbackGasPrice = 100000000n; // 0.1 Gwei fallback
        } else if (chainIdNum === 1) {
          // Ethereum
          client = createPublicClient({ 
            chain: mainnet, 
            transport: http('https://eth.llamarpc.com') 
          });
          nativePrice = 3000; // ETH price
          fallbackGasPrice = 20000000000n; // 20 Gwei fallback
        } else if (chainIdNum === 56) {
          // BSC
          client = createPublicClient({ 
            chain: bsc, 
            transport: http('https://bsc-dataseed.binance.org') 
          });
          nativePrice = 600; // BNB price
          fallbackGasPrice = 3000000000n; // 3 Gwei fallback
        } else {
          setError('Chain not supported');
          return;
        }

        // Get current gas price with timeout and fallback
        let gasPrice: bigint;
        try {
          gasPrice = await Promise.race([
            client.getGasPrice(),
            new Promise<bigint>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 5000)
            )
          ]);
        } catch (err) {
          console.warn('Failed to fetch gas price, using fallback:', err);
          gasPrice = fallbackGasPrice;
        }
        
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
        const tokenPriceValue = tokenPrice || 1;
        const amountUSD = amountNum * tokenPriceValue;
        const gasPercentage = amountUSD > 0 ? (estimatedFeeUSD / amountUSD) * 100 : 0;
        const totalCost = amountUSD + estimatedFeeUSD;

        // Format native currency fee based on chain
        let formattedFeeNative: string;
        if (chainIdNum === 56) {
          formattedFeeNative = estimatedFeeEth.toFixed(8); // BNB - more precision
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
        // Set fallback values based on chain
        const chainIdNum = typeof chainId === 'string' ? parseInt(chainId) : chainId;
        const chainConfig = getChainConfig(chainIdNum);
        
        if (chainConfig) {
          let fallbackGasPriceGwei: string;
          let fallbackFeeNative: string;
          let fallbackFeeUSD: string;
          
          const amountNum = parseFloat(amount) || 0;
          const tokenPriceValue = tokenPrice || 1;
          const amountUSD = amountNum * tokenPriceValue;
          
          if (chainIdNum === 8453) {
            // Base - very cheap (typically 0.01-0.1 Gwei)
            fallbackGasPriceGwei = '0.1';
            const feeEth = (0.1 * 65000) / 1e9; // 0.1 Gwei * 65k gas = 0.0000065 ETH
            fallbackFeeNative = `${feeEth.toFixed(8)} ETH`;
            const feeUSD = feeEth * 3000; // ~$0.02
            fallbackFeeUSD = feeUSD.toFixed(4);
            
            const gasPercentage = amountUSD > 0 ? (feeUSD / amountUSD) * 100 : 0;
            const totalCost = amountUSD + feeUSD;
            
            setGasInfo({
              gasPrice: `~${fallbackGasPriceGwei} Gwei`,
              estimatedFee: `~${fallbackFeeNative}`,
              estimatedFeeUSD: `~$${fallbackFeeUSD}`,
              gasPercentage,
              totalCost
            });
          } else if (chainIdNum === 1) {
            // Ethereum - expensive (typically 10-30 Gwei)
            fallbackGasPriceGwei = '20';
            const feeEth = (20 * 65000) / 1e9; // 20 Gwei * 65k gas = 0.0013 ETH
            fallbackFeeNative = `${feeEth.toFixed(6)} ETH`;
            const feeUSD = feeEth * 3000; // ~$3.90
            fallbackFeeUSD = feeUSD.toFixed(2);
            
            const gasPercentage = amountUSD > 0 ? (feeUSD / amountUSD) * 100 : 0;
            const totalCost = amountUSD + feeUSD;
            
            setGasInfo({
              gasPrice: `~${fallbackGasPriceGwei} Gwei`,
              estimatedFee: `~${fallbackFeeNative}`,
              estimatedFeeUSD: `~$${fallbackFeeUSD}`,
              gasPercentage,
              totalCost
            });
          } else if (chainIdNum === 56) {
            // BSC - cheap (typically 2-5 Gwei)
            fallbackGasPriceGwei = '3';
            const feeBnb = (3 * 65000) / 1e9; // 3 Gwei * 65k gas = 0.000195 BNB
            fallbackFeeNative = `${feeBnb.toFixed(8)} BNB`;
            const feeUSD = feeBnb * 600; // ~$0.12
            fallbackFeeUSD = feeUSD.toFixed(4);
            
            const gasPercentage = amountUSD > 0 ? (feeUSD / amountUSD) * 100 : 0;
            const totalCost = amountUSD + feeUSD;
            
            setGasInfo({
              gasPrice: `~${fallbackGasPriceGwei} Gwei`,
              estimatedFee: `~${fallbackFeeNative}`,
              estimatedFeeUSD: `~$${fallbackFeeUSD}`,
              gasPercentage,
              totalCost
            });
          } else {
            return;
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGasInfo();
  }, [chainId, amount, tokenPrice]);

  if (loading) {
    return (
      <div className="text-xs text-gray-500 mt-1">
        <span className="animate-pulse">Loading gas fees...</span>
      </div>
    );
  }

  if (error && !gasInfo) {
    return null; // Don't show error, just hide the component
  }

  if (!gasInfo || !amount || parseFloat(amount) <= 0) {
    return null;
  }

  const amountNum = parseFloat(amount) || 0;
  const tokenPriceValue = tokenPrice || 1;
  const amountUSD = amountNum * tokenPriceValue;
  const gasFeeNum = parseFloat(gasInfo.estimatedFeeUSD.replace(/[^0-9.]/g, '')) || 0;
  const gasPercentage = amountUSD > 0 ? (gasFeeNum / amountUSD) * 100 : 0;
  const totalCost = amountUSD + gasFeeNum;

  return (
    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
      <div className="mb-1.5">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-gray-700">Gas fee (sender pays):</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-600">
            <span className="text-[10px] text-gray-500">Est. gas fee:</span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900">{gasInfo.estimatedFeeUSD}</div>
            <div className="text-gray-500 text-[10px]">{gasInfo.estimatedFee}</div>
          </div>
        </div>
      </div>
      {amountNum > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-200">
          <div className="flex items-center justify-between text-[10px] text-gray-600">
            <span>Gas as % of amount:</span>
            <span className={`font-medium ${gasPercentage > 5 ? 'text-orange-600' : gasPercentage > 1 ? 'text-yellow-600' : 'text-gray-700'}`}>
              {gasPercentage.toFixed(2)}%
            {gasPercentage > 5 && ' ⚠️'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-600 mt-0.5">
            <span>Total cost (amount + gas):</span>
            <span className="font-medium text-gray-900">${totalCost.toFixed(4)}</span>
          </div>
        </div>
      )}
      <div className="mt-1 text-[10px] text-gray-500">
        Gas price: {gasInfo.gasPrice}
      </div>
    </div>
  );
}

