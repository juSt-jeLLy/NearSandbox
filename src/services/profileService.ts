import { getPendingAccessBuyers, getBuyersWithAccess, checkBuyerAccess } from './buyerAccessService';
import { retrieveFile } from './novaService';
import { toast } from 'sonner';

const MARKETPLACE_CONTRACT = 'marketplace-1770852588.testnet';

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

// Extended types with access info
export interface ListingWithAccessInfo extends UserListing {
  pendingBuyers: number;
  activeBuyers: number;
}

export interface PurchasedItemWithAccessInfo extends PurchasedItem {
  hasAccess: boolean;
  accessStatus: 'pending' | 'granted' | 'unknown';
}

/**
 * Retrieve and download a file from NOVA
 * Only works if the buyer has been granted access to the NOVA group
 * Client-side only - requires browser APIs
 */
export const retrieveAndDownloadFile = async (
  novaGroupId: string,
  cid: string,
  productId: number,
  listType: string,
  buyerWallet?: string  // CRITICAL: Added buyer's wallet parameter
): Promise<void> => {
  // Ensure we're in browser environment (required for download)
  if (typeof window === 'undefined') {
    throw new Error('Download function can only be called in browser environment');
  }
  
  try {
    toast.info('Retrieving file from NOVA...');
    
    // CRITICAL: Pass buyerWallet to retrieveFile so it uses the correct credentials
    const result = await retrieveFile(novaGroupId, cid, buyerWallet);
    
    // Convert Buffer to Uint8Array for browser compatibility
    // This works because Buffer extends Uint8Array in Node.js
    const uint8Array = new Uint8Array(result.data);
    
    // Create a blob from the decrypted data
    const blob = new Blob([uint8Array], { 
      type: getMimeType(listType) 
    });
    
    // Generate filename based on product ID and type
    const filename = generateFilename(productId, listType, cid);
    
    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success(`File downloaded: ${filename}`);
    
  } catch (error: any) {
    console.error('Failed to retrieve and download file:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('not authorized')) {
      toast.error('Access denied. You may not have been granted NOVA access yet.');
    } else if (error.message?.includes('not found')) {
      toast.error('File not found on IPFS. The CID may be invalid.');
    } else if (error.message?.includes('wallet connected')) {
      toast.error('Wallet not connected. Please connect your wallet and try again.');
    } else {
      toast.error(`Download failed: ${error.message || 'Unknown error'}`);
    }
    
    throw error;
  }
};

/**
 * Get MIME type based on asset type
 */
const getMimeType = (listType: string): string => {
  switch (listType) {
    case 'Image':
      return 'image/png'; // Default to PNG, could be more sophisticated
    case 'Audio':
      return 'audio/mpeg';
    case 'Dataset':
      return 'application/octet-stream';
    case 'Other':
    default:
      return 'application/octet-stream';
  }
};

/**
 * Generate filename for download
 */
const generateFilename = (productId: number, listType: string, cid: string): string => {
  const extension = getFileExtension(listType);
  const cidShort = cid.substring(0, 8); // First 8 chars of CID
  return `product_${productId}_${cidShort}.${extension}`;
};

/**
 * Get file extension based on asset type
 */
const getFileExtension = (listType: string): string => {
  switch (listType) {
    case 'Image':
      return 'png';
    case 'Audio':
      return 'mp3';
    case 'Dataset':
      return 'zip';
    case 'Other':
    default:
      return 'bin';
  }
};

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
 * Fetch all listings created by user WITH access status info
 */
export const getUserCreatedListingsWithAccess = async (
  viewFunction: any,
  userAccountId: string
): Promise<ListingWithAccessInfo[]> => {
  try {
    const listings = await getUserCreatedListings(viewFunction, userAccountId);
    
    // Fetch access info for each listing
    const listingsWithAccess = await Promise.all(
      listings.map(async (listing) => {
        try {
          const [pending, active] = await Promise.all([
            getPendingAccessBuyers(listing.product_id, viewFunction),
            getBuyersWithAccess(listing.product_id, viewFunction),
          ]);
          
          return {
            ...listing,
            pendingBuyers: pending.length,
            activeBuyers: active.length,
          } as ListingWithAccessInfo;
        } catch (e) {
          console.error(`Failed to fetch access info for listing ${listing.product_id}:`, e);
          return {
            ...listing,
            pendingBuyers: 0,
            activeBuyers: 0,
          } as ListingWithAccessInfo;
        }
      })
    );
    
    return listingsWithAccess;
  } catch (error) {
    console.error('Failed to fetch user created listings with access:', error);
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
 * Fetch all items purchased by user WITH access status info
 */
export const getUserPurchasedItemsWithAccess = async (
  viewFunction: any,
  userAccountId: string
): Promise<PurchasedItemWithAccessInfo[]> => {
  try {
    const purchased = await getUserPurchasedItems(viewFunction, userAccountId);
    
    // Check access status for each purchased item
    const purchasedWithAccess = await Promise.all(
      purchased.map(async (item) => {
        try {
          const hasAccess = await checkBuyerAccess(
            item.product_id,
            userAccountId,
            viewFunction
          );
          
          return {
            ...item,
            hasAccess,
            accessStatus: hasAccess ? 'granted' : 'pending',
          } as PurchasedItemWithAccessInfo;
        } catch (e) {
          console.error(`Failed to check access for item ${item.product_id}:`, e);
          return {
            ...item,
            hasAccess: false,
            accessStatus: 'unknown',
          } as PurchasedItemWithAccessInfo;
        }
      })
    );
    
    return purchasedWithAccess;
  } catch (error) {
    console.error('Failed to fetch user purchased items with access:', error);
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

/**
 * Get comprehensive user profile data with access info
 * One-stop function to fetch everything needed for profile page
 */
export const getUserProfileData = async (
  viewFunction: any,
  userAccountId: string
) => {
  try {
    const [stats, createdListings, purchasedItems] = await Promise.all([
      getUserStats(viewFunction, userAccountId),
      getUserCreatedListingsWithAccess(viewFunction, userAccountId),
      getUserPurchasedItemsWithAccess(viewFunction, userAccountId),
    ]);
    
    return {
      stats,
      createdListings,
      purchasedItems,
    };
  } catch (error) {
    console.error('Failed to fetch user profile data:', error);
    throw error;
  }
};