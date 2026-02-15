const OP_USDC_ADDRESS = '0x0b2c639c533813f4aa9d7837caf62653d097ff85';
const ARB_USDC_ADDRESS = '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8';
const ETH_USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const OP_CHAIN_ID = 10; // Optimism mainnet
const ETH_CHAIN_ID = 1; // Ethereum mainnet
const ARB_CHAIN_ID = 42161; // Arbitrum One mainnet

// ERC20 ABI - minimal ABI for transfer function
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function decimals() external view returns (uint8)',
  'function balanceOf(address account) external view returns (uint256)',
];

interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    isMetaMask?: boolean;
    selectedAddress?: string;
  };
}

export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof (window as Window).ethereum !== 'undefined';
};

const CHAIN_CONFIGS: Record<number, { chainName: string; rpcUrls: string[]; blockExplorerUrls: string[] }> = {
  [OP_CHAIN_ID]: {
    chainName: 'Optimism',
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
  },
  [ETH_CHAIN_ID]: {
    chainName: 'Ethereum Mainnet',
    rpcUrls: ['https://eth.llamarpc.com'],
    blockExplorerUrls: ['https://etherscan.io'],
  },
  [ARB_CHAIN_ID]: {
    chainName: 'Arbitrum One',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
  },
};


export const connectMetaMaskToChain = async (chainId: number): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  const ethereum = (window as Window).ethereum!;

  try {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];

    const currentChainIdHex = await ethereum.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(currentChainIdHex as string, 16);

    if (currentChainId !== chainId) {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          const config = CHAIN_CONFIGS[chainId];
          if (!config) throw new Error(`Unsupported chain: ${chainId}`);
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${chainId.toString(16)}`,
                chainName: config.chainName,
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: config.rpcUrls,
                blockExplorerUrls: config.blockExplorerUrls,
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    }

    return account;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected MetaMask connection request.');
    }
    throw new Error(`Failed to connect MetaMask: ${error.message}`);
  }
};


export const connectMetaMask = async (): Promise<string> => connectMetaMaskToChain(OP_CHAIN_ID);


export const sendOpUsdc = async (to: string, amount: string): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed.');
  }

  const ethereum = (window as Window).ethereum!;

  const { ethers } = await import('ethers');

  try {

    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const fromAddress = await signer.getAddress();

    // Create USDC contract instance
    const usdcContract = new ethers.Contract(OP_USDC_ADDRESS, ERC20_ABI, signer);

    // Convert human-readable amount (e.g. "0.1") to smallest units (6 decimals for USDC)
    const decimals = 6;
    const amountInSmallestUnits = ethers.parseUnits(amount, decimals);

    const tx = await usdcContract.transfer(to, amountInSmallestUnits);
    console.log('OP USDC transfer transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('OP USDC transfer confirmed:', receipt);

    return tx.hash;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected transaction in MetaMask.');
    }
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient USDC balance on Optimism.');
    }
    throw new Error(`Failed to send OP USDC: ${error.message}`);
  }
};


export const sendArbEth = async (to: string, amount: string): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed.');
  }

  const ethereum = (window as Window).ethereum!;
  const { ethers } = await import('ethers');

  try {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const amountWei = ethers.parseEther(amount);
    const tx = await signer.sendTransaction({ to, value: amountWei });
    console.log('Arbitrum ETH transfer sent:', tx.hash);
    await tx.wait();
    return tx.hash;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected transaction in MetaMask.');
    }
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient ETH balance on Arbitrum.');
    }
    throw new Error(`Failed to send Arbitrum ETH: ${error.message}`);
  }
};


export const sendArbUsdc = async (to: string, amount: string): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed.');
  }

  const ethereum = (window as Window).ethereum!;
  const { ethers } = await import('ethers');

  try {
  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();

  // Create USDC contract instance for Arbitrum
  const usdcContract = new ethers.Contract(ARB_USDC_ADDRESS, ERC20_ABI, signer);

  // USDC uses 6 decimals
  const decimals = 6;
  const amountInSmallestUnits = ethers.parseUnits(amount, decimals);

  // Send ERC20 transfer
  const tx = await usdcContract.transfer(to, amountInSmallestUnits);
  console.log('Arbitrum USDC transfer transaction sent:', tx.hash);
  const receipt = await tx.wait();
  console.log('Arbitrum USDC transfer confirmed:', receipt);
  return tx.hash;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected transaction in MetaMask.');
    }
    throw new Error(`Failed to send Arbitrum USDC: ${error.message}`);
  }
};


export const sendOpEth = async (to: string, amount: string): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed.');
  }

  const ethereum = (window as Window).ethereum!;
  const { ethers } = await import('ethers');

  try {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const amountWei = ethers.parseEther(amount);
    const tx = await signer.sendTransaction({ to, value: amountWei });
    console.log('OP ETH transfer transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('OP ETH transfer confirmed:', receipt);
    return tx.hash;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected transaction in MetaMask.');
    }
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient ETH balance on Optimism.');
    }
    throw new Error(`Failed to send OP ETH: ${error.message}`);
  }
};

/**
 * Send native ETH on Ethereum mainnet using MetaMask.
 */
export const sendEthMainnet = async (to: string, amount: string): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed.');
  }

  const ethereum = (window as Window).ethereum!;
  const { ethers } = await import('ethers');

  try {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const amountWei = ethers.parseEther(amount);
    const tx = await signer.sendTransaction({ to, value: amountWei });
    console.log('ETH mainnet transfer sent:', tx.hash);
    await tx.wait();
    return tx.hash;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected transaction in MetaMask.');
    }
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient ETH balance.');
    }
    throw new Error(`Failed to send ETH: ${error.message}`);
  }
};


export const sendEthUsdc = async (to: string, amount: string): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed.');
  }

  const ethereum = (window as Window).ethereum!;
  const { ethers } = await import('ethers');

  try {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();

    const usdcContract = new ethers.Contract(ETH_USDC_ADDRESS, ERC20_ABI, signer);
    const decimals = 6;
    const amountInSmallestUnits = ethers.parseUnits(amount, decimals);

    const tx = await usdcContract.transfer(to, amountInSmallestUnits);
    console.log('ETH USDC transfer transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('ETH USDC transfer confirmed:', receipt);
    return tx.hash;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected transaction in MetaMask.');
    }
    throw new Error(`Failed to send ETH USDC: ${error.message}`);
  }
};

/**
 * Get USDC balance on Optimism for connected wallet
 */
export const getOpUsdcBalance = async (): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed.');
  }

  const ethereum = (window as Window).ethereum!;
  const { ethers } = await import('ethers');

  try {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    const usdcContract = new ethers.Contract(OP_USDC_ADDRESS, ERC20_ABI, provider);
    const balance = await usdcContract.balanceOf(address);
    const decimals = await usdcContract.decimals();

    // Format balance with decimals
    return ethers.formatUnits(balance, decimals);
  } catch (error: any) {
    throw new Error(`Failed to get OP USDC balance: ${error.message}`);
  }
};
