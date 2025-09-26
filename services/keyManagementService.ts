/**
 * Key Management Service
 * Handles secure storage, rotation, and management of encryption keys
 */

import { productionSecurityConfig } from '../config/security';
import { encryptionService } from './encryptionService';

export interface KeyMetadata {
  keyId: string;
  purpose: 'encryption' | 'signing' | 'authentication' | 'api';
  algorithm: string;
  keySize: number;
  createdAt: Date;
  expiresAt: Date;
  rotatedAt?: Date;
  status: 'active' | 'inactive' | 'compromised' | 'expired';
  usage: {
    encryptionCount: number;
    decryptionCount: number;
    lastUsed: Date;
  };
}

export interface KeyRotationPolicy {
  automaticRotation: boolean;
  rotationInterval: number; // days
  warningPeriod: number; // days before expiration
  maxKeyAge: number; // days
  retainOldKeys: boolean;
  oldKeyRetentionPeriod: number; // days
}

export interface KeyBackup {
  keyId: string;
  encryptedKey: string;
  metadata: KeyMetadata;
  backupDate: Date;
  checksum: string;
}

export class KeyManagementService {
  private static instance: KeyManagementService;
  private keyMetadata: Map<string, KeyMetadata> = new Map();
  private rotationPolicy: KeyRotationPolicy;

  private constructor() {
    this.initializeKeyManagement();
  }

  static getInstance(): KeyManagementService {
    if (!KeyManagementService.instance) {
      KeyManagementService.instance = new KeyManagementService();
    }
    return KeyManagementService.instance;
  }

  /**
   * Initialize key management system
   */
  private initializeKeyManagement(): void {
    this.rotationPolicy = {
      automaticRotation: true,
      rotationInterval: productionSecurityConfig.encryption.keyRotationInterval,
      warningPeriod: 7, // 7 days warning
      maxKeyAge: productionSecurityConfig.encryption.keyRotationInterval + 30, // Grace period
      retainOldKeys: true,
      oldKeyRetentionPeriod: 365, // 1 year
    };

    // Start automatic key rotation monitoring
    this.startKeyRotationMonitoring();
  }

  /**
   * Generate new encryption key with metadata
   */
  async generateKey(purpose: KeyMetadata['purpose'], algorithm: string = 'AES-256-GCM'): Promise<string> {
    try {
      // Generate the actual key using encryption service
      const keyId = await encryptionService.generateNewKey();

      // Create metadata
      const metadata: KeyMetadata = {
        keyId,
        purpose,
        algorithm,
        keySize: 256, // bits
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.rotationPolicy.rotationInterval * 24 * 60 * 60 * 1000),
        status: 'active',
        usage: {
          encryptionCount: 0,
          decryptionCount: 0,
          lastUsed: new Date(),
        },
      };

      this.keyMetadata.set(keyId, metadata);

      console.log(`New ${purpose} key generated: ${keyId}`);
      return keyId;
    } catch (error) {
      console.error('Key generation failed:', error);
      throw new Error('Failed to generate encryption key');
    }
  }

  /**
   * Get key metadata
   */
  getKeyMetadata(keyId: string): KeyMetadata | null {
    return this.keyMetadata.get(keyId) || null;
  }

  /**
   * List all keys with optional filtering
   */
  listKeys(filter?: {
    purpose?: KeyMetadata['purpose'];
    status?: KeyMetadata['status'];
    expiringSoon?: boolean;
  }): KeyMetadata[] {
    let keys = Array.from(this.keyMetadata.values());

    if (filter) {
      if (filter.purpose) {
        keys = keys.filter(key => key.purpose === filter.purpose);
      }

      if (filter.status) {
        keys = keys.filter(key => key.status === filter.status);
      }

      if (filter.expiringSoon) {
        const warningDate = new Date(Date.now() + this.rotationPolicy.warningPeriod * 24 * 60 * 60 * 1000);
        keys = keys.filter(key => key.expiresAt <= warningDate);
      }
    }

    return keys.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update key usage statistics
   */
  updateKeyUsage(keyId: string, operation: 'encrypt' | 'decrypt'): void {
    const metadata = this.keyMetadata.get(keyId);
    if (metadata) {
      if (operation === 'encrypt') {
        metadata.usage.encryptionCount++;
      } else {
        metadata.usage.decryptionCount++;
      }
      metadata.usage.lastUsed = new Date();
      this.keyMetadata.set(keyId, metadata);
    }
  }

  /**
   * Rotate encryption key
   */
  async rotateKey(keyId: string): Promise<string> {
    try {
      const oldMetadata = this.keyMetadata.get(keyId);
      if (!oldMetadata) {
        throw new Error(`Key not found: ${keyId}`);
      }

      // Generate new key
      const newKeyId = await this.generateKey(oldMetadata.purpose, oldMetadata.algorithm);

      // Mark old key as inactive
      oldMetadata.status = 'inactive';
      oldMetadata.rotatedAt = new Date();
      this.keyMetadata.set(keyId, oldMetadata);

      // Perform key rotation in encryption service
      await encryptionService.rotateKeys();

      console.log(`Key rotated: ${keyId} -> ${newKeyId}`);
      return newKeyId;
    } catch (error) {
      console.error('Key rotation failed:', error);
      throw new Error('Failed to rotate encryption key');
    }
  }

  /**
   * Mark key as compromised
   */
  async compromiseKey(keyId: string, reason: string): Promise<void> {
    try {
      const metadata = this.keyMetadata.get(keyId);
      if (!metadata) {
        throw new Error(`Key not found: ${keyId}`);
      }

      // Mark key as compromised
      metadata.status = 'compromised';
      this.keyMetadata.set(keyId, metadata);

      // Log security event
      console.warn(`Key compromised: ${keyId}, Reason: ${reason}`);

      // Automatically rotate if it's the current active key
      if (metadata.status === 'active') {
        await this.rotateKey(keyId);
      }
    } catch (error) {
      console.error('Failed to mark key as compromised:', error);
      throw new Error('Failed to handle key compromise');
    }
  }

  /**
   * Backup encryption keys
   */
  async backupKeys(masterPassword: string): Promise<KeyBackup[]> {
    try {
      const backups: KeyBackup[] = [];
      const activeKeys = this.listKeys({ status: 'active' });

      for (const metadata of activeKeys) {
        try {
          // Export key using encryption service
          const encryptedKey = await encryptionService.exportKey(metadata.keyId, masterPassword);
          
          // Calculate checksum
          const checksum = await this.calculateChecksum(encryptedKey);

          const backup: KeyBackup = {
            keyId: metadata.keyId,
            encryptedKey,
            metadata: { ...metadata },
            backupDate: new Date(),
            checksum,
          };

          backups.push(backup);
        } catch (error) {
          console.error(`Failed to backup key ${metadata.keyId}:`, error);
        }
      }

      console.log(`Backed up ${backups.length} keys`);
      return backups;
    } catch (error) {
      console.error('Key backup failed:', error);
      throw new Error('Failed to backup encryption keys');
    }
  }

  /**
   * Restore keys from backup
   */
  async restoreKeys(backups: KeyBackup[], masterPassword: string): Promise<string[]> {
    try {
      const restoredKeys: string[] = [];

      for (const backup of backups) {
        try {
          // Verify checksum
          const calculatedChecksum = await this.calculateChecksum(backup.encryptedKey);
          if (calculatedChecksum !== backup.checksum) {
            console.error(`Checksum mismatch for key ${backup.keyId}`);
            continue;
          }

          // Import key using encryption service
          const keyId = await encryptionService.importKey(backup.encryptedKey, masterPassword);
          
          // Restore metadata
          this.keyMetadata.set(keyId, backup.metadata);
          
          restoredKeys.push(keyId);
        } catch (error) {
          console.error(`Failed to restore key ${backup.keyId}:`, error);
        }
      }

      console.log(`Restored ${restoredKeys.length} keys`);
      return restoredKeys;
    } catch (error) {
      console.error('Key restoration failed:', error);
      throw new Error('Failed to restore encryption keys');
    }
  }

  /**
   * Calculate checksum for integrity verification
   */
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check for keys that need rotation
   */
  getKeysNeedingRotation(): KeyMetadata[] {
    const now = new Date();
    return this.listKeys({ status: 'active' }).filter(key => {
      return now >= key.expiresAt || 
             (now.getTime() - key.createdAt.getTime()) >= (this.rotationPolicy.maxKeyAge * 24 * 60 * 60 * 1000);
    });
  }

  /**
   * Get keys expiring soon
   */
  getKeysExpiringSoon(): KeyMetadata[] {
    const warningDate = new Date(Date.now() + this.rotationPolicy.warningPeriod * 24 * 60 * 60 * 1000);
    return this.listKeys({ status: 'active' }).filter(key => {
      return key.expiresAt <= warningDate && key.expiresAt > new Date();
    });
  }

  /**
   * Start automatic key rotation monitoring
   */
  private startKeyRotationMonitoring(): void {
    if (!this.rotationPolicy.automaticRotation) {
      return;
    }

    // Check every hour for keys that need rotation
    setInterval(async () => {
      try {
        const keysNeedingRotation = this.getKeysNeedingRotation();
        
        for (const key of keysNeedingRotation) {
          console.log(`Auto-rotating expired key: ${key.keyId}`);
          await this.rotateKey(key.keyId);
        }

        // Warn about keys expiring soon
        const keysExpiringSoon = this.getKeysExpiringSoon();
        if (keysExpiringSoon.length > 0) {
          console.warn(`${keysExpiringSoon.length} keys will expire soon:`, 
            keysExpiringSoon.map(k => k.keyId));
        }
      } catch (error) {
        console.error('Automatic key rotation check failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Clean up old inactive keys
   */
  async cleanupOldKeys(): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - this.rotationPolicy.oldKeyRetentionPeriod * 24 * 60 * 60 * 1000);
      const keysToDelete: string[] = [];

      for (const [keyId, metadata] of this.keyMetadata.entries()) {
        if ((metadata.status === 'inactive' || metadata.status === 'expired') && 
            metadata.createdAt < cutoffDate) {
          keysToDelete.push(keyId);
        }
      }

      // Delete old keys
      for (const keyId of keysToDelete) {
        await encryptionService.deleteKey(keyId);
        this.keyMetadata.delete(keyId);
      }

      console.log(`Cleaned up ${keysToDelete.length} old keys`);
      return keysToDelete.length;
    } catch (error) {
      console.error('Key cleanup failed:', error);
      throw new Error('Failed to clean up old keys');
    }
  }

  /**
   * Update rotation policy
   */
  updateRotationPolicy(policy: Partial<KeyRotationPolicy>): void {
    this.rotationPolicy = { ...this.rotationPolicy, ...policy };
    console.log('Key rotation policy updated:', this.rotationPolicy);
  }

  /**
   * Get rotation policy
   */
  getRotationPolicy(): KeyRotationPolicy {
    return { ...this.rotationPolicy };
  }

  /**
   * Generate key management report
   */
  generateKeyManagementReport(): {
    totalKeys: number;
    activeKeys: number;
    inactiveKeys: number;
    compromisedKeys: number;
    expiredKeys: number;
    keysExpiringSoon: number;
    keysNeedingRotation: number;
    oldestKey: Date | null;
    newestKey: Date | null;
    keyUsageStats: {
      totalEncryptions: number;
      totalDecryptions: number;
      mostUsedKey: string | null;
    };
  } {
    const allKeys = Array.from(this.keyMetadata.values());
    
    const activeKeys = allKeys.filter(k => k.status === 'active');
    const inactiveKeys = allKeys.filter(k => k.status === 'inactive');
    const compromisedKeys = allKeys.filter(k => k.status === 'compromised');
    const expiredKeys = allKeys.filter(k => k.status === 'expired');
    
    const keysExpiringSoon = this.getKeysExpiringSoon();
    const keysNeedingRotation = this.getKeysNeedingRotation();

    const keyDates = allKeys.map(k => k.createdAt);
    const oldestKey = keyDates.length > 0 ? new Date(Math.min(...keyDates.map(d => d.getTime()))) : null;
    const newestKey = keyDates.length > 0 ? new Date(Math.max(...keyDates.map(d => d.getTime()))) : null;

    const totalEncryptions = allKeys.reduce((sum, k) => sum + k.usage.encryptionCount, 0);
    const totalDecryptions = allKeys.reduce((sum, k) => sum + k.usage.decryptionCount, 0);
    
    const mostUsedKey = allKeys.length > 0 
      ? allKeys.reduce((max, k) => 
          (k.usage.encryptionCount + k.usage.decryptionCount) > 
          (max.usage.encryptionCount + max.usage.decryptionCount) ? k : max
        ).keyId
      : null;

    return {
      totalKeys: allKeys.length,
      activeKeys: activeKeys.length,
      inactiveKeys: inactiveKeys.length,
      compromisedKeys: compromisedKeys.length,
      expiredKeys: expiredKeys.length,
      keysExpiringSoon: keysExpiringSoon.length,
      keysNeedingRotation: keysNeedingRotation.length,
      oldestKey,
      newestKey,
      keyUsageStats: {
        totalEncryptions,
        totalDecryptions,
        mostUsedKey,
      },
    };
  }

  /**
   * Validate key management configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check rotation policy
    if (this.rotationPolicy.rotationInterval < 30) {
      warnings.push('Key rotation interval is less than 30 days');
    }

    if (this.rotationPolicy.rotationInterval > 365) {
      warnings.push('Key rotation interval is more than 1 year');
    }

    if (this.rotationPolicy.warningPeriod >= this.rotationPolicy.rotationInterval) {
      errors.push('Warning period should be less than rotation interval');
    }

    // Check for active keys
    const activeKeys = this.listKeys({ status: 'active' });
    if (activeKeys.length === 0) {
      errors.push('No active encryption keys found');
    }

    // Check for expired keys
    const expiredKeys = this.getKeysNeedingRotation();
    if (expiredKeys.length > 0) {
      warnings.push(`${expiredKeys.length} keys need rotation`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Export singleton instance
export const keyManagementService = KeyManagementService.getInstance();
export default keyManagementService;