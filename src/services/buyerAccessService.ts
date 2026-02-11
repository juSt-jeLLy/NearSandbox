import { addGroupMember, revokeGroupMember } from './novaService';

const MARKETPLACE_CONTRACT = 'vitalhare6068.near';

export interface BuyerAccessStatus {
  buyer: string;
  hasPurchased: boolean;
  hasNovaAccess: boolean;
}

/**
 * Grant NOVA access to a buyer who purchased a listing
 * This does TWO things:
 * 1. Adds buyer to NOVA group (so they can decrypt the file)
 * 2. Updates contract to mark buyer as having access
 */
export const grantBuyerAccess = async (
  productId: number,
  novaGroupId: string,
  buyerAccountId: string,
  callFunction: any,
  ownerWallet?: string  // Added: Owner's wallet for NOVA SDK
): Promise<void> => {
  try {
    // Step 1: Add buyer to NOVA group (MAINNET)
    console.log(`Adding ${buyerAccountId} to NOVA group ${novaGroupId}...`);
    // CRITICAL: Pass ownerWallet to addGroupMember so it uses the correct credentials
    await addGroupMember(novaGroupId, buyerAccountId, ownerWallet);
    console.log('✅ Added to NOVA group');
    
    // Step 2: Update contract to mark buyer as having access (TESTNET)
    console.log(`Updating contract to grant access...`);
    await callFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'grant_buyer_access',
      args: {
        p_id: productId,
        buyer: buyerAccountId,
      },
    });
    console.log('✅ Contract updated - buyer has access');
    
  } catch (error: any) {
    console.error('Failed to grant buyer access:', error);
    throw new Error(`Failed to grant access: ${error.message}`);
  }
};

/**
 * Revoke NOVA access from a buyer
 * This does TWO things:
 * 1. Removes buyer from NOVA group (so they can no longer decrypt)
 * 2. Updates contract to mark buyer as no longer having access
 */
export const revokeBuyerAccess = async (
  productId: number,
  novaGroupId: string,
  buyerAccountId: string,
  callFunction: any,
  ownerWallet?: string  // Added: Owner's wallet for NOVA SDK
): Promise<void> => {
  try {
    // Step 1: Remove buyer from NOVA group (MAINNET)
    console.log(`Removing ${buyerAccountId} from NOVA group ${novaGroupId}...`);
    // CRITICAL: Pass ownerWallet to revokeGroupMember
    await revokeGroupMember(novaGroupId, buyerAccountId, ownerWallet);
    console.log('✅ Removed from NOVA group');
    
    // Step 2: Update contract to mark buyer as no longer having access (TESTNET)
    console.log(`Updating contract to revoke access...`);
    await callFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'revoke_buyer_access',
      args: {
        p_id: productId,
        buyer: buyerAccountId,
      },
    });
    console.log('✅ Contract updated - buyer access revoked');
    
  } catch (error: any) {
    console.error('Failed to revoke buyer access:', error);
    throw new Error(`Failed to revoke access: ${error.message}`);
  }
};

/**
 * Get all buyers who purchased but don't have NOVA access yet
 * Owner should grant access to these buyers
 */
export const getPendingAccessBuyers = async (
  productId: number,
  viewFunction: any
): Promise<string[]> => {
  try {
    const buyers = await viewFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'get_pending_access_buyers',
      args: { p_id: productId },
    });
    return buyers as string[];
  } catch (error) {
    console.error('Failed to get pending buyers:', error);
    return [];
  }
};

/**
 * Get all buyers who have NOVA access
 */
export const getBuyersWithAccess = async (
  productId: number,
  viewFunction: any
): Promise<string[]> => {
  try {
    const buyers = await viewFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'get_buyers_with_access',
      args: { p_id: productId },
    });
    return buyers as string[];
  } catch (error) {
    console.error('Failed to get buyers with access:', error);
    return [];
  }
};

/**
 * Check if a specific buyer has NOVA access to decrypt the file
 */
export const checkBuyerAccess = async (
  productId: number,
  buyerAccountId: string,
  viewFunction: any
): Promise<boolean> => {
  try {
    const hasAccess = await viewFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'has_access',
      args: {
        p_id: productId,
        buyer: buyerAccountId,
      },
    });
    return hasAccess as boolean;
  } catch (error) {
    console.error('Failed to check buyer access:', error);
    return false;
  }
};

/**
 * Get comprehensive access status for a buyer
 */
export const getBuyerAccessStatus = async (
  productId: number,
  buyerAccountId: string,
  viewFunction: any
): Promise<BuyerAccessStatus> => {
  try {
    const [hasPurchased, hasNovaAccess] = await Promise.all([
      viewFunction({
        contractId: MARKETPLACE_CONTRACT,
        method: 'has_purchased',
        args: { p_id: productId, account_id: buyerAccountId },
      }),
      viewFunction({
        contractId: MARKETPLACE_CONTRACT,
        method: 'has_access',
        args: { p_id: productId, buyer: buyerAccountId },
      }),
    ]);

    return {
      buyer: buyerAccountId,
      hasPurchased: hasPurchased as boolean,
      hasNovaAccess: hasNovaAccess as boolean,
    };
  } catch (error) {
    console.error('Failed to get buyer access status:', error);
    return {
      buyer: buyerAccountId,
      hasPurchased: false,
      hasNovaAccess: false,
    };
  }
};

/**
 * Batch grant access to all pending buyers
 * Use this after multiple purchases to grant everyone access at once
 */
export const grantAccessToAllPendingBuyers = async (
  productId: number,
  novaGroupId: string,
  viewFunction: any,
  callFunction: any,
  ownerWallet: string,  // CRITICAL: Added owner's wallet parameter
  onProgress?: (current: number, total: number, buyer: string) => void
): Promise<{ success: string[]; failed: string[] }> => {
  const pendingBuyers = await getPendingAccessBuyers(productId, viewFunction);
  
  const success: string[] = [];
  const failed: string[] = [];
  
  for (let i = 0; i < pendingBuyers.length; i++) {
    const buyer = pendingBuyers[i];
    onProgress?.(i + 1, pendingBuyers.length, buyer);
    
    try {
      // CRITICAL: Pass ownerWallet to grantBuyerAccess
      await grantBuyerAccess(productId, novaGroupId, buyer, callFunction, ownerWallet);
      success.push(buyer);
    } catch (error) {
      console.error(`Failed to grant access to ${buyer}:`, error);
      failed.push(buyer);
    }
  }
  
  return { success, failed };
};