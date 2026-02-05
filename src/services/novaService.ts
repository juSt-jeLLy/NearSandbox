import { NovaSdk } from 'nova-sdk-js';
import { Buffer } from 'buffer';

// Polyfill Buffer for browser environment
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

// Environment variables - user will set these
const NOVA_ACCOUNT_ID = import.meta.env.VITE_NOVA_ACCOUNT_ID || '';
const NOVA_API_KEY = import.meta.env.VITE_NOVA_API_KEY || '';

let sdkInstance: NovaSdk | null = null;

export const getNovaSDK = (): NovaSdk => {
  if (!NOVA_ACCOUNT_ID || !NOVA_API_KEY) {
    throw new Error('NOVA credentials not configured. Please set VITE_NOVA_ACCOUNT_ID and VITE_NOVA_API_KEY environment variables.');
  }
  
  if (!sdkInstance) {
    sdkInstance = new NovaSdk(NOVA_ACCOUNT_ID, {
      apiKey: NOVA_API_KEY,
      rpcUrl: 'https://rpc.testnet.near.org',
      contractId: 'nova-sdk-6.testnet',
    });
  }
  
  return sdkInstance;
};

export const isNovaConfigured = (): boolean => {
  return !!(NOVA_ACCOUNT_ID && NOVA_API_KEY);
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
export const registerGroup = async (groupId: string): Promise<string> => {
  const sdk = getNovaSDK();
  return await sdk.registerGroup(groupId);
};

export const addGroupMember = async (groupId: string, memberId: string): Promise<string> => {
  const sdk = getNovaSDK();
  return await sdk.addGroupMember(groupId, memberId);
};

export const revokeGroupMember = async (groupId: string, memberId: string): Promise<string> => {
  const sdk = getNovaSDK();
  return await sdk.revokeGroupMember(groupId, memberId);
};

export const isAuthorized = async (groupId: string, userId?: string): Promise<boolean> => {
  const sdk = getNovaSDK();
  return await sdk.isAuthorized(groupId, userId);
};

export const getGroupOwner = async (groupId: string): Promise<string> => {
  const sdk = getNovaSDK();
  return await sdk.getGroupOwner(groupId);
};

// File Operations
export const uploadFile = async (
  groupId: string,
  fileData: Buffer | Uint8Array,
  filename: string
): Promise<UploadResult> => {
  const sdk = getNovaSDK();
  const result = await sdk.upload(groupId, Buffer.from(fileData), filename);
  
  return {
    cid: result.cid,
    trans_id: result.trans_id,
    file_hash: result.file_hash,
    filename,
    size: fileData.length,
    uploadedAt: new Date().toISOString(),
  };
};

export const retrieveFile = async (
  groupId: string,
  cid: string
): Promise<RetrieveResult> => {
  const sdk = getNovaSDK();
  return await sdk.retrieve(groupId, cid);
};

// Account Operations
export const getBalance = async (accountId?: string): Promise<string> => {
  const sdk = getNovaSDK();
  return await sdk.getBalance(accountId);
};

export const getTransactionsForGroup = async (groupId: string): Promise<any[]> => {
  const sdk = getNovaSDK();
  return await sdk.getTransactionsForGroup(groupId);
};

export const estimateFee = async (action: string): Promise<string> => {
  const sdk = getNovaSDK();
  const fee = await sdk.estimateFee(action);
  return String(fee);
};

export const authStatus = async (groupId?: string): Promise<any> => {
  const sdk = getNovaSDK();
  return await sdk.authStatus(groupId);
};

export const getNetworkInfo = () => {
  const sdk = getNovaSDK();
  return sdk.getNetworkInfo();
};

// Utility
export const computeHash = async (data: Buffer | Uint8Array): Promise<string> => {
  const sdk = getNovaSDK();
  const result = await sdk.computeHashAsync(Buffer.from(data));
  return String(result);
};