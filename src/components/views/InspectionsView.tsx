import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  Trash2,
  GitCompare,
  Printer,
  ArrowRight,
} from 'lucide-react';
import { Inspection, Property, InspectionType, InspectionStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { dbService } from '../../services/db';

interface InspectionsViewProps {
  inspections: Inspection[];
  properties: Property[];
  onSelectInspection: (id: string) => void;
  onRefreshInspections: () => Promise<void>;
  onNavigateToReport: (id: string) => void;
  onNavigateToComparison: (id: string) => void;
  defaultTypeFilter?: string;
}

export const InspectionsView: React.FC<InspectionsViewProps> = ({
  inspections,
  properties,
  onSelectInspection,
  onRefreshInspections,
  onNavigateToReport,
  onNavigateToComparison,
  defaultTypeFilter = 'ALL',
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(defaultTypeFilter);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Inspection Form
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '');
  const [inspectionType, setInspectionType] = useState<InspectionType>(
    defaultTypeFilter !== 'ALL' ? (defaultTypeFilter as InspectionType) : 'MOVE-IN'
  );
  const [parentInspectionId, setParentInspectionId] = useState<string>('');
  const [inspectorName, setInspectorName] = useState('Certified Property Inspector');
  const [tenantName, setTenantName] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');

  const propertyMoveIns = inspections.filter(
    (i) => i.property_id === selectedPropertyId && i.inspection_type === 'MOVE-IN'
  );

  const openNewInspectionModal = () => {
    if (properties.length === 0) {
      alert('Please register at least one property before initiating an inspection.');
      return;
    }
    const propId = properties[0]?.id || '';
    setSelectedPropertyId(propId);
    const matchedProp = properties.find((p) => p.id === propId);
    setTenantName(matchedProp?.tenant_name || '');
    setIsModalOpen(true);
  };

  const handlePropertyChange = (propId: string) => {
    setSelectedPropertyId(propId);
    const matchedProp = properties.find((p) => p.id === propId);
    if (matchedProp?.tenant_name) {
      setTenantName(matchedProp.tenant_name);
    }
  };

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId || !inspectorName.trim()) return;

    const newInsp: Inspection = {
      id: 'insp_' + Date.now(),
      property_id: selectedPropertyId,
      inspection_type: inspectionType,
      parent_inspection_id: inspectionType === 'MOVE-OUT' ? (parentInspectionId || null) : null,
      inspector_name: inspectorName.trim(),
      tenant_name: tenantName.trim() || undefined,
      inspection_date: inspectionDate,
      status: 'IN_PROGRESS',
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    await dbService.saveInspection(newInsp);
    await onRefreshInspections();
    setIsModalOpen(false);
    onSelectInspection(newInsp.id);
  };

  const handleDeleteInspection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Permanently delete this inspection record and all its checklist items?')) {
      await dbService.deleteInspection(id);
      await onRefreshInspections();
    }
  };

  const filtered = inspections.filter((i) => {
    const prop = properties.find((p) => p.id === i.property_id);
    const propName = prop?.name || '';
    const propCode = prop?.property_code || '';
    const matchSearch =
      i.inspector_name.toLowerCase().includes(search.toLowerCase()) ||
      i.inspection_type.toLowerCase().includes(search.toLowerCase()) ||
      propName.toLowerCase().includes(search.toLowerCase()) ||
      propCode.toLowerCase().includes(search.toLowerCase()) ||
      (i.tenant_name && i.tenant_name.toLowerCase().includes(search.toLowerCase()));

    const matchType = typeFilter === 'ALL' || i.inspection_type === typeFilter;
    const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {defaultTypeFilter === 'MOVE-IN'
              ? 'Move-In Baseline Records'
              : defaultTypeFilter === 'MOVE-OUT'
              ? 'Move-Out Handover Audits'
              : 'Digital Inspection Archive'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, manage, and verify room-by-room condition audits for handover protection.
          </p>
        </div>

        <button
          onClick={openNewInspectionModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>New Inspection</span>
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
            placeholder="Search inspections by inspector, tenant, property..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-slate-600 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Type:</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="MOVE-IN">Move-In</option>
            <option value="MOVE-OUT">Move-Out</option>
            <option value="ROUTINE">Routine</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          <span className="text-slate-300">|</span>

          <span className="text-slate-600 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="FINALIZED">Finalized</option>
            <option value="AMENDED">Amended</option>
          </select>
        </div>
      </div>

      {/* Inspections Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No inspections found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by creating a new inspection audit for any registered property.
          </p>
          <button
            onClick={openNewInspectionModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" /> Start Inspection
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Inspection Type</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Audit Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((insp) => {
                  const prop = properties.find((p) => p.id === insp.property_id);
                  return (
                    <tr
                      key={insp.id}
                      onClick={() => onSelectInspection(insp.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-800">{insp.inspection_type}</span>
                          {insp.is_demo && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Demo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{prop ? prop.name : 'Unknown'}</span>
                          {prop && (
                            <span className="text-[10px] font-mono text-slate-400">({prop.property_code})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{insp.inspection_date}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{insp.inspector_name}</td>
                      <td className="py-3 px-4 text-slate-600">{insp.tenant_name || '—'}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={insp.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {insp.inspection_type === 'MOVE-OUT' && insp.parent_inspection_id && (
                            <button
                              onClick={() => onNavigateToComparison(insp.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                              title="Compare with Move-In"
                            >
                              <GitCompare className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onNavigateToReport(insp.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Generate Handover Report"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteInspection(insp.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectInspection(insp.id)}
                            className="ml-1 px-2.5 py-1 font-semibold text-xs bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                          >
                            Open
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

      {/* New Inspection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize New Property Inspection"
        subtitle="Configures room checklist structure automatically based on selected property."
      >
        <form onSubmit={handleCreateInspection} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Target Property *</label>
            <select
              required
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.property_code}) &bull; {p.address}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Inspection Type *</label>
              <select
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value as InspectionType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              >
                <option value="MOVE-IN">MOVE-IN (Baseline)</option>
                <option value="MOVE-OUT">MOVE-OUT (Handover)</option>
                <option value="ROUTINE">ROUTINE (Periodic)</option>
                <option value="MAINTENANCE">MAINTENANCE (Repair Check)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Inspection Date *</label>
              <input
                type="date"
                required
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              >
              </input>
            </div>
          </div>

          {/* If Move-Out: option to link parent Move-In inspection for automated side-by-side comparison */}
          {inspectionType === 'MOVE-OUT' && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <label className="block font-medium text-amber-900 mb-1">
                Link Baseline Move-In Inspection (for Before/After diff)
              </label>
              <select
                value={parentInspectionId}
                onChange={(e) => setParentInspectionId(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none"
              >
                <option value="">Select a previous Move-In inspection...</option>
                {propertyMoveIns.map((mi) => (
                  <option key={mi.id} value={mi.id}>
                    Move-In on {mi.inspection_date} (Inspector: {mi.inspector_name})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Inspector Full Name *</label>
              <input
                type="text"
                required
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tenant Name (Optional)</label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">General Audit Notes / Directives</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Full meter readings taken; tenant present; all keys handed over..."
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
              Begin Inspection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
