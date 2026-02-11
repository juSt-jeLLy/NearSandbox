import { addGroupMember, revokeGroupMember } from './novaService';

const MARKETPLACE_CONTRACT = 'marketplace-1770852588.testnet';

export interface BuyerAccessStatus {
  buyer: string;
  hasPurchased: boolean;
  hasNovaAccess: boolean;
}

// NEW: Buyer info with NOVA account ID
export interface BuyerWithNovaAccount {
  nearWallet: string;
  novaAccountId: string;
}

/**
 * Grant NOVA access to a buyer who purchased a listing
 * This does THREE things:
 * 1. Fetches buyer's NOVA account ID from contract
 * 2. Adds buyer's NOVA account to NOVA group (so they can decrypt the file)
 * 3. Updates contract to mark buyer as having access
 */
export const grantBuyerAccess = async (
  productId: number,
  novaGroupId: string,
  buyerNearWallet: string,
  viewFunction: any,  // ADDED: Need viewFunction to fetch NOVA account ID
  callFunction: any,
  ownerWallet?: string  // Owner's wallet for NOVA SDK
): Promise<void> => {
  try {
    // Step 1: Get buyer's NOVA account ID from contract
    console.log(`Fetching NOVA account ID for ${buyerNearWallet}...`);
    const buyerNovaAccountId = await viewFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'get_nova_account',
      args: { near_wallet: buyerNearWallet },
    });
    
    if (!buyerNovaAccountId) {
      throw new Error(`No NOVA account found for ${buyerNearWallet}. Buyer must have purchased with NOVA account set up.`);
    }
    
    console.log(`✅ Found NOVA account: ${buyerNovaAccountId}`);
    
    // Step 2: Add buyer's NOVA account to NOVA group (MAINNET)
    console.log(`Adding NOVA account ${buyerNovaAccountId} to group ${novaGroupId}...`);
    await addGroupMember(novaGroupId, buyerNovaAccountId, ownerWallet);
    console.log('✅ Added to NOVA group');
    
    // Step 3: Update contract to mark buyer as having access (TESTNET)
    console.log(`Updating contract to grant access to ${buyerNearWallet}...`);
    await callFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'grant_buyer_access',
      args: {
        p_id: productId,
        buyer: buyerNearWallet,  // Use NEAR wallet for contract
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
 */
export const revokeBuyerAccess = async (
  productId: number,
  novaGroupId: string,
  buyerNearWallet: string,
  viewFunction: any,  // ADDED: Need viewFunction to fetch NOVA account ID
  callFunction: any,
  ownerWallet?: string
): Promise<void> => {
  try {
    // Step 1: Get buyer's NOVA account ID from contract
    console.log(`Fetching NOVA account ID for ${buyerNearWallet}...`);
    const buyerNovaAccountId = await viewFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'get_nova_account',
      args: { near_wallet: buyerNearWallet },
    });
    
    if (!buyerNovaAccountId) {
      console.warn(`No NOVA account found for ${buyerNearWallet}, skipping NOVA group removal`);
    } else {
      // Step 2: Remove buyer's NOVA account from NOVA group (MAINNET)
      console.log(`Removing NOVA account ${buyerNovaAccountId} from group ${novaGroupId}...`);
      await revokeGroupMember(novaGroupId, buyerNovaAccountId, ownerWallet);
      console.log('✅ Removed from NOVA group');
    }
    
    // Step 3: Update contract
    console.log(`Updating contract to revoke access from ${buyerNearWallet}...`);
    await callFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'revoke_buyer_access',
      args: {
        p_id: productId,
        buyer: buyerNearWallet,
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
 * Returns: Array of NEAR wallets (for backward compatibility)
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
 * NEW: Get pending buyers WITH their NOVA account IDs
 * Returns: Array of { nearWallet, novaAccountId }
 */
export const getPendingBuyersWithNovaAccounts = async (
  productId: number,
  viewFunction: any
): Promise<BuyerWithNovaAccount[]> => {
  try {
    const result = await viewFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'get_pending_buyers_with_nova_accounts',
      args: { p_id: productId },
    });
    
    // Contract returns: [(near_wallet, nova_account), ...]
    return result.map((item: [string, string]) => ({
      nearWallet: item[0],
      novaAccountId: item[1],
    }));
  } catch (error) {
    console.error('Failed to get pending buyers with NOVA accounts:', error);
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
 * Fetches NOVA account IDs from contract for each buyer
 */
export const grantAccessToAllPendingBuyers = async (
  productId: number,
  novaGroupId: string,
  viewFunction: any,
  callFunction: any,
  ownerWallet: string,
  onProgress?: (current: number, total: number, buyer: string) => void
): Promise<{ success: string[]; failed: string[] }> => {
  // Get pending buyers (just NEAR wallets)
  const pendingBuyers = await getPendingAccessBuyers(productId, viewFunction);
  
  if (pendingBuyers.length === 0) {
    console.log('No pending buyers found');
    return { success: [], failed: [] };
  }
  
  console.log(`Found ${pendingBuyers.length} pending buyers:`, pendingBuyers);
  
  const success: string[] = [];
  const failed: string[] = [];
  
  for (let i = 0; i < pendingBuyers.length; i++) {
    const buyerNearWallet = pendingBuyers[i];
    onProgress?.(i + 1, pendingBuyers.length, buyerNearWallet);
    
    try {
      // grantBuyerAccess will fetch the NOVA account ID from contract internally
      await grantBuyerAccess(
        productId,
        novaGroupId,
        buyerNearWallet,
        viewFunction,  // Pass viewFunction so it can fetch NOVA account ID
        callFunction,
        ownerWallet
      );
      success.push(buyerNearWallet);
    } catch (error) {
      console.error(`Failed to grant access to ${buyerNearWallet}:`, error);
      failed.push(buyerNearWallet);
    }
  }
  
  return { success, failed };
};