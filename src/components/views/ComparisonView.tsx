import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  ArrowRight,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  DollarSign,
  Maximize2,
  Printer,
} from 'lucide-react';
import {
  Inspection,
  Property,
  Room,
  InspectionItem,
  PhotoRecord,
  ItemComparisonResult,
  ComparisonDiffCategory,
} from '../../types';
import { dbService } from '../../services/db';
import { buildComparison } from '../../services/comparison';
import { StatusBadge } from '../common/StatusBadge';
import { PhotoViewerModal } from '../common/PhotoViewerModal';

interface ComparisonViewProps {
  properties: Property[];
  inspections: Inspection[];
  initialMoveOutId?: string;
  onNavigateToReport: (inspectionId: string) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  properties,
  inspections,
  initialMoveOutId,
  onNavigateToReport,
}) => {
  const moveOuts = inspections.filter((i) => i.inspection_type === 'MOVE-OUT');
  const moveIns = inspections.filter((i) => i.inspection_type === 'MOVE-IN');

  const [selectedMoveOutId, setSelectedMoveOutId] = useState<string>(
    initialMoveOutId || moveOuts[0]?.id || ''
  );

  const currentMoveOut = inspections.find((i) => i.id === selectedMoveOutId);
  const [selectedMoveInId, setSelectedMoveInId] = useState<string>(
    currentMoveOut?.parent_inspection_id || moveIns.find((m) => m.property_id === currentMoveOut?.property_id)?.id || ''
  );

  const [comparisonResults, setComparisonResults] = useState<ItemComparisonResult[]>([]);
  const [filterDiff, setFilterDiff] = useState<string>('ALL');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL');
  const [activePhoto, setActivePhoto] = useState<PhotoRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // When move-out changes, automatically select its parent move-in if set
  useEffect(() => {
    if (currentMoveOut) {
      if (currentMoveOut.parent_inspection_id) {
        setSelectedMoveInId(currentMoveOut.parent_inspection_id);
      } else {
        const matchingMoveIn = moveIns.find((m) => m.property_id === currentMoveOut.property_id);
        if (matchingMoveIn) {
          setSelectedMoveInId(matchingMoveIn.id);
        }
      }
    }
  }, [selectedMoveOutId]);

  // Load and calculate side-by-side comparison
  useEffect(() => {
    const runComparison = async () => {
      if (!selectedMoveInId || !selectedMoveOutId) {
        setComparisonResults([]);
        return;
      }
      setIsLoading(true);
      const moveIn = inspections.find((i) => i.id === selectedMoveInId);
      const moveOut = inspections.find((i) => i.id === selectedMoveOutId);
      if (!moveIn || !moveOut) {
        setIsLoading(false);
        return;
      }

      const rooms = await dbService.getRoomsByProperty(moveOut.property_id);
      const miItems = await dbService.getInspectionItems(moveIn.id);
      const moItems = await dbService.getInspectionItems(moveOut.id);
      const miPhotos = await dbService.getPhotos(moveIn.property_id, moveIn.id);
      const moPhotos = await dbService.getPhotos(moveOut.property_id, moveOut.id);

      const diffs = buildComparison(moveIn, moveOut, rooms, miItems, moItems, miPhotos, moPhotos);
      setComparisonResults(diffs);
      setIsLoading(false);
    };

    runComparison();
  }, [selectedMoveInId, selectedMoveOutId]);

  const matchedProperty = properties.find((p) => p.id === currentMoveOut?.property_id);
  const currentMoveIn = inspections.find((i) => i.id === selectedMoveInId);

  // Summary counts
  const summaryCounts = {
    NO_CHANGE: comparisonResults.filter((r) => r.diffCategory === 'NO_CHANGE').length,
    IMPROVED: comparisonResults.filter((r) => r.diffCategory === 'IMPROVED').length,
    CONDITION_DECLINED: comparisonResults.filter((r) => r.diffCategory === 'CONDITION_DECLINED').length,
    NEW_DAMAGE: comparisonResults.filter((r) => r.diffCategory === 'NEW_DAMAGE').length,
    ITEM_MISSING: comparisonResults.filter((r) => r.diffCategory === 'ITEM_MISSING').length,
    REQUIRES_REVIEW: comparisonResults.filter((r) => r.diffCategory === 'REQUIRES_REVIEW').length,
  };

  const totalDiffDamagesCost = comparisonResults.reduce((acc, r) => acc + (r.costDiff || 0), 0);

  // Filtered results
  const uniqueRooms = Array.from(new Set(comparisonResults.map((r) => r.roomName)));
  const filteredResults = comparisonResults.filter((r) => {
    const matchCategory = filterDiff === 'ALL' || r.diffCategory === filterDiff;
    const matchRoom = selectedRoomFilter === 'ALL' || r.roomName === selectedRoomFilter;
    return matchCategory && matchRoom;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Before & After Condition Comparison</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
              Handover Diff Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Side-by-side cross-referencing of Move-In baseline photos and condition ratings against Move-Out findings.
          </p>
        </div>

        {selectedMoveOutId && (
          <button
            onClick={() => onNavigateToReport(selectedMoveOutId)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs shrink-0"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Generate Handover Report</span>
          </button>
        )}
      </div>

      {/* Comparison Pair Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left Side: Move-In Selection */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Baseline: Original Move-In Inspection (Left)
          </label>
          <select
            value={selectedMoveInId}
            onChange={(e) => setSelectedMoveInId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
          >
            <option value="">Choose Move-In Inspection...</option>
            {moveIns.map((mi) => {
              const p = properties.find((pr) => pr.id === mi.property_id);
              return (
                <option key={mi.id} value={mi.id}>
                  {p?.name || 'Property'} &bull; Date: {mi.inspection_date} (Inspector: {mi.inspector_name})
                </option>
              );
            })}
          </select>
          {currentMoveIn && (
            <p className="text-[11px] text-slate-500">
              Recorded by {currentMoveIn.inspector_name} &bull; Tenant: {currentMoveIn.tenant_name || 'N/A'}
            </p>
          )}
        </div>

        {/* Right Side: Move-Out Selection */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Handover: Latest Move-Out Inspection (Right)
          </label>
          <select
            value={selectedMoveOutId}
            onChange={(e) => setSelectedMoveOutId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
          >
            <option value="">Choose Move-Out Inspection...</option>
            {moveOuts.map((mo) => {
              const p = properties.find((pr) => pr.id === mo.property_id);
              return (
                <option key={mo.id} value={mo.id}>
                  {p?.name || 'Property'} &bull; Date: {mo.inspection_date} (Inspector: {mo.inspector_name})
                </option>
              );
            })}
          </select>
          {currentMoveOut && (
            <p className="text-[11px] text-slate-500">
              Recorded by {currentMoveOut.inspector_name} &bull; Tenant: {currentMoveOut.tenant_name || 'N/A'}
            </p>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      {comparisonResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div
            onClick={() => setFilterDiff('NO_CHANGE')}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              filterDiff === 'NO_CHANGE' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`text-[10px] uppercase font-bold ${filterDiff === 'NO_CHANGE' ? 'text-slate-300' : 'text-slate-400'}`}>
              No Change
            </div>
            <div className="text-xl font-extrabold mt-1">{summaryCounts.NO_CHANGE}</div>
          </div>

          <div
            onClick={() => setFilterDiff('IMPROVED')}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              filterDiff === 'IMPROVED' ? 'bg-emerald-900 text-white border-emerald-900' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`text-[10px] uppercase font-bold ${filterDiff === 'IMPROVED' ? 'text-emerald-200' : 'text-slate-400'}`}>
              Improved
            </div>
            <div className={`text-xl font-extrabold mt-1 ${filterDiff === 'IMPROVED' ? 'text-white' : 'text-emerald-700'}`}>
              {summaryCounts.IMPROVED}
            </div>
          </div>

          <div
            onClick={() => setFilterDiff('CONDITION_DECLINED')}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              filterDiff === 'CONDITION_DECLINED' ? 'bg-amber-900 text-white border-amber-900' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`text-[10px] uppercase font-bold ${filterDiff === 'CONDITION_DECLINED' ? 'text-amber-200' : 'text-slate-400'}`}>
              Declined / Wear
            </div>
            <div className={`text-xl font-extrabold mt-1 ${filterDiff === 'CONDITION_DECLINED' ? 'text-white' : 'text-amber-700'}`}>
              {summaryCounts.CONDITION_DECLINED}
            </div>
          </div>

          <div
            onClick={() => setFilterDiff('NEW_DAMAGE')}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              filterDiff === 'NEW_DAMAGE' ? 'bg-rose-900 text-white border-rose-900' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`text-[10px] uppercase font-bold ${filterDiff === 'NEW_DAMAGE' ? 'text-rose-200' : 'text-slate-400'}`}>
              New Damage
            </div>
            <div className={`text-xl font-extrabold mt-1 ${filterDiff === 'NEW_DAMAGE' ? 'text-white' : 'text-rose-700'}`}>
              {summaryCounts.NEW_DAMAGE}
            </div>
          </div>

          <div
            onClick={() => setFilterDiff('ITEM_MISSING')}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              filterDiff === 'ITEM_MISSING' ? 'bg-purple-900 text-white border-purple-900' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`text-[10px] uppercase font-bold ${filterDiff === 'ITEM_MISSING' ? 'text-purple-200' : 'text-slate-400'}`}>
              Missing Items
            </div>
            <div className={`text-xl font-extrabold mt-1 ${filterDiff === 'ITEM_MISSING' ? 'text-white' : 'text-purple-700'}`}>
              {summaryCounts.ITEM_MISSING}
            </div>
          </div>

          <div
            onClick={() => setFilterDiff('ALL')}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              filterDiff === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`text-[10px] uppercase font-bold ${filterDiff === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>
              Est. Total Cost
            </div>
            <div className="text-xl font-extrabold mt-1">${totalDiffDamagesCost.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {comparisonResults.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Filter Diff:</span>
            <select
              value={filterDiff}
              onChange={(e) => setFilterDiff(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800"
            >
              <option value="ALL">All Categories ({comparisonResults.length})</option>
              <option value="NO_CHANGE">No Change</option>
              <option value="IMPROVED">Improved</option>
              <option value="CONDITION_DECLINED">Condition Declined</option>
              <option value="NEW_DAMAGE">New Damage</option>
              <option value="ITEM_MISSING">Item Missing</option>
              <option value="REQUIRES_REVIEW">Requires Review</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Room:</span>
            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800"
            >
              <option value="ALL">All Rooms</option>
              {uniqueRooms.map((rm) => (
                <option key={rm} value={rm}>
                  {rm}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Side-by-Side Detailed Rows */}
      {comparisonResults.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <GitCompare className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">Select inspections to begin side-by-side diff</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Choose a baseline Move-In inspection and a Move-Out inspection above to compare condition ratings, photos, and damages.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResults.map((result, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
            >
              {/* Item Header */}
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{result.itemName}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[10px]">
                    {result.roomName}
                  </span>
                  <span className="text-[10px] text-slate-500">{result.category.replace('_', ' ')}</span>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={result.diffCategory} />
                  {result.costDiff ? (
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Est. Repair: ${result.costDiff.toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Side-by-Side 2 Column Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 text-xs">
                {/* LEFT: Move-In Baseline */}
                <div className="p-4 space-y-3 bg-slate-50/30">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Move-In Baseline
                    </span>
                    {result.beforeItem ? (
                      <StatusBadge status={result.beforeItem.condition} />
                    ) : (
                      <span className="text-slate-400 italic">Not in baseline</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Notes:</span>
                    <p className="text-slate-700 mt-0.5 min-h-[2.5rem]">
                      {result.beforeItem?.notes || <span className="text-slate-400 italic">No notes recorded</span>}
                    </p>
                  </div>

                  {/* Move-In Photos */}
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Evidence Photos:</span>
                    {result.beforePhotos.length === 0 ? (
                      <p className="text-slate-400 italic mt-1 text-[11px]">No move-in photos attached</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {result.beforePhotos.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setActivePhoto(p)}
                            className="relative cursor-pointer rounded border border-slate-200 overflow-hidden group"
                          >
                            <img src={p.image_data} alt={p.file_name} className="w-16 h-16 object-cover" />
                            <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: Move-Out Result */}
                <div className="p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                      Move-Out Observation
                    </span>
                    {result.afterItem ? (
                      <StatusBadge status={result.afterItem.condition} />
                    ) : (
                      <span className="text-slate-400 italic">Not evaluated</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Notes & Observations:</span>
                    <p className="text-slate-800 font-medium mt-0.5 min-h-[2.5rem]">
                      {result.afterItem?.notes || <span className="text-slate-400 italic">No notes recorded</span>}
                    </p>
                  </div>

                  {/* Move-Out Photos */}
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Evidence Photos:</span>
                    {result.afterPhotos.length === 0 ? (
                      <p className="text-slate-400 italic mt-1 text-[11px]">No move-out photos attached</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {result.afterPhotos.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setActivePhoto(p)}
                            className="relative cursor-pointer rounded border border-slate-200 overflow-hidden group"
                          >
                            <img src={p.image_data} alt={p.file_name} className="w-16 h-16 object-cover" />
                            <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Viewer Modal */}
      <PhotoViewerModal photo={activePhoto} onClose={() => setActivePhoto(null)} />
    </div>
  );
};
