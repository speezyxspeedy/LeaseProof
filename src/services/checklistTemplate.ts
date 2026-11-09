import { ItemCategory, InspectionItem, ConditionRating } from '../types';

export interface ChecklistTemplateItem {
  itemName: string;
  category: ItemCategory;
  defaultDescription?: string;
}

export const ROOM_DEFAULT_CHECKLISTS: Record<string, ChecklistTemplateItem[]> = {
  default: [
    // Walls & Paint
    { itemName: 'Paint Condition & Finish', category: 'WALLS_PAINT' },
    { itemName: 'Wall Cracks & Surface Imperfections', category: 'WALLS_PAINT' },
    { itemName: 'Wall Stains or Scuffs', category: 'WALLS_PAINT' },
    { itemName: 'Water Damage or Dampness Signs', category: 'WALLS_PAINT' },

    // Flooring
    { itemName: 'Flooring / Tiles Condition', category: 'FLOORING' },
    { itemName: 'Baseboards & Skirting', category: 'FLOORING' },
    { itemName: 'Floor Stains or Deep Scratches', category: 'FLOORING' },

    // Doors & Windows
    { itemName: 'Entry Door & Deadbolt / Handle', category: 'DOORS_WINDOWS' },
    { itemName: 'Windows & Glazing Condition', category: 'DOORS_WINDOWS' },
    { itemName: 'Window Latches & Hinges', category: 'DOORS_WINDOWS' },

    // Electrical
    { itemName: 'Ceiling / Wall Light Fixtures', category: 'ELECTRICAL' },
    { itemName: 'Wall Switches & Faceplates', category: 'ELECTRICAL' },
    { itemName: 'Power Sockets & Outlets', category: 'ELECTRICAL' },
  ],

  'Living Room': [
    { itemName: 'Paint Condition & Finish', category: 'WALLS_PAINT' },
    { itemName: 'Wall Cracks & Nail Holes', category: 'WALLS_PAINT' },
    { itemName: 'Main Entrance Door & Locks', category: 'DOORS_WINDOWS' },
    { itemName: 'Flooring (Tile/Hardwood/Carpet)', category: 'FLOORING' },
    { itemName: 'Windows, Screens & Blinds', category: 'DOORS_WINDOWS' },
    { itemName: 'Ceiling Fan & Ambient Lighting', category: 'ELECTRICAL' },
    { itemName: 'Power Outlets & TV Cable Point', category: 'ELECTRICAL' },
    { itemName: 'Air Conditioner & Remote', category: 'APPLIANCES' },
    { itemName: 'Cabinets / TV Unit / Shelves', category: 'FURNITURE_FIXTURES' },
    { itemName: 'Balcony Slider Door & Track', category: 'DOORS_WINDOWS' },
  ],

  Bedroom: [
    { itemName: 'Wall Paint & Surface Finish', category: 'WALLS_PAINT' },
    { itemName: 'Flooring & Baseboards', category: 'FLOORING' },
    { itemName: 'Internal Door & Lock Mechanism', category: 'DOORS_WINDOWS' },
    { itemName: 'Window Operation & Curtains', category: 'DOORS_WINDOWS' },
    { itemName: 'Ceiling Fan & Light Fixtures', category: 'ELECTRICAL' },
    { itemName: 'Wardrobe Doors, Drawers & Handles', category: 'FURNITURE_FIXTURES' },
    { itemName: 'Air Conditioner Unit & Filter', category: 'APPLIANCES' },
    { itemName: 'Power Sockets & Bedside Outlets', category: 'ELECTRICAL' },
  ],

  Kitchen: [
    { itemName: 'Kitchen Wall Tiles & Backsplash', category: 'WALLS_PAINT' },
    { itemName: 'Floor Tiles & Grout', category: 'FLOORING' },
    { itemName: 'Kitchen Countertop & Edge Sealing', category: 'FURNITURE_FIXTURES' },
    { itemName: 'Kitchen Sink, Faucet & Drainer', category: 'PLUMBING' },
    { itemName: 'Under-Sink Plumbing & Shutoff Valves', category: 'PLUMBING' },
    { itemName: 'Kitchen Overhead Cabinets & Hinges', category: 'FURNITURE_FIXTURES' },
    { itemName: 'Base Cabinets & Cutlery Drawers', category: 'FURNITURE_FIXTURES' },
    { itemName: 'Exhaust Fan / Chimney Hood', category: 'APPLIANCES' },
    { itemName: 'Gas Stove / Cooking Hob & Igniter', category: 'APPLIANCES' },
    { itemName: 'Refrigerator Cleanliness & Seal', category: 'APPLIANCES' },
    { itemName: 'Heavy-Duty Power Outlets', category: 'ELECTRICAL' },
  ],

  Bathroom: [
    { itemName: 'Wall Tiles, Grout & Caulking', category: 'WALLS_PAINT' },
    { itemName: 'Floor Tiles & Slope Drainage', category: 'FLOORING' },
    { itemName: 'Bathroom Door, Latch & Water Seal', category: 'DOORS_WINDOWS' },
    { itemName: 'Wash Basin & Mixer Tap', category: 'PLUMBING' },
    { itemName: 'Toilet Bowl, Cistern & Flush Mechanism', category: 'PLUMBING' },
    { itemName: 'Shower Head, Arm & Controls', category: 'PLUMBING' },
    { itemName: 'Floor Drain Trap & Water Flow', category: 'PLUMBING' },
    { itemName: 'Water Heater / Geyser Operation', category: 'APPLIANCES' },
    { itemName: 'Exhaust Fan & Ventilation Grill', category: 'ELECTRICAL' },
    { itemName: 'Mirror, Vanity Cabinet & Towel Rod', category: 'FURNITURE_FIXTURES' },
  ],

  Balcony: [
    { itemName: 'Balcony Flooring & Drain Outlet', category: 'FLOORING' },
    { itemName: 'Safety Railing & Parapet Wall', category: 'WALLS_PAINT' },
    { itemName: 'External Weather Paint & Ceiling', category: 'WALLS_PAINT' },
    { itemName: 'Outdoor Light Fixture & Waterproof Switch', category: 'ELECTRICAL' },
    { itemName: 'Washing Machine Water Supply & Drain Point', category: 'PLUMBING' },
  ],

  Parking: [
    { itemName: 'Bay Floor Surface & Oil Stains', category: 'FLOORING' },
    { itemName: 'Parking Bay Marking & Signage', category: 'WALLS_PAINT' },
    { itemName: 'Overhead Lights & Sensors', category: 'ELECTRICAL' },
  ],
};

export function generateItemsForRoom(
  inspectionId: string,
  roomId: string,
  roomType: string
): InspectionItem[] {
  const templates = ROOM_DEFAULT_CHECKLISTS[roomType] || ROOM_DEFAULT_CHECKLISTS.default;
  return templates.map((tmpl, idx) => ({
    id: `item_${inspectionId}_${roomId}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    inspection_id: inspectionId,
    room_id: roomId,
    item_name: tmpl.itemName,
    category: tmpl.category,
    condition: 'NOT_INSPECTED' as ConditionRating,
    description: '',
    notes: '',
    estimated_repair_cost: 0,
    created_at: new Date().toISOString(),
  }));
}
