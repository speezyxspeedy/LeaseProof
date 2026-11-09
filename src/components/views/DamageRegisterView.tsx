import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  DollarSign,
  Building2,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  Camera,
} from 'lucide-react';
import { DamageRecord, Property, DamageSeverity, DamageStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { dbService } from '../../services/db';

interface DamageRegisterViewProps {
  damages: DamageRecord[];
  properties: Property[];
  onRefreshDamages: () => Promise<void>;
  onSelectProperty: (propertyId: string) => void;
}

export const DamageRegisterView: React.FC<DamageRegisterViewProps> = ({
  damages,
  properties,
  onRefreshDamages,
  onSelectProperty,
}) => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDamage, setEditingDamage] = useState<DamageRecord | null>(null);

  // Form State
  const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Flooring');
  const [severity, setSeverity] = useState<DamageSeverity>('Moderate');
  const [status, setStatus] = useState<DamageStatus>('OPEN');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | ''>(150);
  const [actualCost, setActualCost] = useState<number | ''>('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const openAddModal = () => {
    setEditingDamage(null);
    setPropertyId(properties[0]?.id || '');
    setItemName('');
    setCategory('Flooring');
    setSeverity('Moderate');
    setStatus('OPEN');
    setDescription('');
    setEstimatedCost(150);
    setActualCost('');
    setResolutionNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (dmg: DamageRecord) => {
    setEditingDamage(dmg);
    setPropertyId(dmg.property_id);
    setItemName(dmg.item_name);
    setCategory(dmg.category);
    setSeverity(dmg.severity);
    setStatus(dmg.status);
    setDescription(dmg.description);
    setEstimatedCost(dmg.estimated_cost);
    setActualCost(dmg.actual_cost || '');
    setResolutionNotes(dmg.resolution_notes || '');
    setIsModalOpen(true);
  };

  const handleSaveDamage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !propertyId || !description.trim()) return;

    const currentYear = new Date().getFullYear();
    const nextCode = `DMG-${currentYear}-${String(damages.length + 1).padStart(3, '0')}`;

    const record: DamageRecord = {
      id: editingDamage ? editingDamage.id : 'dmg_' + Date.now(),
      damage_code: editingDamage ? editingDamage.damage_code : nextCode,
      property_id: propertyId,
      inspection_id: editingDamage ? editingDamage.inspection_id : null,
      room_id: editingDamage ? editingDamage.room_id : null,
      item_name: itemName.trim(),
      category,
      severity,
      description: description.trim(),
      estimated_cost: Number(estimatedCost) || 0,
      actual_cost: actualCost !== '' ? Number(actualCost) : undefined,
      status,
      resolution_notes: resolutionNotes.trim() || undefined,
      created_at: editingDamage ? editingDamage.created_at : new Date().toISOString(),
    };

    await dbService.saveDamage(record);
    await onRefreshDamages();
    setIsModalOpen(false);
  };

  const handleDeleteDamage = async (id: string, code: string) => {
    if (confirm(`Delete damage record ${code}?`)) {
      await dbService.deleteDamage(id);
      await onRefreshDamages();
    }
  };

  const filtered = damages.filter((d) => {
    const prop = properties.find((p) => p.id === d.property_id);
    const matchSearch =
      d.item_name.toLowerCase().includes(search.toLowerCase()) ||
      d.damage_code.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      (prop && prop.name.toLowerCase().includes(search.toLowerCase()));

    const matchSeverity = severityFilter === 'ALL' || d.severity === severityFilter;
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchSearch && matchSeverity && matchStatus;
  });

  const totalEstimated = damages.reduce((sum, d) => sum + (d.estimated_cost || 0), 0);
  const openCount = damages.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Damage Register</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
              {openCount} Open Defect{openCount === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track observed property damages, severity classifications, and repair cost estimations.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Record New Damage</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search damage by code (DMG-...), item name, description..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-slate-600 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Severity:</span>
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="Minor">Minor</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
            <option value="Critical">Critical</option>
          </select>

          <span className="text-slate-300">|</span>

          <span className="text-slate-600 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="REPAIR_SCHEDULED">Repair Scheduled</option>
            <option value="REPAIRED">Repaired</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Damages Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No damage records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Log damage from during an inspection audit or record items directly.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" /> Record Damage
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Damaged Item</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Estimated Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((dmg) => {
                  const prop = properties.find((p) => p.id === dmg.property_id);
                  return (
                    <tr key={dmg.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {dmg.damage_code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{dmg.item_name}</div>
                        <div className="text-[11px] text-slate-500 max-w-xs truncate">{dmg.description}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {prop ? (
                          <button
                            onClick={() => onSelectProperty(prop.id)}
                            className="font-medium hover:underline text-slate-900"
                          >
                            {prop.name}
                          </button>
                        ) : (
                          'Unknown'
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{dmg.category}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            dmg.severity === 'Critical' || dmg.severity === 'Severe'
                              ? 'bg-rose-100 text-rose-800'
                              : dmg.severity === 'Moderate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {dmg.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ${dmg.estimated_cost.toLocaleString()}
                        {dmg.actual_cost ? (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Actual: ${dmg.actual_cost.toLocaleString()}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={dmg.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(dmg)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Edit / Update Status"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDamage(dmg.id, dmg.damage_code)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Damage Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDamage ? `Update ${editingDamage.damage_code}` : 'Log New Property Damage'}
        subtitle="Maintains full traceability and estimated restoration expenditures."
      >
        <form onSubmit={handleSaveDamage} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Target Property *</label>
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.property_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Damaged Item Name *</label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Master Bedroom Door Latch"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              >
                <option value="Structural">Structural</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Furniture">Furniture</option>
                <option value="Appliance">Appliance</option>
                <option value="Flooring">Flooring</option>
                <option value="Wall & Paint">Wall & Paint</option>
                <option value="Fixtures">Fixtures</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Severity *</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as DamageSeverity)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              >
                <option value="Minor">Minor (Cosmetic scuff / light wear)</option>
                <option value="Moderate">Moderate (Requires spot repair)</option>
                <option value="Severe">Severe (Component replacement needed)</option>
                <option value="Critical">Critical (Immediate safety / water leak)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Workflow Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DamageStatus)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              >
                <option value="OPEN">OPEN</option>
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="REPAIR_SCHEDULED">REPAIR SCHEDULED</option>
                <option value="REPAIRED">REPAIRED</option>
                <option value="ACCEPTED">ACCEPTED (Normal Wear & Tear)</option>
                <option value="DISPUTED">DISPUTED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Estimated Repair Cost ($) *</label>
              <input
                type="number"
                min="0"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Actual Invoice Cost ($)</label>
              <input
                type="number"
                min="0"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Optional until billed"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Damage Description *</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe location, dimensions of crack/stain, likely cause..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Resolution / Contractor Notes</label>
            <input
              type="text"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Quoted by Apex Handyman; parts ordered on May 2nd..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              {editingDamage ? 'Update Damage Record' : 'Record Damage'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
