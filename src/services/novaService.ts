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
 * Get (or create) a NovaSdk instance for the given NEAR wallet.
 * Reads credentials from browser localStorage (novaCredentialsService).
 */
export const getNovaSDK = (nearWallet?: string): NovaSdk => {
  // Resolve which wallet to use
  const wallet = nearWallet ?? getCurrentWallet();

  if (!wallet) {
    throw new Error('No NEAR wallet connected. Please connect your wallet first.');
  }

  if (!hasNovaCredentials(wallet)) {
    throw new Error('NOVA credentials not configured. Please set up your NOVA account in the navbar settings.');
  }

  // Return cached instance if available
  if (sdkCache[wallet]) {
    return sdkCache[wallet];
  }

  const creds = getNovaCredentials(wallet);
  if (!creds) {
    throw new Error('Failed to load NOVA credentials from browser storage.');
  }

  const sdk = new NovaSdk(creds.accountId, {
    apiKey: creds.apiKey,
  });

  console.log(`🔷 NOVA SDK initialized for wallet: ${wallet}`);
  console.log(`   Account: ${creds.accountId}`);
  console.log('⚠️  All operations will use real NEAR tokens');

  sdkCache[wallet] = sdk;
  return sdk;
};

/**
 * Invalidate the cached SDK for a wallet (call this after credentials are updated/deleted).
 */
export const invalidateNovaSDKCache = (nearWallet: string): void => {
  delete sdkCache[nearWallet];
};

/**
 * Try to read the currently connected wallet from near-connect-hooks' localStorage key.
 * Falls back to null if not found.
 */
const getCurrentWallet = (): string | null => {
  try {
    // near-wallet-selector stores the selected account here
    const stored =
      localStorage.getItem('near_app_wallet_auth_key') ||
      localStorage.getItem('undefined_wallet_auth_key') ||
      localStorage.getItem('near-wallet-selector:selectedWalletId');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'string') return parsed;
        if (parsed?.accountId) return parsed.accountId;
      } catch {
        return stored; // already a plain string
      }
    }
    return null;
  } catch {
    return null;
  }
};

export const isNovaConfigured = (nearWallet?: string): boolean => {
  const wallet = nearWallet ?? getCurrentWallet();
  if (!wallet) return false;
  return hasNovaCredentials(wallet);
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
  const sdk = getNovaSDK(nearWallet);
  return await sdk.registerGroup(groupId);
};

export const addGroupMember = async (groupId: string, memberId: string, nearWallet?: string): Promise<string> => {
  const sdk = getNovaSDK(nearWallet);
  return await sdk.addGroupMember(groupId, memberId);
};

export const revokeGroupMember = async (groupId: string, memberId: string, nearWallet?: string): Promise<string> => {
  const sdk = getNovaSDK(nearWallet);
  return await sdk.revokeGroupMember(groupId, memberId);
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
  const sdk = getNovaSDK(nearWallet);

  const buffer = Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData);
  const result = await sdk.upload(groupId, buffer, filename);

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
  const sdk = getNovaSDK(nearWallet);
  return await sdk.retrieve(groupId, cid);
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