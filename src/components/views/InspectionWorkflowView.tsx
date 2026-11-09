import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Plus,
  Lock,
  Edit,
  Save,
  Printer,
  ChevronRight,
  GitCompare,
  DollarSign,
  FileSignature,
  Layers,
} from 'lucide-react';
import {
  Inspection,
  Property,
  Room,
  InspectionItem,
  PhotoRecord,
  ConditionRating,
  ItemCategory,
  DamageRecord,
  SignatureRecord,
} from '../../types';
import { generateItemsForRoom } from '../../services/checklistTemplate';
import { dbService } from '../../services/db';
import { StatusBadge } from '../common/StatusBadge';
import { PhotoUploader } from '../common/PhotoUploader';
import { PhotoViewerModal } from '../common/PhotoViewerModal';
import { SignaturePad } from '../common/SignaturePad';
import { Modal } from '../common/Modal';

interface InspectionWorkflowViewProps {
  inspection: Inspection;
  property: Property;
  rooms: Room[];
  onBack: () => void;
  onRefreshData: () => Promise<void>;
  onNavigateToReport: (inspectionId: string) => void;
  onNavigateToComparison: (moveOutInspectionId: string) => void;
}

export const InspectionWorkflowView: React.FC<InspectionWorkflowViewProps> = ({
  inspection,
  property,
  rooms,
  onBack,
  onRefreshData,
  onNavigateToReport,
  onNavigateToComparison,
}) => {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0]?.id || '');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState<PhotoRecord | null>(null);

  // Amendment modal state
  const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState('');
  const [amendmentAuthor, setAmendmentAuthor] = useState('');

  // Custom Item Modal state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>('WALLS_PAINT');

  // Load items, photos, and signatures
  const loadInspectionData = async () => {
    setIsLoading(true);
    let loadedItems = await dbService.getInspectionItems(inspection.id);

    // If items are empty (first time opening this inspection), initialize from room templates!
    if (loadedItems.length === 0 && rooms.length > 0) {
      const allGenItems: InspectionItem[] = [];
      for (const room of rooms) {
        const roomItems = generateItemsForRoom(inspection.id, room.id, room.room_type);
        allGenItems.push(...roomItems);
      }
      await dbService.batchSaveInspectionItems(allGenItems);
      loadedItems = allGenItems;
    }

    const loadedPhotos = await dbService.getPhotos(property.id, inspection.id);
    const loadedSignatures = await dbService.getSignatures(inspection.id);

    setItems(loadedItems);
    setPhotos(loadedPhotos);
    setSignatures(loadedSignatures);
    setIsLoading(false);
  };

  useEffect(() => {
    loadInspectionData();
  }, [inspection.id]);

  // Set active room to first available
  useEffect(() => {
    if (!activeRoomId && rooms.length > 0) {
      setActiveRoomId(rooms[0].id);
    }
  }, [rooms, activeRoomId]);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];
  const activeRoomItems = items.filter((i) => i.room_id === activeRoom?.id);
  const filteredItems = activeCategoryFilter === 'ALL'
    ? activeRoomItems
    : activeRoomItems.filter((i) => i.category === activeCategoryFilter);

  // Status calculation
  const totalItemsCount = items.length;
  const inspectedItemsCount = items.filter((i) => i.condition !== 'NOT_INSPECTED').length;
  const damagedItemsCount = items.filter((i) => i.condition === 'DAMAGED').length;
  const completenessPercent = totalItemsCount > 0 ? Math.round((inspectedItemsCount / totalItemsCount) * 100) : 0;

  // Handle rating change
  const handleRatingChange = async (itemId: string, newRating: ConditionRating) => {
    if (inspection.status === 'FINALIZED') {
      alert('This inspection is FINALIZED. Please create an official amendment to modify records.');
      return;
    }

    const updated = items.map((it) => (it.id === itemId ? { ...it, condition: newRating } : it));
    setItems(updated);
    const item = updated.find((it) => it.id === itemId);
    if (item) {
      await dbService.saveInspectionItem(item);
    }
  };

  // Handle notes change
  const handleNotesChange = async (itemId: string, notes: string) => {
    const updated = items.map((it) => (it.id === itemId ? { ...it, notes } : it));
    setItems(updated);
    const item = updated.find((it) => it.id === itemId);
    if (item) {
      await dbService.saveInspectionItem(item);
    }
  };

  // Handle repair cost change
  const handleCostChange = async (itemId: string, cost: number) => {
    const updated = items.map((it) => (it.id === itemId ? { ...it, estimated_repair_cost: cost } : it));
    setItems(updated);
    const item = updated.find((it) => it.id === itemId);
    if (item) {
      await dbService.saveInspectionItem(item);
    }
  };

  // Create Damage Record from Damaged item
  const handleLogDamage = async (item: InspectionItem) => {
    const existing = await dbService.getDamages(property.id);
    const code = `DMG-LP-${String(existing.length + 1).padStart(3, '0')}`;
    const newDamage: DamageRecord = {
      id: 'dmg_' + Date.now(),
      damage_code: code,
      property_id: property.id,
      inspection_id: inspection.id,
      room_id: item.room_id,
      item_name: item.item_name,
      category: item.category.replace('_', ' '),
      severity: 'Moderate',
      description: item.notes || `Condition observed as DAMAGED during ${inspection.inspection_type} inspection.`,
      estimated_cost: item.estimated_repair_cost || 100,
      status: 'OPEN',
      created_at: new Date().toISOString(),
    };
    await dbService.saveDamage(newDamage);
    alert(`Damage ${code} logged in Damage Register.`);
  };

  // Finalize inspection
  const handleFinalize = async () => {
    if (inspectedItemsCount < totalItemsCount) {
      const confirmIncomplete = confirm(
        `Warning: ${totalItemsCount - inspectedItemsCount} items are still marked NOT INSPECTED. Are you sure you want to finalize this legal record now?`
      );
      if (!confirmIncomplete) return;
    }

    const updatedInspection: Inspection = {
      ...inspection,
      status: 'FINALIZED',
      finalized_at: new Date().toISOString(),
    };
    await dbService.saveInspection(updatedInspection);
    await onRefreshData();
    alert('Inspection finalized. Record is now protected against silent alterations.');
  };

  // Create Amendment for finalized inspection
  const handleSaveAmendment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendmentReason.trim() || !amendmentAuthor.trim()) return;

    const existingAmendments = inspection.amendments || [];
    const newAmendment = {
      timestamp: new Date().toISOString(),
      reason: amendmentReason.trim(),
      author: amendmentAuthor.trim(),
      changes_summary: `Audit updated by ${amendmentAuthor}.`,
    };

    const updatedInspection: Inspection = {
      ...inspection,
      status: 'AMENDED',
      amendments: [...existingAmendments, newAmendment],
    };

    await dbService.saveInspection(updatedInspection);
    await onRefreshData();
    setIsAmendmentModalOpen(false);
    setAmendmentReason('');
    setAmendmentAuthor('');
    alert('Amendment registered in audit trail.');
  };

  // Add Custom Item
  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !activeRoom) return;

    const customItem: InspectionItem = {
      id: `item_${inspection.id}_${activeRoom.id}_${Date.now()}`,
      inspection_id: inspection.id,
      room_id: activeRoom.id,
      item_name: newItemName.trim(),
      category: newItemCategory,
      condition: 'NOT_INSPECTED',
      description: 'Custom added item',
      notes: '',
      estimated_repair_cost: 0,
      created_at: new Date().toISOString(),
    };

    await dbService.saveInspectionItem(customItem);
    setItems((prev) => [...prev, customItem]);
    setIsAddItemModalOpen(false);
    setNewItemName('');
  };

  // Mark all uninspected in active room as GOOD
  const handleQuickMarkRoomGood = async () => {
    if (inspection.status === 'FINALIZED') return;
    const updated = items.map((it) => {
      if (it.room_id === activeRoom?.id && it.condition === 'NOT_INSPECTED') {
        return { ...it, condition: 'GOOD' as ConditionRating };
      }
      return it;
    });
    setItems(updated);
    for (const it of updated.filter((i) => i.room_id === activeRoom?.id)) {
      await dbService.saveInspectionItem(it);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {inspection.inspection_type} Inspection Audit
            </h1>
            <StatusBadge status={inspection.status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Property: <strong className="text-slate-800">{property.name}</strong> ({property.property_code}) &bull; Date: {inspection.inspection_date} &bull; Inspector: {inspection.inspector_name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {inspection.inspection_type === 'MOVE-OUT' && inspection.parent_inspection_id && (
            <button
              onClick={() => onNavigateToComparison(inspection.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5 text-slate-600" />
              <span>Compare Move-In Diff</span>
            </button>
          )}

          <button
            onClick={() => onNavigateToReport(inspection.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Generate Report</span>
          </button>

          {inspection.status === 'IN_PROGRESS' ? (
            <button
              onClick={handleFinalize}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Finalize Inspection</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAmendmentModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-lg transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-purple-700" />
              <span>Register Amendment</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress & Audit Metrics Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
            <span>Audit Completeness</span>
            <span>{completenessPercent}% ({inspectedItemsCount}/{totalItemsCount} items inspected)</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 rounded-full transition-all duration-300"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Damaged Items: <strong className="text-slate-900">{damagedItemsCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Photos: <strong className="text-slate-900">{photos.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-800"></span>
            <span>Sign-offs: <strong className="text-slate-900">{signatures.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Inspection Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Room Navigation Selector */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Rooms & Areas
              </span>
              <span className="text-[11px] text-slate-500 font-medium">{rooms.length} configured</span>
            </div>

            <div className="space-y-1">
              {rooms.map((room) => {
                const rItems = items.filter((i) => i.room_id === room.id);
                const rInspected = rItems.filter((i) => i.condition !== 'NOT_INSPECTED').length;
                const rDamaged = rItems.filter((i) => i.condition === 'DAMAGED').length;
                const isActive = activeRoom?.id === room.id;

                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{room.room_name}</p>
                      <p className={`text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                        {rInspected}/{rItems.length} checked
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {rDamaged > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                          {rDamaged} dmg
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Room Attaching Photo */}
          {activeRoom && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-600" />
                <span>{activeRoom.room_name} Evidence</span>
              </div>
              <PhotoUploader
                propertyId={property.id}
                inspectionId={inspection.id}
                roomId={activeRoom.id}
                defaultCategory={inspection.inspection_type === 'MOVE-IN' ? 'BEFORE' : 'AFTER'}
                onPhotoUploaded={(p) => setPhotos((prev) => [p, ...prev])}
              />
            </div>
          )}

          {/* Signatures Module Accordion */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileSignature className="w-3.5 h-3.5 text-slate-600" />
                <span>Inspection Sign-Off</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500">{signatures.length} recorded</span>
            </div>

            <SignaturePad
              inspectionId={inspection.id}
              existingSignatures={signatures}
              onSaveSignature={async (sig) => {
                await dbService.saveSignature(sig);
                setSignatures((prev) => [...prev, sig]);
              }}
            />
          </div>
        </div>

        {/* Right 3 Cols: Active Room Checklist */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            {/* Room Header & Category Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{activeRoom?.room_name}</h2>
                <p className="text-xs text-slate-500">
                  {activeRoom?.description || `Inspecting all fixtures and elements in ${activeRoom?.room_name}`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {inspection.status !== 'FINALIZED' && (
                  <button
                    onClick={handleQuickMarkRoomGood}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Mark Remaining As Good</span>
                  </button>
                )}

                <button
                  onClick={() => setIsAddItemModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors"
                >
                  <Plus className="w-3 h-3 text-slate-600" />
                  <span>Add Custom Item</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: 'ALL', label: 'All Items' },
                { id: 'WALLS_PAINT', label: 'Walls & Paint' },
                { id: 'FLOORING', label: 'Flooring' },
                { id: 'DOORS_WINDOWS', label: 'Doors & Windows' },
                { id: 'ELECTRICAL', label: 'Electrical' },
                { id: 'FURNITURE_FIXTURES', label: 'Fixtures' },
                { id: 'PLUMBING', label: 'Plumbing' },
                { id: 'APPLIANCES', label: 'Appliances' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    activeCategoryFilter === cat.id
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Checklist Items List */}
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                No inspection items in this category. Click "Add Custom Item" above to expand checklist.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const itemPhotos = photos.filter((p) => p.inspection_item_id === item.id);
                  const isDamaged = item.condition === 'DAMAGED';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isDamaged
                          ? 'border-rose-300 bg-rose-50/30'
                          : item.condition === 'NOT_INSPECTED'
                          ? 'border-slate-200 bg-white'
                          : 'border-slate-200 bg-slate-50/40'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{item.item_name}</h3>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {item.category.replace('_', ' ')}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-500">{item.description}</p>
                          )}
                        </div>

                        {/* Rating Buttons */}
                        <div className="flex flex-wrap items-center gap-1">
                          {(['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED', 'MISSING', 'NOT_APPLICABLE'] as ConditionRating[]).map(
                            (rate) => {
                              const isSelected = item.condition === rate;
                              let btnStyle = 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100';
                              if (isSelected) {
                                if (rate === 'EXCELLENT' || rate === 'GOOD')
                                  btnStyle = 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-2xs';
                                else if (rate === 'FAIR')
                                  btnStyle = 'bg-amber-500 text-white font-bold border-amber-500 shadow-2xs';
                                else if (rate === 'DAMAGED')
                                  btnStyle = 'bg-rose-600 text-white font-bold border-rose-600 shadow-2xs';
                                else if (rate === 'MISSING')
                                  btnStyle = 'bg-purple-600 text-white font-bold border-purple-600 shadow-2xs';
                                else btnStyle = 'bg-slate-800 text-white font-bold border-slate-800 shadow-2xs';
                              }

                              return (
                                <button
                                  key={rate}
                                  type="button"
                                  onClick={() => handleRatingChange(item.id, rate)}
                                  className={`px-2.5 py-1 text-xs rounded border transition-all ${btnStyle}`}
                                >
                                  {rate === 'NOT_APPLICABLE' ? 'N/A' : rate}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* Observations, Cost & Evidence Row */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
                        <div className="md:col-span-6">
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => handleNotesChange(item.id, e.target.value)}
                            placeholder="Inspector notes (e.g. Scratched, hairline hairline crack, freshly oiled)..."
                            className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          />
                        </div>

                        <div className="md:col-span-3 flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium">Est. Cost: $</span>
                          <input
                            type="number"
                            min="0"
                            value={item.estimated_repair_cost || ''}
                            onChange={(e) => handleCostChange(item.id, Number(e.target.value))}
                            placeholder="0"
                            className="w-24 text-xs bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-900 focus:outline-none"
                          />
                          {isDamaged && (
                            <button
                              type="button"
                              onClick={() => handleLogDamage(item)}
                              className="px-2 py-1 text-[11px] font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded border border-rose-300 whitespace-nowrap"
                              title="Register this item in damage module"
                            >
                              Log Damage
                            </button>
                          )}
                        </div>

                        <div className="md:col-span-3 flex items-center justify-end gap-2">
                          <PhotoUploader
                            propertyId={property.id}
                            inspectionId={inspection.id}
                            roomId={item.room_id}
                            inspectionItemId={item.id}
                            defaultCategory={isDamaged ? 'DAMAGE' : inspection.inspection_type === 'MOVE-IN' ? 'BEFORE' : 'AFTER'}
                            onPhotoUploaded={(p) => setPhotos((prev) => [p, ...prev])}
                            compact
                          />
                        </div>
                      </div>

                      {/* Item Attached Photo Thumbnails */}
                      {itemPhotos.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                          {itemPhotos.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => setActivePhoto(p)}
                              className="relative group cursor-pointer border border-slate-200 rounded overflow-hidden"
                            >
                              <img src={p.image_data} alt={p.file_name} className="w-12 h-12 object-cover" />
                              <span className="absolute bottom-0 left-0 right-0 bg-slate-900/80 text-white text-[8px] font-mono text-center">
                                {p.photo_category}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        photo={activePhoto}
        onClose={() => setActivePhoto(null)}
        onDelete={async (id) => {
          await dbService.deletePhoto(id);
          setPhotos((prev) => prev.filter((p) => p.id !== id));
        }}
        roomName={activeRoom?.room_name}
      />

      {/* Add Custom Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Add Custom Item to Checklist"
        subtitle={`Adding element to ${activeRoom?.room_name}`}
      >
        <form onSubmit={handleAddCustomItem} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. Wine Chiller, Dimmer Switch, French Door Latch..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Category *</label>
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as ItemCategory)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="WALLS_PAINT">Walls & Paint</option>
              <option value="FLOORING">Flooring</option>
              <option value="DOORS_WINDOWS">Doors & Windows</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="FURNITURE_FIXTURES">Furniture & Fixtures</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="APPLIANCES">Appliances</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddItemModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              Add Item
            </button>
          </div>
        </form>
      </Modal>

      {/* Amendment Modal for Finalized Audits */}
      <Modal
        isOpen={isAmendmentModalOpen}
        onClose={() => setIsAmendmentModalOpen(false)}
        title="Register Legal Amendment to Finalized Audit"
        subtitle="Finalized audits cannot be silently modified. Record an official addendum."
      >
        <form onSubmit={handleSaveAmendment} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Author Name *</label>
            <input
              type="text"
              required
              value={amendmentAuthor}
              onChange={(e) => setAmendmentAuthor(e.target.value)}
              placeholder="e.g. Lead Property Manager Sarah J."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Reason for Amendment *</label>
            <textarea
              required
              rows={3}
              value={amendmentReason}
              onChange={(e) => setAmendmentReason(e.target.value)}
              placeholder="e.g. Corrected kitchen tile assessment after tenant provided contractor invoice showing pre-existing settlement crack..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAmendmentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-purple-900 hover:bg-purple-800 rounded-lg"
            >
              Record Amendment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
