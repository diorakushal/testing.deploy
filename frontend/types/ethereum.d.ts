interface EthereumProvider {
  isMetaMask?: boolean;
  request(args: { method: string; params?: any[] }): Promise<any>;
  on(event: string, handler: (...args: any[]) => void): void;
  removeListener(event: string, handler: (...args: any[]) => void): void;
}

interface SolanaProvider {
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  isConnected: boolean;
  publicKey?: { toString(): string };
  isPhantom?: boolean; // Phantom-specific
  isMetaMask?: boolean; // MetaMask with Solana support
  isCoinbaseWallet?: boolean; // Coinbase Wallet with Solana support
}

interface Window {
  ethereum?: EthereumProvider;
  solana?: SolanaProvider;
}
