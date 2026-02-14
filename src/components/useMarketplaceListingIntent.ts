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

  // Buy listing function with all the logic
  /**
   * Full purchase flow:
   * 1. User chooses origin chain/token and refund address (via BuyModal).
   * 2. Create 1Click quote (origin -> wNEAR) and get deposit address.
   * 3. Connect MetaMask and send origin token to deposit address.
   * 4. Submit deposit txHash to 1Click API.
   * 5. (Optional) Execute NEAR marketplace buy transaction.
   */
  const buyListing = async (listing: Listing, options: BuyOptions) => {
    // Validation
    if (!signedAccountId) {
      toast.error('Please connect your NEAR wallet to make a purchase');
      return;
    }

    // CRITICAL: Get buyer's NOVA account ID from stored credentials
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
      const { originBlockchain, originSymbol, refundTo } = options;
      const destBlockchain = 'near';
      const destSymbol = 'wNEAR';
      const recipient = listing.owner; // Payment goes to listing owner on NEAR

      // Convert listing.price (cents) to human-readable amount
      //to do: if the symbol is eth then convert usdc amt into eth 
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
      console.log('1Click deposit address :', depositAddress);
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
      const isEthNative = originSymbol === 'ETH';

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

      // Step 3: Tell 1Click about the OP transaction
      toast.info('Submitting deposit to 1Click...');
      const submitResult = await submitDepositTx(txHash, depositAddress);
      console.log('submitDepositTx result:', submitResult);

      // Step 4: Check execution status (optional - you can poll here if needed)
      const status = await getExecutionStatus(depositAddress);
      console.log('1Click execution status:', status);

      // Step 5: Execute the NEAR marketplace buy transaction
      // COMMENTED OUT FOR TESTING - Focusing on NEAR intent (cross-chain payment) only
      // toast.info('Completing purchase on NEAR...');
      // const res = await signAndSendTransaction({
      //   receiverId: MARKETPLACE_CONTRACT,
      //   actions: [
      //     {
      //       type: 'FunctionCall',
      //       params: {
      //         methodName: 'buy',
      //         args: { 
      //           p_id: listing.product_id,
      //           nova_account_id: novaCredentials.accountId
      //         },
      //         gas: THIRTY_TGAS,
      //         deposit: NO_DEPOSIT
      //       }
      //     }
      //   ]
      // });
      
      // console.log('Purchase transaction successful:', res);
      // toast.success(`Successfully purchased Product #${listing.product_id}!`);
      // toast.info('Owner will grant you NOVA access to decrypt the file');
      
      // // Refresh the listings to show updated data
      // await fetchListings();
      
      // return res;

      toast.success('Cross-chain payment completed! NEAR intent executed successfully.');
      console.log('Cross-chain payment flow completed. NEAR marketplace buy skipped for testing.');
      
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