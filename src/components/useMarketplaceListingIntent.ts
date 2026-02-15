import { useState, useEffect } from 'react';
import { useNearWallet } from 'near-connect-hooks';
import { toast } from 'sonner';
import { getNovaCredentials } from '@/services/novaCredentialsService';
import { dryRun, submitDepositTx, getExecutionStatus } from './tryIntent';
import {
  connectMetaMask,
  connectMetaMaskToChain,
  sendOpUsdc,
  sendOpEth,
  sendEthMainnet,
  isMetaMaskInstalled,
} from './opWallet';
import { sendArbEth, sendArbUsdc, sendEthUsdc } from './opWallet';
import type { BuyOptions } from './BuyModal';

// Manual NEAR amount conversion
const parseNearAmount = (amount: string): string => {
  // 1 NEAR = 10^24 yoctoNEAR
  const amountFloat = parseFloat(amount);
  if (isNaN(amountFloat)) {
    throw new Error('Invalid NEAR amount');
  }
  // Multiply by 10^24 and convert to string
  const yoctoAmount = BigInt(Math.floor(amountFloat * 1e24));
  return yoctoAmount.toString();
};

const MARKETPLACE_CONTRACT = 'busyward7488.near';

const THIRTY_TGAS = '30000000000000';
const NO_DEPOSIT = '0';

export interface Listing {
  product_id: number;
  price: number;
  nova_group_id: string;
  owner: string;
  purchase_number: number;
  list_type: 'Image' | 'Dataset' | 'Audio' | 'Other';
  cid: string;
  is_active: boolean;
}

export const useMarketplaceListings = () => {
  const { viewFunction, signAndSendTransaction, signedAccountId } = useNearWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyingListingId, setBuyingListingId] = useState<number | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);

  // Fetch listings from the contract
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await viewFunction({
        contractId: MARKETPLACE_CONTRACT,
        method: 'get_listings'
      });
      
      console.log('Fetched listings:', result);
      setListings(result as Listing[]);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setError('Failed to load listings from the blockchain');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchListings();
  }, [viewFunction]);

  /**
   * Handle direct NEAR payment
   * Transfers NEAR to seller
   */
  const handleNearDirectPayment = async (listing: Listing) => {
    if (!signedAccountId) {
      throw new Error('Wallet not connected');
    }

    // Convert price from cents to NEAR
    // Assuming 1 NEAR = $1 (you may need to adjust this conversion rate)
    const priceInDollars = listing.price / 100;
    const amountInNear = priceInDollars.toString();
    
    // Convert to yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
    const amountYocto = parseNearAmount(amountInNear);

    console.log(`💰 Direct NEAR payment: ${amountInNear} NEAR to ${listing.owner}`);
    console.log(`   Amount in yoctoNEAR: ${amountYocto}`);

    toast.info('Preparing NEAR transfer...');

    // Transfer NEAR to seller
    const transferResult = await signAndSendTransaction({
      receiverId: listing.owner,
      actions: [
        {
          type: 'Transfer',
          params: {
            deposit: amountYocto
          }
        }
      ]
    });

    console.log('✅ NEAR transfer successful:', transferResult);
    toast.success(`Transferred ${amountInNear} NEAR to seller!`);

    return transferResult;
  };

  /**
   * Handle cross-chain payment via 1Click intent
   */
  const handleCrossChainPayment = async (
    listing: Listing, 
    options: BuyOptions
  ) => {
    const { originBlockchain, originSymbol, refundTo } = options;
    const destBlockchain = 'near';
    const destSymbol = 'wNEAR';
    const recipient = listing.owner; // Payment goes to listing owner on NEAR

    // Convert listing.price (cents) to human-readable amount
    const usdcAmount = listing.price / 100;
    const amount = usdcAmount.toString();

    const { quote, depositAddress } = await dryRun(
      originBlockchain,
      originSymbol,
      destBlockchain,
      destSymbol,
      amount,
      refundTo,
      recipient
    );

    console.log('1Click quote for marketplace purchase:', quote);
    console.log('1Click deposit address:', depositAddress);
    setDepositAddress(depositAddress || null);

    if (!depositAddress) {
      throw new Error('Missing 1Click deposit address; cannot proceed with deposit.');
    }

    if (!isMetaMaskInstalled()) {
      toast.error('MetaMask is required. Please install MetaMask and try again.');
      throw new Error('MetaMask not installed');
    }

    const isOp = originBlockchain === 'op';
    const isArb = originBlockchain === 'arb';

    if (isOp) {
      await connectMetaMaskToChain(10); // Optimism
    } else if (isArb) {
      await connectMetaMaskToChain(42161); // Arbitrum One
    } else {
      await connectMetaMaskToChain(1); // Ethereum mainnet
    }

    toast.info('Please confirm the transfer in MetaMask...');

    let txHash: string;
    if (isOp && originSymbol === 'USDC') {
      txHash = await sendOpUsdc(depositAddress, amount);
      toast.success(`USDC sent! Transaction: ${txHash.substring(0, 10)}...`);
    } else if (isOp && originSymbol === 'ETH') {
      txHash = await sendOpEth(depositAddress, amount);
      toast.success(`ETH sent! Transaction: ${txHash.substring(0, 10)}...`);
    } else if (isArb && originSymbol === 'USDC') {
      txHash = await sendArbUsdc(depositAddress, amount);
      toast.success(`USDC sent on Arbitrum! Transaction: ${txHash.substring(0, 10)}...`);
    } else if (isArb && originSymbol === 'ETH') {
      txHash = await sendArbEth(depositAddress, amount);
      toast.success(`ETH sent on Arbitrum! Transaction: ${txHash.substring(0, 10)}...`);
    } else if (!isOp && !isArb && originSymbol === 'ETH') {
      txHash = await sendEthMainnet(depositAddress, amount);
      toast.success(`ETH sent! Transaction: ${txHash.substring(0, 10)}...`);
    } else if (!isOp && !isArb && originSymbol === 'USDC') {
      txHash = await sendEthUsdc(depositAddress, amount);
      toast.success(`USDC sent on Ethereum! Transaction: ${txHash.substring(0, 10)}...`);
    } else {
      throw new Error(`Unsupported origin: ${originBlockchain} ${originSymbol}`);
    }
    console.log('Transfer txHash:', txHash);

    // Submit deposit to 1Click
    toast.info('Submitting deposit to 1Click...');
    const submitResult = await submitDepositTx(txHash, depositAddress);
    console.log('submitDepositTx result:', submitResult);

    // Check execution status
    const status = await getExecutionStatus(depositAddress);
    console.log('1Click execution status:', status);

    toast.success('Cross-chain payment completed!');
    console.log('Cross-chain payment flow completed.');
  };

  /**
   * Main buy function - routes to direct NEAR or cross-chain payment
   */
  const buyListing = async (listing: Listing, options: BuyOptions) => {
    // Validation
    if (!signedAccountId) {
      toast.error('Please connect your NEAR wallet to make a purchase');
      return;
    }

    // Get buyer's NOVA account ID
    const novaCredentials = getNovaCredentials(signedAccountId);
    if (!novaCredentials) {
      toast.error('Please set up your NOVA account first. Click "Setup NOVA" in the navbar.');
      return;
    }

    console.log('Buy clicked for listing:', listing);
    console.log('Buyer NEAR wallet:', signedAccountId);
    console.log('Buyer NOVA account:', novaCredentials.accountId);
    
    setBuyingListingId(listing.product_id);
    
    try {
      const { originBlockchain, originSymbol } = options;
      const isNearDirect = originBlockchain === 'near' && originSymbol === 'wNEAR';

      // Execute payment based on method
      if (isNearDirect) {
        // Direct NEAR payment
        console.log('🔷 Using direct NEAR payment method');
        await handleNearDirectPayment(listing);
      } else {
        // Cross-chain payment via 1Click
        console.log('🔷 Using cross-chain payment method');
        await handleCrossChainPayment(listing, options);
      }

      // After payment is done (either method), call marketplace buy function ONCE
      toast.info('Completing marketplace purchase...');
      
      const buyResult = await signAndSendTransaction({
        receiverId: MARKETPLACE_CONTRACT,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'buy',
              args: { 
                p_id: listing.product_id,
                nova_account_id: novaCredentials.accountId
              },
              gas: THIRTY_TGAS,
              deposit: NO_DEPOSIT
            }
          }
        ]
      });

      console.log('✅ Marketplace purchase successful:', buyResult);
      toast.success(`Successfully purchased Product #${listing.product_id}!`);
      toast.info('Owner will grant you NOVA access to decrypt the file');

      // Refresh listings
      await fetchListings();

      return buyResult;
      
    } catch (err: any) {
      console.error('Failed to purchase:', err);
      
      let errorMessage = 'Failed to complete purchase. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.body) {
        errorMessage = `API Error: ${err.body.message || err.body.error || JSON.stringify(err.body)}`;
      }
      
      toast.error(errorMessage);
      throw err;
      
    } finally {
      setBuyingListingId(null);
    }
  };

  return { 
    listings, 
    loading, 
    error, 
    buyListing,
    buyingListingId,
    depositAddress,
    refetchListings: fetchListings
  };
};