import { initializeDatabase } from '../db/index';
import { MigrationManager } from '../db/migration/migrationManager';

/**
 * Migration script to migrate from SecureStore to SQLite
 * This should be called when the app starts to automatically migrate existing data
 */
export const performMigrationIfNeeded = async (): Promise<{
  success: boolean;
  migrationPerformed: boolean;
  message: string;
  data?: any;
}> => {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Check if migration is needed
    const needsMigration = await MigrationManager.isMigrationNeeded();
    
    if (!needsMigration) {
      return {
        success: true,
        migrationPerformed: false,
        message: 'No migration needed',
      };
    }
    
    // Get migration preview
    const preview = await MigrationManager.getMigrationPreview();
    
    // Create backup before migration
    const backup = await MigrationManager.backupSecureStoreData();
    if (!backup.success) {
      console.error('❌ Failed to create backup:', backup.error);
      return {
        success: false,
        migrationPerformed: false,
        message: `Failed to create backup: ${backup.error}`,
      };
    }
    
    // Perform the migration
    const result = await MigrationManager.migrateFromSecureStore();
    
    if (result.success) {
      // Clean up SecureStore data after successful migration
      await MigrationManager.cleanupSecureStore();
      
      return {
        success: true,
        migrationPerformed: true,
        message: `Successfully migrated ${result.migrated} notifications`,
        data: {
          migrated: result.migrated,
          preview,
        },
      };
    } else {
      return {
        success: false,
        migrationPerformed: false,
        message: `Migration failed: ${result.errors.join(', ')}`,
        data: {
          errors: result.errors,
        },
      };
    }
  } catch (error) {
    console.error('❌ Migration script error:', error);
    return {
      success: false,
      migrationPerformed: false,
      message: `Migration script error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Manual migration function for debugging or forced migration
 */
export const forceMigration = async (): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> => {
  try {
    const preview = await MigrationManager.getMigrationPreview();
    const result = await MigrationManager.migrateFromSecureStore();
    
    return {
      success: result.success,
      message: result.success 
        ? `Force migration completed: ${result.migrated} notifications migrated`
        : `Force migration failed: ${result.errors.join(', ')}`,
      data: {
        preview,
        migrated: result.migrated,
        errors: result.errors,
      },
    };
  } catch (error) {
    console.error('❌ Force migration error:', error);
    return {
      success: false,
      message: `Force migration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Get migration status and preview
 */
export const getMigrationStatus = async (): Promise<{
  needsMigration: boolean;
  preview: any;
  hasBackup: boolean;
}> => {
  try {
    const needsMigration = await MigrationManager.isMigrationNeeded();
    const preview = await MigrationManager.getMigrationPreview();
    
    // Check if backup exists
    let hasBackup = false;
    try {
      const backup = await MigrationManager.backupSecureStoreData();
      hasBackup = backup.success;
    } catch {
      hasBackup = false;
    }
    
    return {
      needsMigration,
      preview,
      hasBackup,
    };
  } catch (error) {
    console.error('❌ Error getting migration status:', error);
    return {
      needsMigration: false,
      preview: { location: 0, emergency: 0, device: 0, total: 0 },
      hasBackup: false,
    };
  }
};