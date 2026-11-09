/**
 * LeaseProof Type Definitions
 * Property Inspection, Rental Handover & Condition Documentation Platform
 */

export type PropertyType =
  | 'Apartment'
  | 'Independent House'
  | 'Villa'
  | 'Commercial Shop'
  | 'Office'
  | 'Warehouse'
  | 'PG / Hostel'
  | 'Other';

export type FurnishingType = 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished';

export interface Property {
  id: string;
  property_code: string; // e.g. LP-2026-0001
  name: string;
  property_type: PropertyType;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  rooms_count: number;
  bathrooms_count: number;
  furnishing_type: FurnishingType;
  owner_name: string;
  tenant_name?: string;
  rental_start_date?: string;
  expected_end_date?: string;
  monthly_rent?: number;
  security_deposit?: number;
  notes?: string;
  cover_image?: string; // base64 or blob URL
  is_archived?: boolean;
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
}

export type RoomCategory =
  | 'Living Room'
  | 'Bedroom'
  | 'Kitchen'
  | 'Bathroom'
  | 'Balcony'
  | 'Hallway'
  | 'Storage'
  | 'Parking'
  | 'Exterior'
  | 'Other';

export interface Room {
  id: string;
  property_id: string;
  room_name: string;
  room_type: RoomCategory;
  description?: string;
  display_order: number;
  created_at: string;
}

export type InspectionType = 'MOVE-IN' | 'MOVE-OUT' | 'ROUTINE' | 'MAINTENANCE';

export type InspectionStatus = 'IN_PROGRESS' | 'FINALIZED' | 'AMENDED';

export interface InspectionAmendment {
  timestamp: string;
  reason: string;
  author: string;
  changes_summary: string;
}

export interface Inspection {
  id: string;
  property_id: string;
  inspection_type: InspectionType;
  parent_inspection_id?: string | null; // For Move-Out referencing Move-In
  inspector_name: string;
  tenant_name?: string;
  inspection_date: string;
  status: InspectionStatus;
  notes?: string;
  finalized_at?: string | null;
  amendments?: InspectionAmendment[];
  created_at: string;
  is_demo?: boolean;
}

export type ItemCategory =
  | 'WALLS_PAINT'
  | 'FLOORING'
  | 'DOORS_WINDOWS'
  | 'ELECTRICAL'
  | 'FURNITURE_FIXTURES'
  | 'PLUMBING'
  | 'APPLIANCES'
  | 'OTHER';

export type ConditionRating =
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'DAMAGED'
  | 'MISSING'
  | 'NOT_APPLICABLE'
  | 'NOT_INSPECTED';

export interface InspectionItem {
  id: string;
  inspection_id: string;
  room_id: string;
  item_name: string;
  category: ItemCategory;
  condition: ConditionRating;
  description?: string;
  notes?: string;
  estimated_repair_cost?: number;
  created_at: string;
}

export type PhotoCategory =
  | 'BEFORE'
  | 'AFTER'
  | 'DAMAGE'
  | 'GENERAL'
  | 'REPAIR';

export interface PhotoRecord {
  id: string;
  property_id: string;
  inspection_id?: string | null;
  room_id?: string | null;
  inspection_item_id?: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  image_data: string; // Base64 data URL for fast visual rendering & portable backup
  photo_category: PhotoCategory;
  description?: string;
  captured_at: string;
}

export type DamageSeverity = 'Minor' | 'Moderate' | 'Severe' | 'Critical';

export type DamageStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'REPAIR_SCHEDULED'
  | 'REPAIRED'
  | 'ACCEPTED'
  | 'DISPUTED'
  | 'CLOSED';

export interface DamageRecord {
  id: string;
  damage_code: string;
  property_id: string;
  inspection_id?: string | null;
  room_id?: string | null;
  item_name: string;
  category: string;
  severity: DamageSeverity;
  description: string;
  estimated_cost: number;
  actual_cost?: number;
  status: DamageStatus;
  resolution_notes?: string;
  created_at: string;
}

export type RepairStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface RepairRecord {
  id: string;
  property_id: string;
  damage_id?: string | null;
  title: string;
  room_name?: string;
  description: string;
  service_provider?: string;
  repair_date?: string;
  estimated_cost: number;
  actual_cost: number;
  status: RepairStatus;
  notes?: string;
  created_at: string;
}

export type DocumentCategory = 'Agreement' | 'Invoice' | 'Report' | 'Other';

export interface DocumentRecord {
  id: string;
  property_id: string;
  inspection_id?: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  file_data: string; // Base64 data URL for local storage & download
  description?: string;
  category: DocumentCategory;
  uploaded_at: string;
}

export interface SignatureRecord {
  id: string;
  inspection_id: string;
  signer_name: string;
  signer_role: 'Inspector' | 'Owner / Landlord' | 'Tenant' | 'Agent';
  signature_data: string; // Canvas base64 PNG data URL
  date: string;
  notes?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  property_id?: string | null;
  inspection_id?: string | null;
  event_type: string;
  description: string;
  timestamp: string;
}

export interface AppSettings {
  id: string;
  theme: 'light' | 'slate';
  photo_size_limit_mb: number;
  company_name: string;
  company_tagline: string;
  default_inspector_name: string;
  disclaimer_text: string;
}

export type ComparisonDiffCategory =
  | 'NO_CHANGE'
  | 'IMPROVED'
  | 'CONDITION_DECLINED'
  | 'NEW_DAMAGE'
  | 'ITEM_MISSING'
  | 'NOT_COMPARABLE'
  | 'REQUIRES_REVIEW';

export interface ItemComparisonResult {
  itemName: string;
  category: ItemCategory;
  roomName: string;
  roomId: string;
  beforeItem?: InspectionItem;
  afterItem?: InspectionItem;
  beforePhotos: PhotoRecord[];
  afterPhotos: PhotoRecord[];
  diffCategory: ComparisonDiffCategory;
  notesDiff?: string;
  costDiff?: number;
}
