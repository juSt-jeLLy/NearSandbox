/**
 * EVM wallet integration for Optimism (OP) chain
 * Handles MetaMask connection and USDC token transfers
 */

// OP USDC contract address
const OP_USDC_ADDRESS = '0x0b2c639c533813f4aa9d7837caf62653d097ff85';
const OP_CHAIN_ID = 10; // Optimism mainnet

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

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof (window as Window).ethereum !== 'undefined';
};

/**
 * Request connection to MetaMask and switch to Optimism network
 */
export const connectMetaMask = async (): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  const ethereum = (window as Window).ethereum!;

  try {
    // Request account access
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];

    // Check current chain
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(chainId, 16);

    // Switch to Optimism if not already on it
    if (currentChainId !== OP_CHAIN_ID) {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${OP_CHAIN_ID.toString(16)}` }],
        });
      } catch (switchError: any) {
        // If chain doesn't exist, add it
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${OP_CHAIN_ID.toString(16)}`,
                chainName: 'Optimism',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://mainnet.optimism.io'],
                blockExplorerUrls: ['https://optimistic.etherscan.io'],
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

/**
 * Send USDC on Optimism using MetaMask.
 * @param to - Recipient address (1Click deposit address)
 * @param amount - Human-readable amount in USDC (e.g. "0.1" for 0.1 USDC)
 * @returns Transaction hash
 */
export const sendOpUsdc = async (to: string, amount: string): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed.');
  }

  const ethereum = (window as Window).ethereum!;

  // Dynamically import ethers to avoid bundling issues
  const { ethers } = await import('ethers');

  try {
    // Create provider and signer from MetaMask
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const fromAddress = await signer.getAddress();

    // Create USDC contract instance
    const usdcContract = new ethers.Contract(OP_USDC_ADDRESS, ERC20_ABI, signer);

    // Convert human-readable amount (e.g. "0.1") to smallest units (6 decimals for USDC)
    const decimals = 6;
    const amountInSmallestUnits = ethers.parseUnits(amount, decimals);

    // Send transfer transaction
    const tx = await usdcContract.transfer(to, amountInSmallestUnits);
    console.log('OP USDC transfer transaction sent:', tx.hash);

    // Wait for transaction to be mined
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
