import { useState, useEffect } from 'react';
import { useNearWallet } from 'near-connect-hooks';

const MARKETPLACE_CONTRACT = '177a0e-718040-1770099193.nearplay.testnet';

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
  const { viewFunction } = useNearWallet();
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

  return { listings, loading, error };
};