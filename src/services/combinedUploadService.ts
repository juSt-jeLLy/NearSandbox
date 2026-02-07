import { uploadFile, registerGroup } from './novaService';
import { Buffer } from 'buffer';

const MARKETPLACE_CONTRACT = 'marketplace-1770490780.testnet';

export interface CombinedUploadResult {
  // NOVA upload results
  cid: string;
  trans_id: string;
  file_hash: string;
  groupId: string;
  
  // Marketplace listing results
  listingTransactionId: string;
  productId: number;
  
  // File info
  filename: string;
  size: number;
  uploadedAt: string;
}

export interface CombinedUploadProgress {
  step: 'registering_group' | 'uploading_to_nova' | 'creating_listing' | 'complete';
  message: string;
}

// Generate a unique sequential product ID based on timestamp
const generateProductId = (): number => {
  // Use timestamp + random component to ensure uniqueness
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return parseInt(`${timestamp}${random}`);
};

// Extract filename without extension
const getFilenameWithoutExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return filename;
  return filename.substring(0, lastDotIndex);
};

/**
 * Combined upload flow:
 * 1. Register group on NOVA (using filename without extension)
 * 2. Upload file to NOVA
 * 3. Create marketplace listing on NEAR contract
 */
export const uploadAndCreateListing = async (
  file: File,
  assetType: 'Image' | 'Dataset' | 'Audio' | 'Other',
  price: number,
  ownerAccount: string,
  callFunction: any, // NEAR wallet callFunction from useNearWallet
  onProgress?: (progress: CombinedUploadProgress) => void
): Promise<CombinedUploadResult> => {
  
  // Extract group ID from filename (without extension)
  const groupId = getFilenameWithoutExtension(file.name);
  
  // Generate unique product ID
  const productId = generateProductId();
  
  try {
    // Step 1: Register group on NOVA
    onProgress?.({
      step: 'registering_group',
      message: `Creating NOVA group: ${groupId}`
    });
    
    try {
      await registerGroup(groupId);
      console.log(`✅ Group registered: ${groupId}`);
    } catch (e: any) {
      // Group might already exist, which is fine
      if (!e.message?.includes('exists') && !e.message?.includes('already')) {
        console.log('Group may already exist, continuing...');
      }
    }
    
    // Step 2: Upload file to NOVA
    onProgress?.({
      step: 'uploading_to_nova',
      message: 'Encrypting and uploading to IPFS via NOVA...'
    });
    
    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    const uploadResult = await uploadFile(groupId, buffer, file.name);
    console.log(`✅ File uploaded to NOVA. CID: ${uploadResult.cid}`);
    
    // Step 3: Create marketplace listing
    onProgress?.({
      step: 'creating_listing',
      message: 'Creating marketplace listing on NEAR...'
    });
    
    const listingResult = await callFunction({
      contractId: MARKETPLACE_CONTRACT,
      method: 'create_listing',
      args: {
        product_id: productId,
        price: price,
        nova_group_id: groupId,
        list_type: assetType,
        cid: uploadResult.cid,
        gp_owner: ownerAccount,
      },
    });
    
    console.log(`✅ Listing created on marketplace. Product ID: ${productId}`);
    
    // Step 4: Complete
    onProgress?.({
      step: 'complete',
      message: 'Upload and listing creation complete!'
    });
    
    return {
      // NOVA results
      cid: uploadResult.cid,
      trans_id: uploadResult.trans_id,
      file_hash: uploadResult.file_hash,
      groupId: groupId,
      
      // Marketplace results
      listingTransactionId: listingResult?.transaction?.hash || 'pending',
      productId: productId,
      
      // File info
      filename: file.name,
      size: file.size,
      uploadedAt: uploadResult.uploadedAt,
    };
    
  } catch (error: any) {
    console.error('Combined upload failed:', error);
    throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
  }
};