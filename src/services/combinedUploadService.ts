import { uploadFile, registerGroup } from './novaService';
import { Buffer } from 'buffer';

const MARKETPLACE_CONTRACT = 'vitalhare6068.near';

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


const generateGroupId = (filename: string): string => {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Sanitize - replace special characters with underscore
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
  
  // Generate random 4-digit number
  const random = Math.floor(Math.random() * 10000);
  
  // Format: filename_random
  return `${sanitized}_${random}`;
};


const generateProductId = (): number => {
  const timestampSeconds = Math.floor(Date.now() / 1000);
  const random = Math.floor(Math.random() * 1000);
  
  // Create a number that won't exceed Number.MAX_SAFE_INTEGER
  // Format: timestamp(10 digits) + random(3 digits) = 13 digits max
  return timestampSeconds * 1000 + random;
};


export const uploadAndCreateListing = async (
  file: File,
  assetType: 'Image' | 'Dataset' | 'Audio' | 'Other',
  price: number,
  ownerAccount: string,
  callFunction: any,
  onProgress?: (progress: CombinedUploadProgress) => void
): Promise<CombinedUploadResult> => {
  
  // Generate group ID from filename + random number
  const groupId = generateGroupId(file.name);
  
  // Generate unique product ID
  const productId = generateProductId();
  
  try {
    // Step 1: Register group on NOVA
    onProgress?.({
      step: 'registering_group',
      message: `Creating NOVA group: ${groupId}`
    });
    
    // IMPORTANT: Pass ownerAccount (NEAR wallet) to registerGroup
    await registerGroup(groupId, ownerAccount);
    console.log(`✅ Group registered: ${groupId}`);
    
    // Step 2: Upload file to NOVA
    onProgress?.({
      step: 'uploading_to_nova',
      message: 'Encrypting and uploading to IPFS via NOVA...'
    });
    
    // Read file as ArrayBuffer and convert to Buffer (works in both environments)
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // IMPORTANT: Pass ownerAccount (NEAR wallet) to uploadFile
    const uploadResult = await uploadFile(groupId, fileBuffer, file.name, ownerAccount);
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
    
    // Provide more specific error messages
    if (error.message?.includes('not authorized')) {
      throw new Error('Not authorized. Check your NOVA credentials at nova-sdk.com');
    } else if (error.message?.includes('Insufficient')) {
      throw new Error('Insufficient NEAR balance. Please add funds to your NOVA account at nova-sdk.com');
    } else if (error.message?.includes('Session token')) {
      throw new Error('Session expired. Your API key may be invalid. Generate a new one at nova-sdk.com');
    } else if (error.message?.includes('wallet connected')) {
      throw new Error('NEAR wallet connection lost. Please reconnect your wallet.');
    }
    
    throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
  }
};