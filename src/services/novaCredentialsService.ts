import CryptoJS from 'crypto-js';

// Types
export interface NovaCredentials {
  accountId: string;
  apiKey: string;
}

export interface StoredCredentials {
  nearWallet: string;
  credentials: NovaCredentials;
  createdAt: number;
  updatedAt: number;
}

// Storage key
const STORAGE_KEY = 'nova_credentials_encrypted';

// Encryption key derived from browser fingerprint + salt
const getEncryptionKey = (): string => {
  // Create a deterministic key based on browser characteristics
  // This is not super secure but provides basic obfuscation
  const fingerprint = `${navigator.userAgent}${navigator.language}${screen.width}x${screen.height}`;
  const salt = 'nova-marketplace-v1'; // You can change this
  return CryptoJS.SHA256(fingerprint + salt).toString();
};

/**
 * Encrypt credentials
 */
const encryptData = (data: string): string => {
  const key = getEncryptionKey();
  return CryptoJS.AES.encrypt(data, key).toString();
};

/**
 * Decrypt credentials
 */
const decryptData = (encryptedData: string): string => {
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
};

/**
 * Save NOVA credentials for a specific NEAR wallet
 */
export const saveNovaCredentials = (
  nearWallet: string,
  credentials: NovaCredentials
): void => {
  try {
    // Get existing data
    const allCredentials = getAllStoredCredentials();
    
    // Add/update credentials for this wallet
    const timestamp = Date.now();
    allCredentials[nearWallet] = {
      nearWallet,
      credentials,
      createdAt: allCredentials[nearWallet]?.createdAt || timestamp,
      updatedAt: timestamp,
    };
    
    // Encrypt and save
    const jsonData = JSON.stringify(allCredentials);
    const encrypted = encryptData(jsonData);
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to save NOVA credentials:', error);
    throw new Error('Failed to save credentials');
  }
};

/**
 * Get NOVA credentials for a specific NEAR wallet
 */
export const getNovaCredentials = (nearWallet: string): NovaCredentials | null => {
  try {
    const allCredentials = getAllStoredCredentials();
    return allCredentials[nearWallet]?.credentials || null;
  } catch (error) {
    console.error('Failed to get NOVA credentials:', error);
    return null;
  }
};

/**
 * Delete NOVA credentials for a specific NEAR wallet
 */
export const deleteNovaCredentials = (nearWallet: string): void => {
  try {
    const allCredentials = getAllStoredCredentials();
    delete allCredentials[nearWallet];
    
    const jsonData = JSON.stringify(allCredentials);
    const encrypted = encryptData(jsonData);
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to delete NOVA credentials:', error);
    throw new Error('Failed to delete credentials');
  }
};

/**
 * Check if NOVA credentials exist for a wallet
 */
export const hasNovaCredentials = (nearWallet: string): boolean => {
  const credentials = getNovaCredentials(nearWallet);
  return credentials !== null && !!credentials.accountId && !!credentials.apiKey;
};

/**
 * Get all stored credentials (decrypted)
 */
const getAllStoredCredentials = (): Record<string, StoredCredentials> => {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return {};
    
    const decrypted = decryptData(encrypted);
    if (!decrypted) return {};
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to parse stored credentials:', error);
    return {};
  }
};

/**
 * Clear all stored credentials
 */
export const clearAllCredentials = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Validate NOVA credentials format
 */
export const validateNovaCredentials = (credentials: NovaCredentials): boolean => {
  if (!credentials.accountId || !credentials.apiKey) {
    return false;
  }
  
  // Check account ID format (should end with .nova-sdk.near)
  if (!credentials.accountId.includes('.nova-sdk.near')) {
    return false;
  }
  
  // Check API key format (should start with nova_sk_)
  if (!credentials.apiKey.startsWith('nova_sk_')) {
    return false;
  }
  
  return true;
};