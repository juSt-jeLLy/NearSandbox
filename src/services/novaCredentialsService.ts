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
  const fingerprint = `${navigator.userAgent}${navigator.language}${screen.width}x${screen.height}`;
  const salt = 'nova-marketplace-v1';
  return CryptoJS.SHA256(fingerprint + salt).toString();
};

const encryptData = (data: string): string => {
  const key = getEncryptionKey();
  return CryptoJS.AES.encrypt(data, key).toString();
};

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
 * Save NOVA credentials for a specific NEAR wallet.
 * Also invalidates the SDK cache so the next call picks up fresh creds.
 */
export const saveNovaCredentials = (
  nearWallet: string,
  credentials: NovaCredentials
): void => {
  try {
    const allCredentials = getAllStoredCredentials();
    const timestamp = Date.now();
    allCredentials[nearWallet] = {
      nearWallet,
      credentials,
      createdAt: allCredentials[nearWallet]?.createdAt || timestamp,
      updatedAt: timestamp,
    };

    const jsonData = JSON.stringify(allCredentials);
    const encrypted = encryptData(jsonData);
    localStorage.setItem(STORAGE_KEY, encrypted);

    // Bust SDK cache so next getNovaSDK() call uses the new credentials
    invalidateCache(nearWallet);
  } catch (error) {
    console.error('Failed to save NOVA credentials:', error);
    throw new Error('Failed to save credentials');
  }
};

/**
 * Get NOVA credentials for a specific NEAR wallet.
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
 * Delete NOVA credentials for a specific NEAR wallet.
 * Also invalidates the SDK cache.
 */
export const deleteNovaCredentials = (nearWallet: string): void => {
  try {
    const allCredentials = getAllStoredCredentials();
    delete allCredentials[nearWallet];

    const jsonData = JSON.stringify(allCredentials);
    const encrypted = encryptData(jsonData);
    localStorage.setItem(STORAGE_KEY, encrypted);

    // Bust SDK cache
    invalidateCache(nearWallet);
  } catch (error) {
    console.error('Failed to delete NOVA credentials:', error);
    throw new Error('Failed to delete credentials');
  }
};

/**
 * Check if NOVA credentials exist for a wallet.
 */
export const hasNovaCredentials = (nearWallet: string): boolean => {
  const credentials = getNovaCredentials(nearWallet);
  return credentials !== null && !!credentials.accountId && !!credentials.apiKey;
};

/**
 * Get all stored credentials (decrypted).
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
 * Clear all stored credentials.
 */
export const clearAllCredentials = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Validate NOVA credentials format.
 */
export const validateNovaCredentials = (credentials: NovaCredentials): boolean => {
  if (!credentials.accountId || !credentials.apiKey) return false;
  if (!credentials.accountId.includes('.nova-sdk.near')) return false;
  if (!credentials.apiKey.startsWith('nova_sk_')) return false;
  return true;
};

// ---------------------------------------------------------------------------
// Internal helper: bust the SDK instance cache without a circular import.
// We do a lazy dynamic import so novaCredentialsService doesn't hard-depend
// on novaService at module load time.
// ---------------------------------------------------------------------------
const invalidateCache = (nearWallet: string): void => {
  import('./novaService')
    .then(({ invalidateNovaSDKCache }) => invalidateNovaSDKCache(nearWallet))
    .catch(() => {
      // novaService not loaded yet — nothing to invalidate
    });
};