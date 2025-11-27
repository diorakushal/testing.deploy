'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface WalletConnectProps {
  onConnect: (address: string, balance?: string) => void;
  onDisconnect?: () => void;
}

export default function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const address = accounts[0].address;
        setAccount(address);
        const balance = await updateBalance(address, provider);
        onConnect(address, balance);
      }
    }
  };

  const updateBalance = async (address: string, provider: ethers.BrowserProvider): Promise<string> => {
    try {
      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.formatEther(balance);
      setBalance(formattedBalance);
      return formattedBalance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setIsConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        const address = accounts[0];
        setAccount(address);
        const balance = await updateBalance(address, provider);
        onConnect(address, balance);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setBalance('0');
    onDisconnect?.();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!account) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-900 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md whitespace-nowrap"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-sm font-semibold text-black leading-tight">{formatAddress(account)}</div>
        <div className="text-xs text-gray-500 mt-0.5">{parseFloat(balance).toFixed(4)} MATIC</div>
      </div>
      <button
        onClick={disconnect}
        className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200 border border-gray-200 hover:border-gray-300 active:scale-95 whitespace-nowrap"
      >
        Disconnect
      </button>
    </div>
  );
}

