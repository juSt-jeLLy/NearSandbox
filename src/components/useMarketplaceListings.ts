import { useState, useEffect } from 'react';
import { useNearWallet } from 'near-connect-hooks';
import { toast } from 'sonner';

const MARKETPLACE_CONTRACT = 'marketplace-1770490780.testnet';

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
  const buyListing = async (listing: Listing) => {
    // Validation
    if (!signedAccountId) {
      toast.error('Please connect your NEAR wallet to make a purchase');
      return;
    }

    console.log('Buy clicked for listing:', listing);
    setBuyingListingId(listing.product_id);
    
    try {
      // Execute the buy transaction
      // The contract's buy function will automatically use the connected wallet
      // address (predecessor_account_id) as the buyer
      const res = await signAndSendTransaction({
        receiverId: MARKETPLACE_CONTRACT,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'buy',
              args: { p_id: listing.product_id },
              gas: THIRTY_TGAS,
              deposit: NO_DEPOSIT
            }
          }
        ]
      });
      
      console.log('Purchase transaction successful:', res);
      toast.success(`Successfully purchased Product #${listing.product_id}!`);
      
      // Refresh the listings to show updated data
      await fetchListings();
      
      return res;
      
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
    refetchListings: fetchListings
  };
};