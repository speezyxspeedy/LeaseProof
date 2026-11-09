import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building2,
  Trash2,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { RepairRecord, Property, DamageRecord, RepairStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { dbService } from '../../services/db';

interface RepairsViewProps {
  repairs: RepairRecord[];
  properties: Property[];
  damages: DamageRecord[];
  onRefreshRepairs: () => Promise<void>;
  onSelectProperty: (propertyId: string) => void;
}

export const RepairsView: React.FC<RepairsViewProps> = ({
  repairs,
  properties,
  damages,
  onRefreshRepairs,
  onSelectProperty,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairRecord | null>(null);

  // Form state
  const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
  const [damageId, setDamageId] = useState('');
  const [title, setTitle] = useState('');
  const [roomName, setRoomName] = useState('Kitchen');
  const [description, setDescription] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [repairDate, setRepairDate] = useState(new Date().toISOString().substring(0, 10));
  const [estimatedCost, setEstimatedCost] = useState<number | ''>(200);
  const [actualCost, setActualCost] = useState<number | ''>('');
  const [status, setStatus] = useState<RepairStatus>('PENDING');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingRepair(null);
    setPropertyId(properties[0]?.id || '');
    setDamageId('');
    setTitle('');
    setRoomName('Kitchen');
    setDescription('');
    setServiceProvider('');
    setRepairDate(new Date().toISOString().substring(0, 10));
    setEstimatedCost(200);
    setActualCost('');
    setStatus('PENDING');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (rep: RepairRecord) => {
    setEditingRepair(rep);
    setPropertyId(rep.property_id);
    setDamageId(rep.damage_id || '');
    setTitle(rep.title);
    setRoomName(rep.room_name || '');
    setDescription(rep.description);
    setServiceProvider(rep.service_provider || '');
    setRepairDate(rep.repair_date || '');
    setEstimatedCost(rep.estimated_cost);
    setActualCost(rep.actual_cost || '');
    setStatus(rep.status);
    setNotes(rep.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !propertyId || !description.trim()) return;

    const record: RepairRecord = {
      id: editingRepair ? editingRepair.id : 'rep_' + Date.now(),
      property_id: propertyId,
      damage_id: damageId || null,
      title: title.trim(),
      room_name: roomName.trim() || undefined,
      description: description.trim(),
      service_provider: serviceProvider.trim() || undefined,
      repair_date: repairDate || undefined,
      estimated_cost: Number(estimatedCost) || 0,
      actual_cost: Number(actualCost) || 0,
      status,
      notes: notes.trim() || undefined,
      created_at: editingRepair ? editingRepair.created_at : new Date().toISOString(),
    };

    await dbService.saveRepair(record);
    await onRefreshRepairs();
    setIsModalOpen(false);
  };

  const handleDeleteRepair = async (id: string, title: string) => {
    if (confirm(`Remove maintenance order "${title}"?`)) {
      await dbService.deleteRepair(id);
      await onRefreshRepairs();
    }
  };

  const pendingCount = repairs.filter(
    (r) => r.status === 'PENDING' || r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS'
  ).length;
  const completedCount = repairs.filter((r) => r.status === 'COMPLETED').length;
  const totalInvoicedCost = repairs.reduce((acc, r) => acc + (r.actual_cost || 0), 0);

  const filtered = repairs.filter((r) => {
    const prop = properties.find((p) => p.id === r.property_id);
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      (r.service_provider && r.service_provider.toLowerCase().includes(search.toLowerCase())) ||
      (prop && prop.name.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Maintenance & Repairs</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {pendingCount} Pending Work Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track service providers, scheduled work dates, and estimated vs billed expenses.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Pending Tasks</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{pendingCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Scheduled or awaiting contractor</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Completed Repairs</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{completedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Verified restored conditions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Billed Expenditure</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            ${totalInvoicedCost.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all property accounts</p>
        </div>
      </div>

      {/* Search / Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repairs by title, contractor, property..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No maintenance records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Schedule a repair or track ongoing contractor maintenance.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" /> New Work Order
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Work Order Title</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4">Contractor / Provider</th>
                  <th className="py-3 px-4">Target Date</th>
                  <th className="py-3 px-4">Cost (Est / Act)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((rep) => {
                  const prop = properties.find((p) => p.id === rep.property_id);
                  return (
                    <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{rep.title}</div>
                        <div className="text-[11px] text-slate-500 max-w-xs truncate">{rep.description}</div>
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
                      <td className="py-3 px-4 text-slate-600">{rep.room_name || 'General'}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{rep.service_provider || 'Unassigned'}</td>
                      <td className="py-3 px-4 text-slate-600">{rep.repair_date || '—'}</td>
                      <td className="py-3 px-4 font-mono">
                        <div className="text-slate-800 font-semibold">${rep.actual_cost ? rep.actual_cost.toLocaleString() : '—'}</div>
                        <div className="text-[10px] text-slate-400">Est: ${rep.estimated_cost.toLocaleString()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={rep.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(rep)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRepair(rep.id, rep.title)}
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRepair ? 'Update Maintenance Order' : 'Schedule Maintenance Work Order'}
        subtitle="Track contractor invoices and repair completions locally."
      >
        <form onSubmit={handleSaveRepair} className="space-y-3 text-xs">
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

          <div>
            <label className="block font-medium text-slate-700 mb-1">Work Order Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Living Room Window Hinge Replacement"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Room or Area</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Master Bedroom"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Service Provider / Contractor</label>
              <input
                type="text"
                value={serviceProvider}
                onChange={(e) => setServiceProvider(e.target.value)}
                placeholder="e.g. Apex Plumbing Services LLC"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Repair Date</label>
              <input
                type="date"
                value={repairDate}
                onChange={(e) => setRepairDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Estimated Cost ($)</label>
              <input
                type="number"
                min="0"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Actual Invoiced ($)</label>
              <input
                type="number"
                min="0"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RepairStatus)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
            >
              <option value="PENDING">PENDING (Awaiting Approval / Quote)</option>
              <option value="SCHEDULED">SCHEDULED (Date Confirmed)</option>
              <option value="IN_PROGRESS">IN PROGRESS (Work Underway)</option>
              <option value="COMPLETED">COMPLETED (Job Done & Inspected)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Scope Description *</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of repair work required..."
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
              {editingRepair ? 'Save Changes' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
