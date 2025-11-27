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
}

interface Window {
  ethereum?: EthereumProvider;
  solana?: SolanaProvider;
}
