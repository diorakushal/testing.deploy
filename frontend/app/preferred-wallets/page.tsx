'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useSwitchChain, useChainId, useChains } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { isAddress } from 'viem';
import { supabase } from '@/lib/supabase';
import { AVAILABLE_CHAINS, getChainConfig } from '@/lib/tokenConfig';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';

interface PreferredWallet {
  id: string;
  chain_id: number | string;
  receiving_wallet_address: string;
}

export default function PreferredWalletsPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();
  const chains = useChains();
  const { openConnectModal } = useConnectModal();
  
  const [preferredWallets, setPreferredWallets] = useState<PreferredWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectingChain, setConnectingChain] = useState<number | string | null>(null);
  const [user, setUser] = useState<any>(null);
  const currentChainIdRef = { current: currentChainId };
  
  useEffect(() => {
    currentChainIdRef.current = currentChainId;
  }, [currentChainId]);

  const fetchPreferredWallets = async (userId: string) => {
    try {
      const wallets = await api.get('/preferred-wallets', {
        params: { userId }
      });
      setPreferredWallets(Array.isArray(wallets) ? wallets : []);
    } catch (error: any) {
      console.error('Error fetching preferred wallets:', error);
      toast.error('Failed to load preferred wallets');
    }
  };

  useEffect(() => {
    // Non-blocking auth check - redirect in background if needed
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      if (session.user?.id) {
        fetchPreferredWallets(session.user.id);
      }
    };
    checkAuth();
  }, [router]);

  const getWalletForChain = (chainId: number | string): PreferredWallet | undefined => {
    const wallet = preferredWallets.find(w => {
      const walletChainId = typeof w.chain_id === 'string' ? parseInt(w.chain_id) : w.chain_id;
      return walletChainId === chainId;
    });
    return wallet;
  };

  const handleAddWallet = async (targetChainId: number | string) => {
    if (!user?.id) return;
    
    const chainName = getChainConfig(targetChainId as number)?.name || `Chain ${targetChainId}`;
    
    if (!isConnected) {
      if (openConnectModal) {
        openConnectModal();
      }
      return;
    }

    try {
      setConnectingChain(targetChainId as number);
      
      if (currentChainId !== targetChainId && switchChain) {
        toast.loading(`Connecting to ${chainName}...`);
        try {
          await switchChain({ chainId: targetChainId as any });
          await new Promise(resolve => setTimeout(resolve, 2000));
          toast.dismiss();
        } catch (switchError: any) {
          toast.dismiss();
          setConnectingChain(null);
          setLoading(false);
          
          const errorMessage = switchError?.message || switchError?.shortMessage || '';
          const errorCode = switchError?.code;
          
          if (errorCode === 4902 || 
              errorMessage.includes('Unsupported chain') || 
              errorMessage.includes('not support') ||
              errorMessage.includes('Unsupported network') ||
              errorMessage.includes('does not support')) {
            toast.error(`Your wallet doesn't support ${chainName}. Please add the network to your wallet first, then try again.`);
          } else if (errorCode === 4001) {
            toast.error('Chain switch was rejected. Please approve the network switch in your wallet.');
          } else {
            toast.error(errorMessage || `Failed to connect to ${chainName}. Your wallet may not support this network.`);
          }
          return;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const actualChainId = currentChainIdRef.current;
      if (actualChainId !== targetChainId) {
        toast.error(`Failed to switch to ${chainName}. Your wallet may not support this network. Please add the network to your wallet first.`);
        setConnectingChain(null);
        setLoading(false);
        return;
      }
      
      if (!address || !isAddress(address)) {
        toast.error('Invalid wallet address');
        setConnectingChain(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      toast.loading('Saving wallet address...');
      
      const savedWallet = await api.post('/preferred-wallets', {
        userId: user.id,
        chainId: targetChainId,
        receivingWalletAddress: address
      });

      toast.dismiss();
      
      setPreferredWallets(prev => {
        const existing = prev.find(w => {
          const wChainId = typeof w.chain_id === 'string' ? parseInt(w.chain_id) : w.chain_id;
          return wChainId === targetChainId;
        });
        if (existing) {
          return prev.map(w => {
            const wChainId = typeof w.chain_id === 'string' ? parseInt(w.chain_id) : w.chain_id;
            return wChainId === targetChainId ? savedWallet : w;
          });
        } else {
          return [...prev, savedWallet];
        }
      });
      
      await fetchPreferredWallets(user.id);
      
      toast.success('Wallet address saved!');
      setConnectingChain(null);
      setLoading(false);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error adding wallet:', error);
      
      if (error?.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save wallet address. Please ensure your wallet supports this network.');
      }
      
      setConnectingChain(null);
      setLoading(false);
    }
  };

  const handleRemoveWallet = async (walletId: string, chainName: string) => {
    if (!confirm(`Remove wallet for ${chainName}?`)) {
      return;
    }

    try {
      setLoading(true);
      toast.loading('Removing wallet...');
      
      await api.delete(`/preferred-wallets/${walletId}`);
      
      toast.dismiss();
      toast.success('Wallet removed');
      
      if (user?.id) {
        await fetchPreferredWallets(user.id);
      }
      setLoading(false);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error removing wallet:', error);
      toast.error('Failed to remove wallet');
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center">
          {/* Header */}
          <div className="mb-8 w-full max-w-4xl">
            <h1 className="text-3xl font-bold text-black mb-2">Set Preferred Wallets</h1>
            <p className="text-gray-600 text-sm mt-2">
              Connect your wallets for each chain where you want to receive payments. When someone sends you a payment, 
              they'll see your preferred wallet addresses for the chains you've configured.
            </p>
          </div>

          {/* Wallets List */}
          <div className="space-y-3 w-full max-w-4xl">
            {AVAILABLE_CHAINS.map((chain) => {
              const chainId = typeof chain.id === 'string' ? parseInt(chain.id) : chain.id;
              const wallet = getWalletForChain(chainId);
              const isConnecting = connectingChain === chainId;
              
              return (
                <div key={chain.id} className="flex items-center justify-between gap-3 bg-gray-100 rounded-full px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-black">{chain.name}</h3>
                      {wallet && (
                        <span className="text-xs font-mono text-gray-500 truncate">
                          {`${wallet.receiving_wallet_address.slice(0, 6)}...${wallet.receiving_wallet_address.slice(-4)}`}
                        </span>
                      )}
                    </div>
                    {!wallet && (
                      <p className="text-xs text-gray-400 italic mt-0.5">Not set</p>
                    )}
                  </div>
                  {wallet ? (
                    <button
                      onClick={() => handleRemoveWallet(wallet.id, chain.name)}
                      disabled={loading}
                      className="px-4 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 rounded-full hover:bg-red-50 transition-colors whitespace-nowrap"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddWallet(chain.id)}
                      disabled={loading || isConnecting}
                      className="px-4 py-1.5 text-sm bg-gray-200 text-black rounded-full hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isConnecting ? 'Connecting...' : 'Add Wallet'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {!isConnected && (
            <div className="mt-6 w-full max-w-4xl p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Connect your wallet</strong> to add receiving addresses for each chain. 
                Click "Add Wallet" and your wallet extension will prompt you to connect.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

