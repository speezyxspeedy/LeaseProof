/**
 * LeaseProof Local IndexedDB Database Engine
 * Zero external database dependency, privacy-first local persistence.
 */

import {
  Property,
  Room,
  Inspection,
  InspectionItem,
  PhotoRecord,
  DamageRecord,
  RepairRecord,
  DocumentRecord,
  SignatureRecord,
  ActivityLog,
  AppSettings,
} from '../types';

const DB_NAME = 'LeaseProof_DB';
const DB_VERSION = 1;

export class DatabaseService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  public async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Properties
        if (!db.objectStoreNames.contains('properties')) {
          const store = db.createObjectStore('properties', { keyPath: 'id' });
          store.createIndex('property_code', 'property_code', { unique: true });
          store.createIndex('created_at', 'created_at', { unique: false });
        }

        // 2. Rooms
        if (!db.objectStoreNames.contains('rooms')) {
          const store = db.createObjectStore('rooms', { keyPath: 'id' });
          store.createIndex('property_id', 'property_id', { unique: false });
          store.createIndex('display_order', 'display_order', { unique: false });
        }

        // 3. Inspections
        if (!db.objectStoreNames.contains('inspections')) {
          const store = db.createObjectStore('inspections', { keyPath: 'id' });
          store.createIndex('property_id', 'property_id', { unique: false });
          store.createIndex('inspection_type', 'inspection_type', { unique: false });
          store.createIndex('inspection_date', 'inspection_date', { unique: false });
        }

        // 4. Inspection Items
        if (!db.objectStoreNames.contains('inspection_items')) {
          const store = db.createObjectStore('inspection_items', { keyPath: 'id' });
          store.createIndex('inspection_id', 'inspection_id', { unique: false });
          store.createIndex('room_id', 'room_id', { unique: false });
        }

        // 5. Photos
        if (!db.objectStoreNames.contains('photos')) {
          const store = db.createObjectStore('photos', { keyPath: 'id' });
          store.createIndex('property_id', 'property_id', { unique: false });
          store.createIndex('inspection_id', 'inspection_id', { unique: false });
          store.createIndex('room_id', 'room_id', { unique: false });
          store.createIndex('inspection_item_id', 'inspection_item_id', { unique: false });
        }

        // 6. Damages
        if (!db.objectStoreNames.contains('damages')) {
          const store = db.createObjectStore('damages', { keyPath: 'id' });
          store.createIndex('property_id', 'property_id', { unique: false });
          store.createIndex('inspection_id', 'inspection_id', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }

        // 7. Repairs
        if (!db.objectStoreNames.contains('repairs')) {
          const store = db.createObjectStore('repairs', { keyPath: 'id' });
          store.createIndex('property_id', 'property_id', { unique: false });
          store.createIndex('damage_id', 'damage_id', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }

        // 8. Documents
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', { keyPath: 'id' });
          store.createIndex('property_id', 'property_id', { unique: false });
          store.createIndex('inspection_id', 'inspection_id', { unique: false });
        }

        // 9. Signatures
        if (!db.objectStoreNames.contains('signatures')) {
          const store = db.createObjectStore('signatures', { keyPath: 'id' });
          store.createIndex('inspection_id', 'inspection_id', { unique: false });
        }

        // 10. Activity Logs
        if (!db.objectStoreNames.contains('activity_logs')) {
          const store = db.createObjectStore('activity_logs', { keyPath: 'id' });
          store.createIndex('property_id', 'property_id', { unique: false });
          store.createIndex('inspection_id', 'inspection_id', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 11. Settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  // Generic Helpers
  private async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  private async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async put<T>(storeName: string, item: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async delete(storeName: string, id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(value);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // Properties API
  public async getProperties(): Promise<Property[]> {
    const properties = await this.getAll<Property>('properties');
    return properties.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async getProperty(id: string): Promise<Property | undefined> {
    return this.getById<Property>('properties', id);
  }

  public async saveProperty(property: Property): Promise<void> {
    await this.put('properties', property);
    await this.logActivity(property.id, null, 'PROPERTY_SAVED', `Property "${property.name}" (${property.property_code}) saved.`);
  }

  public async deleteProperty(id: string): Promise<void> {
    const prop = await this.getProperty(id);
    if (prop) {
      await this.delete('properties', id);
      // Clean up linked rooms
      const rooms = await this.getRoomsByProperty(id);
      for (const r of rooms) {
        await this.delete('rooms', r.id);
      }
      await this.logActivity(id, null, 'PROPERTY_DELETED', `Property "${prop.name}" removed from workspace.`);
    }
  }

  // Rooms API
  public async getRoomsByProperty(propertyId: string): Promise<Room[]> {
    const rooms = await this.getByIndex<Room>('rooms', 'property_id', propertyId);
    return rooms.sort((a, b) => a.display_order - b.display_order);
  }

  public async saveRoom(room: Room): Promise<void> {
    await this.put('rooms', room);
  }

  public async deleteRoom(id: string): Promise<void> {
    await this.delete('rooms', id);
  }

  // Inspections API
  public async getInspections(): Promise<Inspection[]> {
    const inspections = await this.getAll<Inspection>('inspections');
    return inspections.sort((a, b) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime());
  }

  public async getInspectionsByProperty(propertyId: string): Promise<Inspection[]> {
    const inspections = await this.getByIndex<Inspection>('inspections', 'property_id', propertyId);
    return inspections.sort((a, b) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime());
  }

  public async getInspection(id: string): Promise<Inspection | undefined> {
    return this.getById<Inspection>('inspections', id);
  }

  public async saveInspection(inspection: Inspection): Promise<void> {
    await this.put('inspections', inspection);
    await this.logActivity(
      inspection.property_id,
      inspection.id,
      'INSPECTION_SAVED',
      `Inspection (${inspection.inspection_type}) on ${inspection.inspection_date} saved with status ${inspection.status}.`
    );
  }

  public async deleteInspection(id: string): Promise<void> {
    const insp = await this.getInspection(id);
    if (insp) {
      await this.delete('inspections', id);
      // Delete inspection items
      const items = await this.getInspectionItems(id);
      for (const it of items) {
        await this.delete('inspection_items', it.id);
      }
      await this.logActivity(insp.property_id, id, 'INSPECTION_DELETED', `Inspection ${id} deleted.`);
    }
  }

  // Inspection Items API
  public async getInspectionItems(inspectionId: string): Promise<InspectionItem[]> {
    return this.getByIndex<InspectionItem>('inspection_items', 'inspection_id', inspectionId);
  }

  public async getInspectionItemsByRoom(inspectionId: string, roomId: string): Promise<InspectionItem[]> {
    const items = await this.getInspectionItems(inspectionId);
    return items.filter((it) => it.room_id === roomId);
  }

  public async saveInspectionItem(item: InspectionItem): Promise<void> {
    await this.put('inspection_items', item);
  }

  public async batchSaveInspectionItems(items: InspectionItem[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('inspection_items', 'readwrite');
      const store = tx.objectStore('inspection_items');
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Photos API
  public async getPhotos(propertyId?: string, inspectionId?: string, roomId?: string): Promise<PhotoRecord[]> {
    let photos = await this.getAll<PhotoRecord>('photos');
    if (propertyId) {
      photos = photos.filter((p) => p.property_id === propertyId);
    }
    if (inspectionId) {
      photos = photos.filter((p) => p.inspection_id === inspectionId);
    }
    if (roomId) {
      photos = photos.filter((p) => p.room_id === roomId);
    }
    return photos.sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime());
  }

  public async getPhotosByItem(itemId: string): Promise<PhotoRecord[]> {
    return this.getByIndex<PhotoRecord>('photos', 'inspection_item_id', itemId);
  }

  public async savePhoto(photo: PhotoRecord): Promise<void> {
    await this.put('photos', photo);
    await this.logActivity(
      photo.property_id,
      photo.inspection_id || null,
      'PHOTO_ATTACHED',
      `Evidence photo attached: ${photo.file_name} (${photo.photo_category}).`
    );
  }

  public async deletePhoto(id: string): Promise<void> {
    await this.delete('photos', id);
  }

  // Damages API
  public async getDamages(propertyId?: string): Promise<DamageRecord[]> {
    let damages = await this.getAll<DamageRecord>('damages');
    if (propertyId) {
      damages = damages.filter((d) => d.property_id === propertyId);
    }
    return damages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async saveDamage(damage: DamageRecord): Promise<void> {
    await this.put('damages', damage);
    await this.logActivity(
      damage.property_id,
      damage.inspection_id || null,
      'DAMAGE_RECORDED',
      `Damage logged: ${damage.item_name} [${damage.severity}] - Status: ${damage.status}.`
    );
  }

  public async deleteDamage(id: string): Promise<void> {
    await this.delete('damages', id);
  }

  // Repairs API
  public async getRepairs(propertyId?: string): Promise<RepairRecord[]> {
    let repairs = await this.getAll<RepairRecord>('repairs');
    if (propertyId) {
      repairs = repairs.filter((r) => r.property_id === propertyId);
    }
    return repairs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async saveRepair(repair: RepairRecord): Promise<void> {
    await this.put('repairs', repair);
    await this.logActivity(
      repair.property_id,
      null,
      'REPAIR_UPDATED',
      `Maintenance record updated: ${repair.title} - Status: ${repair.status}.`
    );
  }

  public async deleteRepair(id: string): Promise<void> {
    await this.delete('repairs', id);
  }

  // Documents API
  public async getDocuments(propertyId?: string): Promise<DocumentRecord[]> {
    let docs = await this.getAll<DocumentRecord>('documents');
    if (propertyId) {
      docs = docs.filter((d) => d.property_id === propertyId);
    }
    return docs.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  }

  public async saveDocument(doc: DocumentRecord): Promise<void> {
    await this.put('documents', doc);
    await this.logActivity(
      doc.property_id,
      doc.inspection_id || null,
      'DOCUMENT_UPLOADED',
      `Document "${doc.file_name}" (${doc.category}) uploaded.`
    );
  }

  public async deleteDocument(id: string): Promise<void> {
    await this.delete('documents', id);
  }

  // Signatures API
  public async getSignatures(inspectionId: string): Promise<SignatureRecord[]> {
    return this.getByIndex<SignatureRecord>('signatures', 'inspection_id', inspectionId);
  }

  public async saveSignature(sig: SignatureRecord): Promise<void> {
    await this.put('signatures', sig);
    await this.logActivity(
      null,
      sig.inspection_id,
      'SIGNATURE_RECORDED',
      `Sign-off recorded for inspection ${sig.inspection_id} by ${sig.signer_name} (${sig.signer_role}).`
    );
  }

  public async deleteSignature(id: string): Promise<void> {
    await this.delete('signatures', id);
  }

  // Activity Logs API
  public async getActivityLogs(propertyId?: string, limit = 100): Promise<ActivityLog[]> {
    let logs = await this.getAll<ActivityLog>('activity_logs');
    if (propertyId) {
      logs = logs.filter((l) => l.property_id === propertyId);
    }
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return logs.slice(0, limit);
  }

  public async logActivity(
    propertyId: string | null,
    inspectionId: string | null,
    eventType: string,
    description: string
  ): Promise<void> {
    const log: ActivityLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      property_id: propertyId,
      inspection_id: inspectionId,
      event_type: eventType,
      description,
      timestamp: new Date().toISOString(),
    };
    await this.put('activity_logs', log);
  }

  // Settings API
  public async getSettings(): Promise<AppSettings> {
    const settings = await this.getById<AppSettings>('settings', 'default');
    if (settings) return settings;

    const defaultSettings: AppSettings = {
      id: 'default',
      theme: 'light',
      photo_size_limit_mb: 5,
      company_name: 'LeaseProof Handover Systems',
      company_tagline: 'Document Every Detail. Protect Every Handover.',
      default_inspector_name: 'Property Inspection Officer',
      disclaimer_text:
        'This document records factual observed property condition at time of inspection. It does not constitute legal determination of liability or guarantee hidden structural integrity.',
    };
    await this.put('settings', defaultSettings);
    return defaultSettings;
  }

  public async saveSettings(settings: AppSettings): Promise<void> {
    await this.put('settings', settings);
  }

  // Full Database Dump & Reset for Backup/Restore
  public async exportAllData(): Promise<Record<string, unknown[]>> {
    const stores = [
      'properties',
      'rooms',
      'inspections',
      'inspection_items',
      'photos',
      'damages',
      'repairs',
      'documents',
      'signatures',
      'activity_logs',
      'settings',
    ];
    const dump: Record<string, unknown[]> = {};
    for (const store of stores) {
      dump[store] = await this.getAll(store);
    }
    return dump;
  }

  public async clearAllData(): Promise<void> {
    const db = await this.getDB();
    const stores = [
      'properties',
      'rooms',
      'inspections',
      'inspection_items',
      'photos',
      'damages',
      'repairs',
      'documents',
      'signatures',
      'activity_logs',
    ];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(stores, 'readwrite');
      for (const store of stores) {
        tx.objectStore(store).clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async importAllData(data: Record<string, unknown[]>): Promise<{ importedCount: number }> {
    const db = await this.getDB();
    const storeNames = Object.keys(data).filter((s) => db.objectStoreNames.contains(s));
    let count = 0;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, 'readwrite');
      for (const storeName of storeNames) {
        const store = tx.objectStore(storeName);
        const items = data[storeName] as unknown[];
        if (Array.isArray(items)) {
          for (const item of items) {
            store.put(item);
            count++;
          }
        }
      }
      tx.oncomplete = () => resolve({ importedCount: count });
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const dbService = new DatabaseService();
