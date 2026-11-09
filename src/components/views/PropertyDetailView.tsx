import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  User,
  Plus,
  Trash2,
  Edit3,
  ClipboardCheck,
  FolderLock,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Layers,
  Calendar,
} from 'lucide-react';
import { Property, Room, Inspection, DamageRecord, DocumentRecord, RoomCategory } from '../../types';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { dbService } from '../../services/db';

interface PropertyDetailViewProps {
  property: Property;
  rooms: Room[];
  inspections: Inspection[];
  damages: DamageRecord[];
  documents: DocumentRecord[];
  onBack: () => void;
  onRefreshData: () => Promise<void>;
  onSelectInspection: (inspectionId: string) => void;
  onNewInspection: (propertyId: string, type?: any) => void;
}

export const PropertyDetailView: React.FC<PropertyDetailViewProps> = ({
  property,
  rooms,
  inspections,
  damages,
  documents,
  onBack,
  onRefreshData,
  onSelectInspection,
  onNewInspection,
}) => {
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<RoomCategory>('Living Room');
  const [roomDesc, setRoomDesc] = useState('');

  const moveInInsp = inspections.find((i) => i.inspection_type === 'MOVE-IN');
  const moveOutInsp = inspections.find((i) => i.inspection_type === 'MOVE-OUT');

  const openAddRoom = () => {
    setEditingRoom(null);
    setRoomName('');
    setRoomType('Bedroom');
    setRoomDesc('');
    setIsRoomModalOpen(true);
  };

  const openEditRoom = (r: Room) => {
    setEditingRoom(r);
    setRoomName(r.room_name);
    setRoomType(r.room_type);
    setRoomDesc(r.description || '');
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    if (editingRoom) {
      await dbService.saveRoom({
        ...editingRoom,
        room_name: roomName.trim(),
        room_type: roomType,
        description: roomDesc.trim(),
      });
    } else {
      const newRoom: Room = {
        id: `room_${property.id}_${Date.now()}`,
        property_id: property.id,
        room_name: roomName.trim(),
        room_type: roomType,
        description: roomDesc.trim(),
        display_order: rooms.length + 1,
        created_at: new Date().toISOString(),
      };
      await dbService.saveRoom(newRoom);
    }
    await onRefreshData();
    setIsRoomModalOpen(false);
  };

  const handleDeleteRoom = async (id: string, name: string) => {
    if (confirm(`Remove room "${name}" from this property?`)) {
      await dbService.deleteRoom(id);
      await onRefreshData();
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === rooms.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = rooms[index];
    const target = rooms[targetIndex];

    const currentOrder = current.display_order;
    current.display_order = target.display_order;
    target.display_order = currentOrder;

    await dbService.saveRoom(current);
    await dbService.saveRoom(target);
    await onRefreshData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button & top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Properties
        </button>

        <div className="flex items-center gap-2">
          {!moveInInsp ? (
            <button
              onClick={() => onNewInspection(property.id, 'MOVE-IN')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" /> Start Move-In Inspection
            </button>
          ) : (
            <button
              onClick={() => onNewInspection(property.id, 'MOVE-OUT')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" /> Start Move-Out Inspection
            </button>
          )}
        </div>
      </div>

      {/* Property Hero Summary Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                {property.property_code}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {property.property_type}
              </span>
              {property.is_demo && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Demo Property
                </span>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900">{property.name}</h1>
            <p className="text-xs text-slate-600 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              {property.address}, {property.city}, {property.state} {property.postal_code}
            </p>
          </div>

          {/* Handover Status Badges */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-center justify-between gap-4">
              <span className="text-slate-500 font-medium">Move-In Status:</span>
              {moveInInsp ? (
                <StatusBadge status={moveInInsp.status} />
              ) : (
                <span className="text-slate-400 font-medium italic">Pending Baseline</span>
              )}
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-center justify-between gap-4">
              <span className="text-slate-500 font-medium">Move-Out Status:</span>
              {moveOutInsp ? (
                <StatusBadge status={moveOutInsp.status} />
              ) : (
                <span className="text-slate-400 font-medium italic">Not Commenced</span>
              )}
            </div>
          </div>
        </div>

        {/* Specs & Tenancy Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div>
            <div className="text-slate-400 font-medium uppercase text-[10px]">Owner / Landlord</div>
            <div className="font-bold text-slate-900 mt-0.5">{property.owner_name}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium uppercase text-[10px]">Active Tenant</div>
            <div className="font-bold text-slate-900 mt-0.5">{property.tenant_name || 'Vacant / None'}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium uppercase text-[10px]">Monthly Rent / Deposit</div>
            <div className="font-bold text-slate-900 mt-0.5">
              {property.monthly_rent ? `$${property.monthly_rent.toLocaleString()}` : '—'}
              {property.security_deposit ? ` / $${property.security_deposit.toLocaleString()}` : ''}
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-medium uppercase text-[10px]">Lease Term</div>
            <div className="font-bold text-slate-900 mt-0.5">
              {property.rental_start_date ? `${property.rental_start_date} to ${property.expected_end_date || 'Ongoing'}` : 'Not Specified'}
            </div>
          </div>
        </div>

        {property.notes && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
            <strong className="text-slate-900">Property Notes: </strong>
            {property.notes}
          </div>
        )}
      </div>

      {/* Main Detail Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Room & Area Architecture */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-500" />
                  Rooms & Inspection Areas ({rooms.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Custom checklist spaces configured for room-by-room condition audits
                </p>
              </div>

              <button
                onClick={openAddRoom}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors border border-slate-200"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" /> Add Room / Area
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                No rooms configured for this property. Add custom rooms to begin audits.
              </div>
            ) : (
              <div className="space-y-2">
                {rooms.map((room, idx) => (
                  <div
                    key={room.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={idx === 0}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{idx + 1}</span>
                        <button
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={idx === rooms.length - 1}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{room.room_name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                            {room.room_type}
                          </span>
                        </div>
                        {room.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{room.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditRoom(room)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title="Edit Room"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id, room.room_name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Remove Room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Damage Register for this property */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" /> Recorded Damages ({damages.length})
                </h2>
                <p className="text-xs text-slate-500">Tracked property defects and estimated costs</p>
              </div>
            </div>

            {damages.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                No damages recorded for this property.
              </div>
            ) : (
              <div className="space-y-2">
                {damages.map((dmg) => (
                  <div
                    key={dmg.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{dmg.damage_code}</span>
                        <span className="font-bold text-slate-900">{dmg.item_name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">
                          {dmg.category}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">{dmg.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={dmg.status} />
                      <div className="text-xs font-bold text-slate-900 mt-1">
                        Est: ${dmg.estimated_cost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Inspection History & Documents */}
        <div className="space-y-4">
          {/* Inspection Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-slate-600" /> Inspection History
            </h2>

            {inspections.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                No inspections on file.
              </div>
            ) : (
              <div className="space-y-2.5">
                {inspections.map((insp) => (
                  <div
                    key={insp.id}
                    onClick={() => onSelectInspection(insp.id)}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{insp.inspection_type}</span>
                      <StatusBadge status={insp.status} />
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {insp.inspection_date}
                    </p>
                    <p className="text-[11px] text-slate-600">Inspector: {insp.inspector_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attached Documents */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FolderLock className="w-4 h-4 text-slate-600" /> Attached Documents ({documents.length})
            </h2>

            {documents.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                No documents attached.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div className="truncate mr-2">
                      <p className="font-semibold text-slate-800 truncate">{doc.file_name}</p>
                      <p className="text-[10px] text-slate-500">{doc.category}</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      Local
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        title={editingRoom ? 'Edit Room / Area' : 'Add Room / Area'}
        subtitle={`Adding space to ${property.name}`}
      >
        <form onSubmit={handleSaveRoom} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Room or Area Name *</label>
            <input
              type="text"
              required
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Master Bedroom, Sunroom, Kitchenette..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Room Category *</label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as RoomCategory)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="Living Room">Living Room</option>
              <option value="Bedroom">Bedroom</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Bathroom">Bathroom</option>
              <option value="Balcony">Balcony</option>
              <option value="Hallway">Hallway</option>
              <option value="Storage">Storage</option>
              <option value="Parking">Parking</option>
              <option value="Exterior">Exterior</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description / Location Notes</label>
            <textarea
              rows={2}
              value={roomDesc}
              onChange={(e) => setRoomDesc(e.target.value)}
              placeholder="e.g. Ground floor west wing, includes sliding patio door..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsRoomModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              {editingRoom ? 'Update Room' : 'Add Room'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
