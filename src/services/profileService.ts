import { useNearWallet } from 'near-connect-hooks';

const MARKETPLACE_CONTRACT = 'marketplace-1770490780.testnet';

export interface UserStats {
  listingsCreated: number;
  itemsPurchased: number;
  totalSpent: number;
}

export interface UserListing {
  product_id: number;
  price: number;
  nova_group_id: string;
  owner: string;
  purchase_number: number;
  list_type: 'Image' | 'Dataset' | 'Audio' | 'Other';
  cid: string;
  is_active: boolean;
  buyers: string[];
}

export interface PurchasedItem {
  product_id: number;
  price: number;
  nova_group_id: string;
  owner: string;
  list_type: 'Image' | 'Dataset' | 'Audio' | 'Other';
  cid: string;
}

/**
 * Fetch all listings created by the current user
 */
export const getUserCreatedListings = async (
  viewFunction: any,
  userAccountId: string
): Promise<UserListing[]> => {
  try {
    const allListings = await viewFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'get_listings'
    });
    
    // Filter listings where the user is the owner
    return allListings.filter((listing: UserListing) => 
      listing.owner === userAccountId
    );
  } catch (error) {
    console.error('Failed to fetch user created listings:', error);
    throw error;
  }
};

/**
 * Fetch all items purchased by the current user
 */
export const getUserPurchasedItems = async (
  viewFunction: any,
  userAccountId: string
): Promise<PurchasedItem[]> => {
  try {
    const allListings = await viewFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'get_listings'
    });
    
    // Filter listings where the user is in the buyers list
    return allListings.filter((listing: UserListing) => 
      listing.buyers && listing.buyers.includes(userAccountId)
    ).map((listing: UserListing) => ({
      product_id: listing.product_id,
      price: listing.price,
      nova_group_id: listing.nova_group_id,
      owner: listing.owner,
      list_type: listing.list_type,
      cid: listing.cid,
    }));
  } catch (error) {
    console.error('Failed to fetch user purchased items:', error);
    throw error;
  }
};

/**
 * Calculate user statistics
 */
export const getUserStats = async (
  viewFunction: any,
  userAccountId: string
): Promise<UserStats> => {
  try {
    const [createdListings, purchasedItems] = await Promise.all([
      getUserCreatedListings(viewFunction, userAccountId),
      getUserPurchasedItems(viewFunction, userAccountId)
    ]);
    
    const totalSpent = purchasedItems.reduce((sum, item) => sum + item.price, 0);
    
    return {
      listingsCreated: createdListings.length,
      itemsPurchased: purchasedItems.length,
      totalSpent,
    };
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    throw error;
  }
};