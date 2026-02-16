import { getFileCredibilityScoreFromBuffer} from '@/components/nearai';
import { uploadFile, registerGroup } from './novaService';
import { Buffer } from 'buffer';


const MARKETPLACE_CONTRACT = 'singlelibrary5839.near';

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
  description,
  file: File,
  assetType: 'Image' | 'Dataset' | 'Audio' | 'Other',
  price: number,
  ownerAccount: string,
  callFunction: any,
  onProgress?: (progress: CombinedUploadProgress) => void
): Promise<CombinedUploadResult> => {
  
  // Use fixed group ID
  const groupId = generateGroupId(file.name);
  
  // Generate unique product ID
  const productId = generateProductId();
  
  try {
      // Read file as ArrayBuffer and convert to Buffer (works in both environments)
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const aiScore=await getFileCredibilityScoreFromBuffer(fileBuffer,description) || null;
    console.log('ai score is ', aiScore);
    // Step 1: Register group on NOVA (COMMENTED OUT - using existing group)
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
    

    
    // IMPORTANT: Pass ownerAccount (NEAR wallet) to uploadFile
    const uploadResult = await uploadFile(groupId, fileBuffer, file.name, ownerAccount);
    console.log(`✅ File uploaded to NOVA. CID: ${uploadResult.cid}`);
    
    // Run NEAR private AI credibility check . If it fails, continue without blocking.
    // let aiScore: number | null = null;
    // try {
    //   // Prepare base64 payload for image
    //   const base64Image = fileBuffer.toString('base64');
    //   // Prompt: ask strictly for a single numeric score 0-100
    //   const systemPrompt = `You are an expert digital product appraiser. Strictly return a single numeric credibility score between 0 and 100 and nothing else.`;
    //   const userPrompt = `Seller Description: ${''}`;

    //   const apiKey = process.env.OPENAI_API_KEY || process.env.NEAR_AI_API_KEY || '';
    //   if (!apiKey) throw new Error('Missing NEAR AI API key');

    //   const res = await fetch('https://cloud-api.near.ai/v1/chat/completions', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${apiKey}`,
    //     },
    //     body: JSON.stringify({
    //       model: 'gpt-4o',
    //       messages: [
    //         { role: 'system', content: systemPrompt },
    //         { role: 'user', content: userPrompt },
    //         { role: 'user', content: `Image: data:image/png;base64,${base64Image}` },
    //       ],
    //       max_tokens: 8,
    //     }),
    //   });

    //   if (!res.ok) {
    //     const errBody = await res.text();
    //     throw new Error(`NEAR AI API returned ${res.status}: ${errBody}`);
    //   }

    //   const json = await res.json();
    //   const content = json.choices?.[0]?.message?.content || json.choices?.[0]?.text || '';
    //   const scoreMatch = (content || '').toString().trim().match(/\d{1,3}(?:\.\d+)?/);
    //   if (!scoreMatch) throw new Error('Failed to parse score from AI response: ' + content);
    //   aiScore = parseFloat(scoreMatch[0]);
    //   console.log('AI credibility score obtained:', aiScore);
    // } catch (aiErr) {
    //   console.error('NEAR AI check failed, continuing without TEE verification:', aiErr);
    //   aiScore = null;
    // }

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
        is_tee_verified: aiScore !== null,
        tee_signature: aiScore !== null ? aiScore : null,
      },
      gas: '30000000000000', // 30 TGas
      deposit: '0',          // No deposit required for listing creation
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