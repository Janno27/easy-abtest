/**
 * Encrypt a string using Web Crypto API
 * @param secret - The string to encrypt
 * @returns Object containing initialization vector and encrypted data
 */
export const encryptSecret = async (secret: string): Promise<{ iv: number[], data: number[] } | null> => {
  try {
    const encoder = new TextEncoder();
    // Utilisation de la variable d'environnement Vite
    const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || '';
    
    if (!encryptionKey) {
      console.error('Encryption key is not defined in environment variables');
      return null;
    }
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(encryptionKey),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(secret)
    );
    
    return { 
      iv: Array.from(iv), 
      data: Array.from(new Uint8Array(encrypted)) 
    };
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

/**
 * Decrypt an encrypted string
 * @param encryptedData - Object containing initialization vector and encrypted data
 * @returns Decrypted string or empty string if decryption fails
 */
export const decryptSecret = async (
  encryptedData: { iv: number[], data: number[] }
): Promise<string> => {
  if (!encryptedData || !encryptedData.iv || !encryptedData.data) {
    console.warn('Invalid encrypted data');
    return '';
  }
  
  try {
    const encoder = new TextEncoder();
    // Utilisation de la même variable d'environnement Vite pour la décryption
    const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || '';
    
    if (!encryptionKey) {
      console.error('Encryption key is not defined in environment variables');
      return '';
    }
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(encryptionKey),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const iv = new Uint8Array(encryptedData.iv);
    const data = new Uint8Array(encryptedData.data);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}; 