import { addGroupMember, revokeGroupMember } from './novaService';

const MARKETPLACE_CONTRACT = 'marketplace-1770849736.testnet';

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
 * IMPROVED: First gets all pending buyers with NOVA accounts, then processes them
 */
export const grantAccessToAllPendingBuyers = async (
  productId: number,
  novaGroupId: string,
  viewFunction: any,
  callFunction: any,
  ownerWallet: string,
  onProgress?: (current: number, total: number, buyer: string) => void
): Promise<{ success: string[]; failed: string[] }> => {
  try {
    // STEP 1: Get all pending buyers with their NOVA account IDs from contract
    console.log('\n' + '='.repeat(80));
    console.log(`📋 FETCHING PENDING BUYERS FOR PRODUCT #${productId}`);
    console.log('='.repeat(80));
    
    const pendingBuyersWithNova = await viewFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'get_pending_buyers_with_nova_accounts',
      args: { p_id: productId },
    });
    
    if (!pendingBuyersWithNova || pendingBuyersWithNova.length === 0) {
      console.log('No pending buyers found');
      return { success: [], failed: [] };
    }
    
    // STEP 2: Display all buyers and their NOVA accounts
    console.log(`Total pending buyers: ${pendingBuyersWithNova.length}\n`);
    
    pendingBuyersWithNova.forEach((item: [string, string], index: number) => {
      const [nearWallet, novaAccountId] = item;
      console.log(`${index + 1}. NEAR Wallet: ${nearWallet}`);
      console.log(`   NOVA Account: ${novaAccountId}`);
      console.log('');
    });
    console.log('='.repeat(80) + '\n');
    
    const success: string[] = [];
    const failed: string[] = [];
    
    // STEP 3: Process each buyer - Add to NOVA group, then update contract
    for (let i = 0; i < pendingBuyersWithNova.length; i++) {
      const [nearWallet, novaAccountId] = pendingBuyersWithNova[i];
      onProgress?.(i + 1, pendingBuyersWithNova.length, nearWallet);
      
      console.log(`\n🔄 Processing buyer ${i + 1}/${pendingBuyersWithNova.length}:`);
      console.log(`   NEAR Wallet: ${nearWallet}`);
      console.log(`   NOVA Account: ${novaAccountId}`);
      
      try {
        // Sub-step 1: Add NOVA account to NOVA group
        console.log(`   → Adding ${novaAccountId} to NOVA group ${novaGroupId}...`);
        await addGroupMember(novaGroupId, novaAccountId, ownerWallet);
        console.log(`   ✅ Added to NOVA group`);
        
        // Sub-step 2: Update contract with NEAR wallet
        console.log(`   → Updating contract for ${nearWallet}...`);
        await callFunction({
          contractId: MARKETPLACE_CONTRACT,
          method: 'grant_buyer_access',
          args: {
            p_id: productId,
            buyer: nearWallet,  // Use NEAR wallet for contract
          },
        });
        console.log(`   ✅ Contract updated`);
        console.log(`   ✅ SUCCESS: ${nearWallet} now has full access`);
        
        success.push(nearWallet);
      } catch (error: any) {
        console.error(`   ❌ FAILED for ${nearWallet}:`, error);
        failed.push(nearWallet);
      }
    }
    
    // STEP 4: Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 GRANT ACCESS SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Successfully granted access: ${success.length}/${pendingBuyersWithNova.length}`);
    console.log(`❌ Failed: ${failed.length}/${pendingBuyersWithNova.length}`);
    if (success.length > 0) {
      console.log(`\n✅ Success list:`);
      success.forEach((wallet, idx) => console.log(`   ${idx + 1}. ${wallet}`));
    }
    if (failed.length > 0) {
      console.log(`\n❌ Failed list:`);
      failed.forEach((wallet, idx) => console.log(`   ${idx + 1}. ${wallet}`));
    }
    console.log('='.repeat(80) + '\n');
    
    return { success, failed };
  } catch (error: any) {
    console.error('Failed to grant access to pending buyers:', error);
    throw new Error(`Batch grant access failed: ${error.message}`);
  }
};

/**
 * NEW: Test function - Grant contract access only (NO NOVA group access)
 * This is for testing the contract flow without actually granting decryption access
 */
export const testGrantAccessToAllPendingBuyers = async (
  productId: number,
  viewFunction: any,
  callFunction: any,
  onProgress?: (current: number, total: number, buyer: string) => void
): Promise<{ success: string[]; failed: string[] }> => {
  try {
    // STEP 1: Get all pending buyers with their NOVA account IDs from contract
    console.log('\n' + '='.repeat(80));
    console.log(`🧪 TEST MODE: FETCHING PENDING BUYERS FOR PRODUCT #${productId}`);
    console.log('='.repeat(80));
    
    const pendingBuyersWithNova = await viewFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'get_pending_buyers_with_nova_accounts',
      args: { p_id: productId },
    });
    
    if (!pendingBuyersWithNova || pendingBuyersWithNova.length === 0) {
      console.log('No pending buyers found');
      return { success: [], failed: [] };
    }
    
    // STEP 2: Display all buyers and their NOVA accounts
    console.log(`Total pending buyers: ${pendingBuyersWithNova.length}\n`);
    
    pendingBuyersWithNova.forEach((item: [string, string], index: number) => {
      const [nearWallet, novaAccountId] = item;
      console.log(`${index + 1}. NEAR Wallet: ${nearWallet}`);
      console.log(`   NOVA Account: ${novaAccountId}`);
      console.log('');
    });
    console.log('='.repeat(80) + '\n');
    
    const success: string[] = [];
    const failed: string[] = [];
    
    // STEP 3: Grant contract access only (NO NOVA)
    console.log('🧪 TEST MODE: Updating contract only (NO NOVA group access)\n');
    
    for (let i = 0; i < pendingBuyersWithNova.length; i++) {
      const [nearWallet, novaAccountId] = pendingBuyersWithNova[i];
      onProgress?.(i + 1, pendingBuyersWithNova.length, nearWallet);
      
      console.log(`\n🔄 Processing buyer ${i + 1}/${pendingBuyersWithNova.length}:`);
      console.log(`   NEAR Wallet: ${nearWallet}`);
      console.log(`   NOVA Account: ${novaAccountId} (NOT adding to NOVA group)`);
      
      try {
        // Update contract only (NO NOVA GROUP UPDATE)
        console.log(`   → Updating contract for ${nearWallet}...`);
        await callFunction({
          contractId: MARKETPLACE_CONTRACT,
          method: 'grant_buyer_access',
          args: {
            p_id: productId,
            buyer: nearWallet,  // NEAR wallet address
          },
        });
        console.log(`   ✅ Contract updated (buyer still CANNOT decrypt)`);
        
        success.push(nearWallet);
      } catch (error: any) {
        console.error(`   ❌ Failed to update contract:`, error);
        failed.push(nearWallet);
      }
    }
    
    // STEP 4: Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Contract updated: ${success.length}/${pendingBuyersWithNova.length}`);
    console.log(`Failed: ${failed.length}/${pendingBuyersWithNova.length}`);
    console.log(`NOVA accounts found: ${pendingBuyersWithNova.length}/${pendingBuyersWithNova.length}`);
    console.log('='.repeat(80));
    console.log('⚠️  NOTE: This is CONTRACT ONLY - buyers still CANNOT decrypt files');
    console.log('    (No NOVA group access was granted)');
    console.log('='.repeat(80) + '\n');
    
    if (success.length > 0) {
      console.log(`\n✅ Contract updated for:`);
      success.forEach((wallet, idx) => console.log(`   ${idx + 1}. ${wallet}`));
    }
    if (failed.length > 0) {
      console.log(`\n❌ Failed for:`);
      failed.forEach((wallet, idx) => console.log(`   ${idx + 1}. ${wallet}`));
    }
    console.log('');
    
    return { success, failed };
  } catch (error: any) {
    console.error('Test grant access failed:', error);
    throw new Error(`Test failed: ${error.message}`);
  }
};