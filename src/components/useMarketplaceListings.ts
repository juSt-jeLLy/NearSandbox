import { useState, useEffect } from 'react';
import { useNearWallet } from 'near-connect-hooks';

const MARKETPLACE_CONTRACT = 'warmowl5525.testnet';

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
  const { viewFunction, signAndSendTransaction } = useNearWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchListings();
  }, [viewFunction]);

  const buyListing = async (product_id: number) => {
    const res = await signAndSendTransaction({
      receiverId: MARKETPLACE_CONTRACT,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: 'buy',
            args: { p_id: product_id },
            gas: THIRTY_TGAS,
            deposit: NO_DEPOSIT
          }
        }
      ]
    });
    return res;
  };

  return { listings, loading, error, buyListing };
};