'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useSwitchChain, useChainId, useChains } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { isAddress } from 'viem';
import { supabase } from '@/lib/supabase';
import { AVAILABLE_CHAINS, getChainConfig } from '@/lib/tokenConfig';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';

interface PreferredWallet {
  id: string;
  chain_id: number | string; // Database stores as string, but we use numbers
  receiving_wallet_address: string;
}

interface PreferredWalletsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  mandatory?: boolean; // If true, modal cannot be closed until at least one wallet is set up
}

export default function PreferredWalletsModal({ isOpen, onClose, userId, mandatory = false }: PreferredWalletsModalProps) {
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();
  const chains = useChains();
  const { openConnectModal } = useConnectModal();
  
  const [preferredWallets, setPreferredWallets] = useState<PreferredWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectingChain, setConnectingChain] = useState<number | string | null>(null);
  const [editingChain, setEditingChain] = useState<number | string | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const currentChainIdRef = useRef(currentChainId);
  
  // Keep ref in sync with current chain ID
  useEffect(() => {
    currentChainIdRef.current = currentChainId;
  }, [currentChainId]);

  // Fetch preferred wallets on mount and when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchPreferredWallets();
    }
  }, [isOpen, userId]);

  const fetchPreferredWallets = async () => {
    try {
      const wallets = await api.get('/preferred-wallets', {
        params: { userId }
      });
      console.log('Fetched preferred wallets:', wallets);
      setPreferredWallets(Array.isArray(wallets) ? wallets : []);
    } catch (error: any) {
      console.error('Error fetching preferred wallets:', error);
      toast.error('Failed to load preferred wallets');
    }
  };

  const getWalletForChain = (chainId: number | string): PreferredWallet | undefined => {
    const wallet = preferredWallets.find(w => {
      const walletChainId = typeof w.chain_id === 'string' ? parseInt(w.chain_id) : w.chain_id;
      return walletChainId === chainId;
    });
    return wallet;
  };

  const handleAddWallet = async (targetChainId: number | string) => {
    const chainName = getChainConfig(targetChainId as number)?.name || `Chain ${targetChainId}`;
    
    // EVM chains - use existing logic
    if (!isConnected) {
      // Open connect modal if not connected
      if (openConnectModal) {
        openConnectModal();
      }
      return;
    }

    try {
      setConnectingChain(targetChainId as number);
      
      // CRITICAL: First verify wallet can connect to this chain
      // Switch to target chain if needed - this will fail if wallet doesn't support the chain
      if (currentChainId !== targetChainId && switchChain) {
        toast.loading(`Connecting to ${chainName}...`);
        try {
          await switchChain({ chainId: targetChainId as any });
          
          // Wait for chain switch to complete and verify
          // Give it time for the chain to actually switch
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          toast.dismiss();
        } catch (switchError: any) {
          toast.dismiss();
          setConnectingChain(null);
          setLoading(false);
          
          // Check if it's a chain support error
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
          return; // Exit early - don't save if chain switch failed
        }
      } else if (currentChainId === targetChainId) {
        // Already on the correct chain - proceed
      } else {
        // No switchChain function available
        toast.error('Unable to switch chains. Please switch manually in your wallet.');
        setConnectingChain(null);
        setLoading(false);
        return;
      }
      
      // CRITICAL: Verify we're actually on the target chain before saving
      // Some wallets (like Phantom) may show "Unsupported network" but not throw an error
      // We need to check the actual chain ID after the switch attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Re-check the chain ID using the ref - if we're not on the target chain, don't save
      const actualChainId = currentChainIdRef.current;
      if (actualChainId !== targetChainId) {
        toast.error(`Failed to switch to ${chainName}. Your wallet may not support this network. Please add the network to your wallet first.`);
        setConnectingChain(null);
        setLoading(false);
        return; // Don't save if we're not on the target chain
      }
      
      // Get current address (should be on correct chain now)
      if (!address) {
        toast.error('No wallet address found');
        setConnectingChain(null);
        setLoading(false);
        return;
      }

      if (!isAddress(address)) {
        toast.error('Invalid wallet address');
        setConnectingChain(null);
        setLoading(false);
        return;
      }
      
      // IMPORTANT: Add a final check - if the wallet shows "Unsupported network",
      // the user should see the error and not proceed. But if they somehow get here,
      // we should verify the chain one more time before saving.
      // Since we can't directly read currentChainId in this async function,
      // we'll add a user-facing check: only save if switchChain didn't error
      // and we have a valid address. The error handling above should catch most cases.
      
      setLoading(true);
      toast.loading('Saving wallet address...');
      
      const savedWallet = await api.post('/preferred-wallets', {
        userId,
        chainId: targetChainId,
        receivingWalletAddress: address
      });

      toast.dismiss();
      
      // Update state with the saved wallet immediately
      console.log('Saved wallet response:', savedWallet);
      
      // Update the preferredWallets state
      setPreferredWallets(prev => {
        const existing = prev.find(w => {
          const wChainId = typeof w.chain_id === 'string' ? parseInt(w.chain_id) : w.chain_id;
          return wChainId === targetChainId;
        });
        if (existing) {
          // Update existing
          return prev.map(w => {
            const wChainId = typeof w.chain_id === 'string' ? parseInt(w.chain_id) : w.chain_id;
            return wChainId === targetChainId ? savedWallet : w;
          });
        } else {
          // Add new
          return [...prev, savedWallet];
        }
      });
      
      // Refresh from server to ensure we have the latest
      await fetchPreferredWallets();
      
      toast.success('Wallet address saved!');
      setConnectingChain(null);
      setLoading(false);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error adding wallet:', error);
      
      // Provide more specific error messages
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
      
      // Refresh list
      await fetchPreferredWallets();
      setLoading(false);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error removing wallet:', error);
      toast.error('Failed to remove wallet');
      setLoading(false);
    }
  };

  const handleEditWallet = (chainId: number | string, currentAddress?: string) => {
    setEditingChain(chainId);
    setManualAddress(currentAddress || '');
    setAddressError('');
  };

  const handleCancelEdit = () => {
    setEditingChain(null);
    setManualAddress('');
    setAddressError('');
  };

  const handleSaveManualAddress = async (targetChainId: number | string) => {
    const trimmedAddress = manualAddress.trim();
    
    // Validate address
    if (!trimmedAddress) {
      setAddressError('Please enter a wallet address');
      return;
    }

    if (!isAddress(trimmedAddress)) {
      setAddressError('Invalid wallet address format');
      return;
    }

    try {
      setLoading(true);
      setAddressError('');
      toast.loading('Saving wallet address...');
      
      const savedWallet = await api.post('/preferred-wallets', {
        userId,
        chainId: targetChainId,
        receivingWalletAddress: trimmedAddress
      });

      toast.dismiss();
      toast.success('Wallet address saved!');
      
      // Update state
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
      
      // Refresh from server
      await fetchPreferredWallets();
      
      // Reset edit state
      setEditingChain(null);
      setManualAddress('');
      setLoading(false);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error saving manual address:', error);
      
      if (error?.response?.data?.error) {
        setAddressError(error.response.data.error);
        toast.error(error.response.data.error);
      } else {
        setAddressError('Failed to save wallet address');
        toast.error('Failed to save wallet address');
      }
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={mandatory ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white flex-shrink-0 border-b border-gray-200">
          <h2 className="text-lg font-bold text-black tracking-tight">Set Preferred Wallets</h2>
          {!mandatory && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6 flex-1 min-h-0 scrollbar-hide">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Connect your wallets for each chain where you want to receive payments. You can either connect your wallet 
              or manually enter a wallet address. When someone sends you a payment, they'll see your preferred wallet 
              addresses for the chains you've configured.
            </p>

            {/* Wallets Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Chain</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Receiving Wallet</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {AVAILABLE_CHAINS.map((chain) => {
                    const chainId = typeof chain.id === 'string' ? parseInt(chain.id) : chain.id;
                    const wallet = getWalletForChain(chainId);
                    const isConnecting = connectingChain === chainId;
                    
                    return (
                      <tr key={chain.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{chain.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          {editingChain === chainId ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={manualAddress}
                                onChange={(e) => {
                                  setManualAddress(e.target.value);
                                  setAddressError('');
                                }}
                                placeholder="0x..."
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                                  addressError ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={loading}
                              />
                              {addressError && (
                                <p className="text-xs text-red-600">{addressError}</p>
                              )}
                            </div>
                          ) : wallet ? (
                            <span className="text-sm font-mono text-gray-600">
                              {`${wallet.receiving_wallet_address.slice(0, 6)}...${wallet.receiving_wallet_address.slice(-4)}`}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Not set</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingChain === chainId ? (
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={handleCancelEdit}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveManualAddress(chain.id)}
                                disabled={loading || !manualAddress.trim()}
                                className="px-3 py-1.5 text-sm bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loading ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          ) : wallet ? (
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => handleEditWallet(chainId, wallet.receiving_wallet_address)}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleRemoveWallet(wallet.id, chain.name)}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded-full hover:bg-red-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => handleEditWallet(chainId)}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                              >
                                Manual Entry
                              </button>
                              <button
                                onClick={() => handleAddWallet(chain.id)}
                                disabled={loading || isConnecting}
                                className="px-3 py-1.5 text-sm bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!isConnected && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Connect your wallet</strong> to add receiving addresses for each chain. 
                  Click "Add Wallet" and your wallet extension will prompt you to connect.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={mandatory && preferredWallets.length === 0}
            className={`w-full px-4 py-2 rounded-full transition-colors font-semibold text-sm ${
              mandatory && preferredWallets.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-black hover:bg-gray-300'
            }`}
          >
            {mandatory && preferredWallets.length === 0 
              ? 'Add at least one wallet to continue' 
              : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}

