import { dbService } from './db';
import { generateSyntheticPhoto } from './imageUtils';
import {
  Property,
  Room,
  Inspection,
  InspectionItem,
  PhotoRecord,
  DamageRecord,
  RepairRecord,
  SignatureRecord,
  DocumentRecord,
} from '../types';

export async function seedDemoData(): Promise<void> {
  // 1. Properties
  const prop1: Property = {
    id: 'demo_prop_1',
    property_code: 'LP-2026-0001',
    name: 'Silverwood Residence, Apt 4B',
    property_type: 'Apartment',
    address: '422 Silverwood Avenue, Suite 4B',
    city: 'Seattle',
    state: 'WA',
    postal_code: '98101',
    rooms_count: 5,
    bathrooms_count: 2,
    furnishing_type: 'Fully Furnished',
    owner_name: 'Marcus Sterling',
    tenant_name: 'Elena Rostova',
    rental_start_date: '2025-06-01',
    expected_end_date: '2026-05-31',
    monthly_rent: 2400,
    security_deposit: 4800,
    notes: 'Premium high-rise unit. Hardwood flooring throughout living areas, custom Italian kitchen cabinetry.',
    is_demo: true,
    created_at: '2025-05-20T10:00:00.000Z',
    updated_at: '2025-05-20T10:00:00.000Z',
  };

  const prop2: Property = {
    id: 'demo_prop_2',
    property_code: 'LP-2026-0002',
    name: 'Willow Creek Townhouse No. 12',
    property_type: 'Independent House',
    address: '812 Willow Creek Blvd',
    city: 'Bellevue',
    state: 'WA',
    postal_code: '98004',
    rooms_count: 7,
    bathrooms_count: 3,
    furnishing_type: 'Semi-Furnished',
    owner_name: 'David Chen',
    tenant_name: 'Sophia & Liam Vance',
    rental_start_date: '2025-08-15',
    expected_end_date: '2026-08-14',
    monthly_rent: 3250,
    security_deposit: 6500,
    notes: '2-story townhouse with private attached 2-car garage and landscaped back patio.',
    is_demo: true,
    created_at: '2025-08-01T09:00:00.000Z',
    updated_at: '2025-08-01T09:00:00.000Z',
  };

  const prop3: Property = {
    id: 'demo_prop_3',
    property_code: 'LP-2026-0003',
    name: 'Highline Executive Studio 808',
    property_type: 'Apartment',
    address: '1050 Pine Street, Unit 808',
    city: 'Seattle',
    state: 'WA',
    postal_code: '98104',
    rooms_count: 3,
    bathrooms_count: 1,
    furnishing_type: 'Fully Furnished',
    owner_name: 'Apex Property Holdings LLC',
    tenant_name: 'Alexander Wright',
    rental_start_date: '2026-01-10',
    expected_end_date: '2027-01-09',
    monthly_rent: 1850,
    security_deposit: 2500,
    notes: 'Designer studio apartment with floor-to-ceiling soundproof windows and smart thermostat.',
    is_demo: true,
    created_at: '2026-01-05T14:00:00.000Z',
    updated_at: '2026-01-05T14:00:00.000Z',
  };

  await dbService.saveProperty(prop1);
  await dbService.saveProperty(prop2);
  await dbService.saveProperty(prop3);

  // 2. Rooms for Property 1
  const rooms: Room[] = [
    {
      id: 'room_1_living',
      property_id: 'demo_prop_1',
      room_name: 'Living Room',
      room_type: 'Living Room',
      description: 'Open plan living area with balcony slider',
      display_order: 1,
      created_at: '2025-05-20T10:10:00.000Z',
    },
    {
      id: 'room_1_bed',
      property_id: 'demo_prop_1',
      room_name: 'Master Bedroom',
      room_type: 'Bedroom',
      description: 'South-facing bedroom with built-in wardrobe',
      display_order: 2,
      created_at: '2025-05-20T10:10:00.000Z',
    },
    {
      id: 'room_1_kitchen',
      property_id: 'demo_prop_1',
      room_name: 'Gourmet Kitchen',
      room_type: 'Kitchen',
      description: 'Stone quartz countertops and stainless steel appliances',
      display_order: 3,
      created_at: '2025-05-20T10:10:00.000Z',
    },
    {
      id: 'room_1_bath',
      property_id: 'demo_prop_1',
      room_name: 'Ensuite Bathroom',
      room_type: 'Bathroom',
      description: 'Walk-in rain shower and floating vanity',
      display_order: 4,
      created_at: '2025-05-20T10:10:00.000Z',
    },
    {
      id: 'room_1_balcony',
      property_id: 'demo_prop_1',
      room_name: 'Private Balcony',
      room_type: 'Balcony',
      description: 'City skyline view with anti-skid tiles',
      display_order: 5,
      created_at: '2025-05-20T10:10:00.000Z',
    },
  ];

  for (const r of rooms) {
    await dbService.saveRoom(r);
  }

  // 3. Move-In Inspection (Finalized)
  const moveInInspection: Inspection = {
    id: 'insp_movein_001',
    property_id: 'demo_prop_1',
    inspection_type: 'MOVE-IN',
    parent_inspection_id: null,
    inspector_name: 'Sarah Jenkins (Certified Inspector #LP-88)',
    tenant_name: 'Elena Rostova',
    inspection_date: '2025-05-31',
    status: 'FINALIZED',
    notes: 'Complete handover move-in verification. Property in immaculate condition. Both keys and access fob handed over.',
    finalized_at: '2025-05-31T16:30:00.000Z',
    is_demo: true,
    created_at: '2025-05-31T14:00:00.000Z',
  };
  await dbService.saveInspection(moveInInspection);

  // 4. Move-Out Inspection (Linked to Move-In)
  const moveOutInspection: Inspection = {
    id: 'insp_moveout_001',
    property_id: 'demo_prop_1',
    inspection_type: 'MOVE-OUT',
    parent_inspection_id: 'insp_movein_001',
    inspector_name: 'Sarah Jenkins (Certified Inspector #LP-88)',
    tenant_name: 'Elena Rostova',
    inspection_date: '2026-05-30',
    status: 'FINALIZED',
    notes: 'End of tenancy handover. General wear observed. Kitchen tile has hairline crack and master bedroom door has a noticeable scuff.',
    finalized_at: '2026-05-30T17:00:00.000Z',
    is_demo: true,
    created_at: '2026-05-30T14:30:00.000Z',
  };
  await dbService.saveInspection(moveOutInspection);

  // 5. Move-In Checklist Items
  const moveInItems: InspectionItem[] = [
    {
      id: 'mi_item_1',
      inspection_id: 'insp_movein_001',
      room_id: 'room_1_living',
      item_name: 'Paint Condition & Finish',
      category: 'WALLS_PAINT',
      condition: 'EXCELLENT',
      notes: 'Freshly painted matte off-white. No blemishes.',
      created_at: '2025-05-31T14:10:00.000Z',
    },
    {
      id: 'mi_item_2',
      inspection_id: 'insp_movein_001',
      room_id: 'room_1_living',
      item_name: 'Flooring (Tile/Hardwood/Carpet)',
      category: 'FLOORING',
      condition: 'EXCELLENT',
      notes: 'Oak hardwood floors polished, zero scuffs.',
      created_at: '2025-05-31T14:15:00.000Z',
    },
    {
      id: 'mi_item_3',
      inspection_id: 'insp_movein_001',
      room_id: 'room_1_kitchen',
      item_name: 'Floor Tiles & Grout',
      category: 'FLOORING',
      condition: 'GOOD',
      notes: 'Porcelain tiles intact and sealed cleanly.',
      created_at: '2025-05-31T14:20:00.000Z',
    },
    {
      id: 'mi_item_4',
      inspection_id: 'insp_movein_001',
      room_id: 'room_1_kitchen',
      item_name: 'Gas Stove / Cooking Hob & Igniter',
      category: 'APPLIANCES',
      condition: 'EXCELLENT',
      notes: 'Stainless 4-burner Bosch range tested and clean.',
      created_at: '2025-05-31T14:25:00.000Z',
    },
    {
      id: 'mi_item_5',
      inspection_id: 'insp_movein_001',
      room_id: 'room_1_bed',
      item_name: 'Internal Door & Lock Mechanism',
      category: 'DOORS_WINDOWS',
      condition: 'EXCELLENT',
      notes: 'Solid core timber door latches flush.',
      created_at: '2025-05-31T14:30:00.000Z',
    },
    {
      id: 'mi_item_6',
      inspection_id: 'insp_movein_001',
      room_id: 'room_1_bed',
      item_name: 'Air Conditioner Unit & Filter',
      category: 'APPLIANCES',
      condition: 'GOOD',
      notes: 'Cooling test passed. Filter spotless.',
      created_at: '2025-05-31T14:35:00.000Z',
    },
    {
      id: 'mi_item_7',
      inspection_id: 'insp_movein_001',
      room_id: 'room_1_bath',
      item_name: 'Toilet Bowl, Cistern & Flush Mechanism',
      category: 'PLUMBING',
      condition: 'EXCELLENT',
      notes: 'Dual flush working cleanly, no leak.',
      created_at: '2025-05-31T14:40:00.000Z',
    },
  ];

  // 6. Move-Out Checklist Items (reflecting realistic handover changes)
  const moveOutItems: InspectionItem[] = [
    {
      id: 'mo_item_1',
      inspection_id: 'insp_moveout_001',
      room_id: 'room_1_living',
      item_name: 'Paint Condition & Finish',
      category: 'WALLS_PAINT',
      condition: 'GOOD',
      notes: 'Minor light picture hanger scuffs on north wall, acceptable normal wear.',
      created_at: '2026-05-30T14:50:00.000Z',
    },
    {
      id: 'mo_item_2',
      inspection_id: 'insp_moveout_001',
      room_id: 'room_1_living',
      item_name: 'Flooring (Tile/Hardwood/Carpet)',
      category: 'FLOORING',
      condition: 'GOOD',
      notes: 'Light surface wear near sofa area. Clean overall.',
      created_at: '2026-05-30T14:55:00.000Z',
    },
    {
      id: 'mo_item_3',
      inspection_id: 'insp_moveout_001',
      room_id: 'room_1_kitchen',
      item_name: 'Floor Tiles & Grout',
      category: 'FLOORING',
      condition: 'DAMAGED', // DECLINED from GOOD to DAMAGED
      notes: 'Hairline crack across tile in front of refrigerator, likely heavy dropped utensil.',
      estimated_repair_cost: 180,
      created_at: '2026-05-30T15:00:00.000Z',
    },
    {
      id: 'mo_item_4',
      inspection_id: 'insp_moveout_001',
      room_id: 'room_1_kitchen',
      item_name: 'Gas Stove / Cooking Hob & Igniter',
      category: 'APPLIANCES',
      condition: 'EXCELLENT',
      notes: 'Professionally cleaned prior to move-out. All burners operating.',
      created_at: '2026-05-30T15:05:00.000Z',
    },
    {
      id: 'mo_item_5',
      inspection_id: 'insp_moveout_001',
      room_id: 'room_1_bed',
      item_name: 'Internal Door & Lock Mechanism',
      category: 'DOORS_WINDOWS',
      condition: 'FAIR', // DECLINED from EXCELLENT to FAIR
      notes: 'Noticeable 4-inch scuff and chip on interior face from moving bed frame.',
      estimated_repair_cost: 75,
      created_at: '2026-05-30T15:10:00.000Z',
    },
    {
      id: 'mo_item_6',
      inspection_id: 'insp_moveout_001',
      room_id: 'room_1_bed',
      item_name: 'Air Conditioner Unit & Filter',
      category: 'APPLIANCES',
      condition: 'GOOD',
      notes: 'Unit working normally, remote returned with fresh batteries.',
      created_at: '2026-05-30T15:15:00.000Z',
    },
    {
      id: 'mo_item_7',
      inspection_id: 'insp_moveout_001',
      room_id: 'room_1_bath',
      item_name: 'Toilet Bowl, Cistern & Flush Mechanism',
      category: 'PLUMBING',
      condition: 'EXCELLENT',
      notes: 'Fully functional, sanitized and in great shape.',
      created_at: '2026-05-30T15:20:00.000Z',
    },
  ];

  await dbService.batchSaveInspectionItems([...moveInItems, ...moveOutItems]);

  // 7. Realistic Evidence Photos
  const photo1: PhotoRecord = {
    id: 'demo_photo_mi_kitchen',
    property_id: 'demo_prop_1',
    inspection_id: 'insp_movein_001',
    room_id: 'room_1_kitchen',
    inspection_item_id: 'mi_item_3',
    file_name: 'movein_kitchen_tile_original.jpg',
    file_type: 'image/jpeg',
    file_size: 142000,
    image_data: generateSyntheticPhoto(
      'Kitchen Floor Tiles (Move-In)',
      'BEFORE - INTACT',
      '#e2e8f0',
      '#0f172a'
    ),
    photo_category: 'BEFORE',
    description: 'Original baseline photo of kitchen floor tiles in front of fridge.',
    captured_at: '2025-05-31T14:22:00.000Z',
  };

  const photo2: PhotoRecord = {
    id: 'demo_photo_mo_kitchen',
    property_id: 'demo_prop_1',
    inspection_id: 'insp_moveout_001',
    room_id: 'room_1_kitchen',
    inspection_item_id: 'mo_item_3',
    file_name: 'moveout_kitchen_tile_crack.jpg',
    file_type: 'image/jpeg',
    file_size: 154000,
    image_data: generateSyntheticPhoto(
      'Kitchen Tile Impact Crack',
      'DAMAGE - MOVE-OUT',
      '#fee2e2',
      '#991b1b'
    ),
    photo_category: 'DAMAGE',
    description: 'Impact fracture across central 30x30 tile.',
    captured_at: '2026-05-30T15:02:00.000Z',
  };

  const photo3: PhotoRecord = {
    id: 'demo_photo_mo_door',
    property_id: 'demo_prop_1',
    inspection_id: 'insp_moveout_001',
    room_id: 'room_1_bed',
    inspection_item_id: 'mo_item_5',
    file_name: 'bedroom_door_scuff.jpg',
    file_type: 'image/jpeg',
    file_size: 128000,
    image_data: generateSyntheticPhoto(
      'Bedroom Door Edge Scuff',
      'DAMAGE - MOVE-OUT',
      '#fef3c7',
      '#92400e'
    ),
    photo_category: 'DAMAGE',
    description: 'Paint chipped on door corner during furniture relocation.',
    captured_at: '2026-05-30T15:12:00.000Z',
  };

  await dbService.savePhoto(photo1);
  await dbService.savePhoto(photo2);
  await dbService.savePhoto(photo3);

  // 8. Damage Register Records
  const damage1: DamageRecord = {
    id: 'dmg_001',
    damage_code: 'DMG-2026-001',
    property_id: 'demo_prop_1',
    inspection_id: 'insp_moveout_001',
    room_id: 'room_1_kitchen',
    item_name: 'Kitchen Porcelain Floor Tile',
    category: 'Flooring',
    severity: 'Moderate',
    description: '30x30 porcelain tile fractured in front of refrigerator. Requires individual tile replacement and grouting.',
    estimated_cost: 180,
    actual_cost: 165,
    status: 'REPAIR_SCHEDULED',
    resolution_notes: 'Replacement tile sourced from building storage; repair scheduled with Apex Masonry.',
    created_at: '2026-05-30T15:03:00.000Z',
  };

  const damage2: DamageRecord = {
    id: 'dmg_002',
    damage_code: 'DMG-2026-002',
    property_id: 'demo_prop_1',
    inspection_id: 'insp_moveout_001',
    room_id: 'room_1_bed',
    item_name: 'Master Bedroom Door Face',
    category: 'Doors & Windows',
    severity: 'Minor',
    description: '4-inch paint scrape and wood chip on interior lower section.',
    estimated_cost: 75,
    actual_cost: 0,
    status: 'OPEN',
    resolution_notes: 'Under review for spot touch-up vs door refinishing.',
    created_at: '2026-05-30T15:13:00.000Z',
  };

  await dbService.saveDamage(damage1);
  await dbService.saveDamage(damage2);

  // 9. Repair Records
  const repair1: RepairRecord = {
    id: 'rep_001',
    property_id: 'demo_prop_1',
    damage_id: 'dmg_001',
    title: 'Kitchen Floor Tile Replacement',
    room_name: 'Gourmet Kitchen',
    description: 'Chisel out fractured tile, clean adhesive bed, set spare matching tile, and regrout with waterproof gray grout.',
    service_provider: 'Apex Masonry & Handyman Services',
    repair_date: '2026-06-03',
    estimated_cost: 180,
    actual_cost: 165,
    status: 'SCHEDULED',
    notes: 'Access confirmed with property manager.',
    created_at: '2026-05-31T09:00:00.000Z',
  };

  await dbService.saveRepair(repair1);

  // 10. Sample Document
  const doc1: DocumentRecord = {
    id: 'doc_001',
    property_id: 'demo_prop_1',
    inspection_id: 'insp_movein_001',
    file_name: 'Residential_Lease_Agreement_Apt4B.pdf',
    file_type: 'application/pdf',
    file_size: 450000,
    file_data: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL0NyZWF0b3IgKExlYXNlUHJvb2YgRG9jKQovVGl0bGUgKFJlc2lkZW50aWFsIExlYXNlIEFncmVlbWVudCkKPj4KZW5kb2JqCg==',
    description: 'Executed 12-month lease agreement signed by Marcus Sterling and Elena Rostova.',
    category: 'Agreement',
    uploaded_at: '2025-05-25T11:00:00.000Z',
  };
  await dbService.saveDocument(doc1);

  // 11. Signatures
  // Generate a clean stylized signature canvas
  const makeSigCanvas = (name: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 150);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(50, 80);
      ctx.bezierCurveTo(90, 40, 120, 120, 170, 70);
      ctx.bezierCurveTo(200, 50, 240, 100, 290, 60);
      ctx.bezierCurveTo(310, 50, 340, 90, 360, 75);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Signed: ${name}`, 50, 130);
    }
    return canvas.toDataURL('image/png');
  };

  const sigInspector: SignatureRecord = {
    id: 'sig_001',
    inspection_id: 'insp_movein_001',
    signer_name: 'Sarah Jenkins',
    signer_role: 'Inspector',
    signature_data: makeSigCanvas('Sarah Jenkins'),
    date: '2025-05-31',
    notes: 'Physical on-site inspection completed in presence of tenant.',
    created_at: '2025-05-31T16:25:00.000Z',
  };

  const sigTenant: SignatureRecord = {
    id: 'sig_002',
    inspection_id: 'insp_movein_001',
    signer_name: 'Elena Rostova',
    signer_role: 'Tenant',
    signature_data: makeSigCanvas('Elena Rostova'),
    date: '2025-05-31',
    notes: 'I acknowledge the baseline condition recorded above.',
    created_at: '2025-05-31T16:28:00.000Z',
  };

  await dbService.saveSignature(sigInspector);
  await dbService.saveSignature(sigTenant);
}

export async function clearDemoData(): Promise<void> {
  const props = await dbService.getProperties();
  const demoProps = props.filter((p) => p.is_demo);
  for (const p of demoProps) {
    await dbService.deleteProperty(p.id);
  }
}
