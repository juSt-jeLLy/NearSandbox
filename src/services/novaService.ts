import { NovaSdk } from 'nova-sdk-js';
import { Buffer } from 'buffer';
import { getNovaCredentials, hasNovaCredentials } from './novaCredentialsService';

// Polyfill Buffer for browser environment
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

// Cache SDK instances per wallet to avoid re-creating them on every call
const sdkCache: Record<string, NovaSdk> = {};

/**
 * Try to read the currently connected wallet from multiple possible localStorage keys.
 * near-wallet-selector can store wallet info in different keys depending on configuration.
 */
const getCurrentWallet = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try multiple possible keys where wallet info might be stored
    const possibleKeys = [
      'near_app_wallet_auth_key',
      'undefined_wallet_auth_key',
      'near-wallet-selector:selectedWalletId',
      'near-wallet-selector:recentlySignedInWallets',
    ];
    
    for (const key of possibleKeys) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;
      
      try {
        const parsed = JSON.parse(stored);
        
        // Handle different data structures
        if (typeof parsed === 'string' && parsed.includes('.near')) {
          console.log(`✅ Found wallet in ${key}: ${parsed}`);
          return parsed;
        }
        if (parsed?.accountId) {
          console.log(`✅ Found wallet in ${key}: ${parsed.accountId}`);
          return parsed.accountId;
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          // For recentlySignedInWallets array
          const wallet = parsed[0];
          if (typeof wallet === 'string' && wallet.includes('.near')) {
            console.log(`✅ Found wallet in ${key}: ${wallet}`);
            return wallet;
          }
        }
      } catch (parseError) {
        // If JSON parse fails, maybe it's a plain string
        if (stored.includes('.near')) {
          console.log(`✅ Found wallet in ${key} (plain): ${stored}`);
          return stored;
        }
      }
    }
    
    console.warn('⚠️ Could not find wallet in any localStorage key');
    return null;
  } catch (error) {
    console.error('Error reading wallet from localStorage:', error);
    return null;
  }
};

/**
 * Get (or create) a NovaSdk instance for the given NEAR wallet.
 * Reads credentials from browser localStorage (novaCredentialsService).
 */
export const getNovaSDK = (nearWallet?: string): NovaSdk => {
  // Resolve which wallet to use
  const wallet = nearWallet ?? getCurrentWallet();

  if (!wallet) {
    console.error('❌ No wallet provided and could not detect current wallet');
    throw new Error('No NEAR wallet connected. Please connect your wallet first.');
  }

  console.log(`🔍 Getting NOVA SDK for wallet: ${wallet}`);

  if (!hasNovaCredentials(wallet)) {
    console.error(`❌ No NOVA credentials found for wallet: ${wallet}`);
    throw new Error('NOVA credentials not configured. Please set up your NOVA account in the navbar settings.');
  }

  // Return cached instance if available
  if (sdkCache[wallet]) {
    console.log(`✅ Using cached SDK for wallet: ${wallet}`);
    return sdkCache[wallet];
  }

  const creds = getNovaCredentials(wallet);
  if (!creds) {
    console.error(`❌ Failed to load credentials for wallet: ${wallet}`);
    throw new Error('Failed to load NOVA credentials from browser storage.');
  }

  console.log(`🔷 Initializing new NOVA SDK for wallet: ${wallet}`);
  console.log(`   NOVA Account: ${creds.accountId}`);
  console.log(`   API Key: ${creds.apiKey.substring(0, 15)}...`);

  const sdk = new NovaSdk(creds.accountId, {
    apiKey: creds.apiKey,
  });

  console.log(`✅ NOVA SDK initialized successfully`);
  sdkCache[wallet] = sdk;
  return sdk;
};

/**
 * Invalidate the cached SDK for a wallet (call this after credentials are updated/deleted).
 */
export const invalidateNovaSDKCache = (nearWallet: string): void => {
  delete sdkCache[nearWallet];
  console.log(`🗑️ Invalidated SDK cache for wallet: ${nearWallet}`);
};

export const isNovaConfigured = (nearWallet?: string): boolean => {
  const wallet = nearWallet ?? getCurrentWallet();
  if (!wallet) {
    console.warn('⚠️ Cannot check NOVA config: no wallet specified or detected');
    return false;
  }
  const configured = hasNovaCredentials(wallet);
  console.log(`🔍 NOVA configured for ${wallet}: ${configured}`);
  return configured;
};

export interface UploadResult {
  cid: string;
  trans_id: string;
  file_hash: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

export interface RetrieveResult {
  data: Buffer;
  ipfs_hash: string;
  group_id: string;
}

// Group Management
export const registerGroup = async (groupId: string, nearWallet?: string): Promise<string> => {
  console.log(`📝 Registering group: ${groupId} for wallet: ${nearWallet || 'auto-detect'}`);
  const sdk = getNovaSDK(nearWallet);
  const result = await sdk.registerGroup(groupId);
  console.log(`✅ Group registered successfully: ${groupId}`);
  return result;
};

export const addGroupMember = async (groupId: string, memberId: string, nearWallet?: string): Promise<string> => {
  console.log(`👥 Adding member ${memberId} to group: ${groupId}`);
  const sdk = getNovaSDK(nearWallet);
  const result = await sdk.addGroupMember(groupId, memberId);
  console.log(`✅ Member added successfully`);
  return result;
};

export const revokeGroupMember = async (groupId: string, memberId: string, nearWallet?: string): Promise<string> => {
  console.log(`🚫 Revoking member ${memberId} from group: ${groupId}`);
  const sdk = getNovaSDK(nearWallet);
  const result = await sdk.revokeGroupMember(groupId, memberId);
  console.log(`✅ Member revoked successfully`);
  return result;
};

export const isAuthorized = async (groupId: string, userId?: string, nearWallet?: string): Promise<boolean> => {
  const sdk = getNovaSDK(nearWallet);
  return await sdk.isAuthorized(groupId, userId);
};

export const getGroupOwner = async (groupId: string, nearWallet?: string): Promise<string | null> => {
  const sdk = getNovaSDK(nearWallet);
  return await sdk.getGroupOwner(groupId);
};

// File Operations
export const uploadFile = async (
  groupId: string,
  fileData: Buffer | Uint8Array,
  filename: string,
  nearWallet?: string
): Promise<UploadResult> => {
  console.log(`📤 Uploading file: ${filename} to group: ${groupId}`);
  const sdk = getNovaSDK(nearWallet);

  const buffer = Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData);
  console.log(`   File size: ${buffer.length} bytes`);
  
  const result = await sdk.upload(groupId, buffer, filename);
  console.log(`✅ File uploaded successfully. CID: ${result.cid}`);

  return {
    cid: result.cid,
    trans_id: result.trans_id,
    file_hash: result.file_hash,
    filename,
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
  };
};

export const retrieveFile = async (
  groupId: string,
  cid: string,
  nearWallet?: string
): Promise<RetrieveResult> => {
  console.log(`📥 Retrieving file from group: ${groupId}, CID: ${cid}`);
  const sdk = getNovaSDK(nearWallet);
  const result = await sdk.retrieve(groupId, cid);
  console.log(`✅ File retrieved successfully`);
  return result;
};

// Account Operations
export const getBalance = async (accountId?: string, nearWallet?: string): Promise<string> => {
  const sdk = getNovaSDK(nearWallet);
  return await sdk.getBalance(accountId);
};

export const getTransactionsForGroup = async (groupId: string, nearWallet?: string): Promise<any[]> => {
  const sdk = getNovaSDK(nearWallet);
  return await sdk.getTransactionsForGroup(groupId);
};

export const estimateFee = async (action: string, nearWallet?: string): Promise<string> => {
  const sdk = getNovaSDK(nearWallet);
  const fee = await sdk.estimateFee(action);
  return String(fee);
};

export const authStatus = async (groupId?: string, nearWallet?: string): Promise<any> => {
  const sdk = getNovaSDK(nearWallet);
  return await sdk.authStatus(groupId);
};

export const getNetworkInfo = (nearWallet?: string) => {
  const sdk = getNovaSDK(nearWallet);
  return sdk.getNetworkInfo();
};

// Utility
export const computeHash = async (data: Buffer | Uint8Array, nearWallet?: string): Promise<string> => {
  const sdk = getNovaSDK(nearWallet);
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const result = await sdk.computeHashAsync(buffer);
  return String(result);
};