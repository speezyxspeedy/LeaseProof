import { dbService } from './db';
import { formatBytes } from './imageUtils';

export interface BackupPayload {
  version: string;
  app: string;
  timestamp: string;
  counts: Record<string, number>;
  data: Record<string, unknown[]>;
}

export interface RestorePreview {
  isValid: boolean;
  version: string;
  timestamp: string;
  totalRecords: number;
  counts: Record<string, number>;
  errorMessage?: string;
}

export async function createFullBackup(): Promise<{ payload: BackupPayload; jsonString: string; fileSizeFormatted: string }> {
  const allData = await dbService.exportAllData();
  const counts: Record<string, number> = {};
  for (const [storeName, records] of Object.entries(allData)) {
    counts[storeName] = records.length;
  }

  const payload: BackupPayload = {
    version: '1.0.0',
    app: 'LeaseProof',
    timestamp: new Date().toISOString(),
    counts,
    data: allData,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const fileSizeFormatted = formatBytes(blob.size);

  return { payload, jsonString, fileSizeFormatted };
}

export function downloadBackupFile(jsonString: string): void {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().substring(0, 10);
  a.href = url;
  a.download = `leaseproof-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateBackupFile(fileContent: string): RestorePreview {
  try {
    const parsed = JSON.parse(fileContent);
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, version: '', timestamp: '', totalRecords: 0, counts: {}, errorMessage: 'Invalid JSON format' };
    }
    if (parsed.app !== 'LeaseProof' && !parsed.data) {
      return { isValid: false, version: '', timestamp: '', totalRecords: 0, counts: {}, errorMessage: 'Not a recognized LeaseProof backup' };
    }

    const counts: Record<string, number> = {};
    let total = 0;
    if (parsed.data && typeof parsed.data === 'object') {
      for (const [key, val] of Object.entries(parsed.data)) {
        if (Array.isArray(val)) {
          counts[key] = val.length;
          total += val.length;
        }
      }
    }

    return {
      isValid: true,
      version: parsed.version || '1.0',
      timestamp: parsed.timestamp || new Date().toISOString(),
      totalRecords: total,
      counts,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'JSON parse failure';
    return {
      isValid: false,
      version: '',
      timestamp: '',
      totalRecords: 0,
      counts: {},
      errorMessage: message,
    };
  }
}

export async function executeRestore(fileContent: string, overwriteExisting = false): Promise<{ success: boolean; importedCount: number }> {
  const parsed = JSON.parse(fileContent);
  if (!parsed.data) {
    throw new Error('No data block found in backup');
  }

  if (overwriteExisting) {
    await dbService.clearAllData();
  }

  const result = await dbService.importAllData(parsed.data);
  await dbService.logActivity(null, null, 'BACKUP_RESTORED', `Restored ${result.importedCount} records from backup archive.`);
  return { success: true, importedCount: result.importedCount };
}
