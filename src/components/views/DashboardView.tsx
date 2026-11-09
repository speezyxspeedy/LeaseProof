import React from 'react';
import {
  Building2,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  DollarSign,
  Plus,
  GitCompare,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Property, Inspection, DamageRecord, RepairRecord, InspectionItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface DashboardViewProps {
  properties: Property[];
  inspections: Inspection[];
  damages: DamageRecord[];
  repairs: RepairRecord[];
  allItems: InspectionItem[];
  onNavigate: (tab: any) => void;
  onSelectProperty: (id: string) => void;
  onSelectInspection: (id: string) => void;
  onNewProperty: () => void;
  onNewInspection: (type?: any) => void;
  onLoadDemo: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  properties,
  inspections,
  damages,
  repairs,
  allItems,
  onNavigate,
  onSelectProperty,
  onSelectInspection,
  onNewProperty,
  onNewInspection,
  onLoadDemo,
}) => {
  const moveInCount = inspections.filter((i) => i.inspection_type === 'MOVE-IN').length;
  const moveOutCount = inspections.filter((i) => i.inspection_type === 'MOVE-OUT').length;
  const openDamages = damages.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW');
  const pendingRepairs = repairs.filter((r) => r.status === 'PENDING' || r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS');
  const finalizedCount = inspections.filter((i) => i.status === 'FINALIZED').length;

  const totalEstimatedDamageCost = damages.reduce((sum, d) => sum + (d.estimated_cost || 0), 0);
  const totalActualRepairCost = repairs.reduce((sum, r) => sum + (r.actual_cost || 0), 0);

  // Condition distribution
  const conditionCounts = {
    EXCELLENT: allItems.filter((i) => i.condition === 'EXCELLENT').length,
    GOOD: allItems.filter((i) => i.condition === 'GOOD').length,
    FAIR: allItems.filter((i) => i.condition === 'FAIR').length,
    DAMAGED: allItems.filter((i) => i.condition === 'DAMAGED').length,
    MISSING: allItems.filter((i) => i.condition === 'MISSING').length,
    NOT_INSPECTED: allItems.filter((i) => i.condition === 'NOT_INSPECTED').length,
  };
  const totalInspectedItems = allItems.length || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inspection Operations Dashboard</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Live Vault Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time oversight of rental handovers, room-by-room condition audits, and repair tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {properties.length === 0 && (
            <button
              onClick={onLoadDemo}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Load Demo Data</span>
            </button>
          )}

          <button
            onClick={onNewProperty}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Property</span>
          </button>

          <button
            onClick={() => onNewInspection('MOVE-IN')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Start Move-In</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Properties */}
        <div
          onClick={() => onNavigate('properties')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Registered Properties</span>
            <Building2 className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{properties.length}</span>
            <span className="text-[11px] text-slate-500">units</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>View inventory</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-slate-700" />
          </div>
        </div>

        {/* Card 2: Inspections */}
        <div
          onClick={() => onNavigate('inspections')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Inspections</span>
            <ClipboardCheck className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{inspections.length}</span>
            <span className="text-[11px] text-slate-500">
              ({finalizedCount} finalized)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>
              {moveInCount} In / {moveOutCount} Out
            </span>
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-slate-700" />
          </div>
        </div>

        {/* Card 3: Open Damages */}
        <div
          onClick={() => onNavigate('damages')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Open Damage Reports</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-700">{openDamages.length}</span>
            <span className="text-[11px] text-slate-500">of {damages.length} total</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-600 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Est. ${totalEstimatedDamageCost.toLocaleString()}</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Card 4: Repairs */}
        <div
          onClick={() => onNavigate('repairs')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Maintenance</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-700">{pendingRepairs.length}</span>
            <span className="text-[11px] text-slate-500">tasks</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Spent: ${totalActualRepairCost.toLocaleString()}</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Middle Grid: Condition Health & Quick Navigation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Condition Distribution & Breakdown */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Overall Item Condition Distribution</h2>
              <p className="text-xs text-slate-500">
                Aggregated condition ratings across all recorded rooms and items ({allItems.length} data points)
              </p>
            </div>
            <button
              onClick={() => onNavigate('comparison')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded"
            >
              <GitCompare className="w-3.5 h-3.5 text-slate-500" /> Compare Handover
            </button>
          </div>

          {/* Condition Stack Bar */}
          <div className="h-4 w-full bg-slate-100 rounded-md overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${(conditionCounts.EXCELLENT / totalInspectedItems) * 100}%` }}
              className="bg-emerald-600 transition-all duration-300"
              title={`Excellent: ${conditionCounts.EXCELLENT}`}
            />
            <div
              style={{ width: `${(conditionCounts.GOOD / totalInspectedItems) * 100}%` }}
              className="bg-emerald-400 transition-all duration-300"
              title={`Good: ${conditionCounts.GOOD}`}
            />
            <div
              style={{ width: `${(conditionCounts.FAIR / totalInspectedItems) * 100}%` }}
              className="bg-amber-400 transition-all duration-300"
              title={`Fair: ${conditionCounts.FAIR}`}
            />
            <div
              style={{ width: `${(conditionCounts.DAMAGED / totalInspectedItems) * 100}%` }}
              className="bg-rose-500 transition-all duration-300"
              title={`Damaged: ${conditionCounts.DAMAGED}`}
            />
            <div
              style={{ width: `${(conditionCounts.MISSING / totalInspectedItems) * 100}%` }}
              className="bg-purple-500 transition-all duration-300"
              title={`Missing: ${conditionCounts.MISSING}`}
            />
            <div
              style={{ width: `${(conditionCounts.NOT_INSPECTED / totalInspectedItems) * 100}%` }}
              className="bg-slate-300 transition-all duration-300"
              title={`Not Inspected: ${conditionCounts.NOT_INSPECTED}`}
            />
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Excellent
              </span>
              <span className="text-xs font-bold text-slate-900">{conditionCounts.EXCELLENT}</span>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Good
              </span>
              <span className="text-xs font-bold text-slate-900">{conditionCounts.GOOD}</span>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Fair / Wear
              </span>
              <span className="text-xs font-bold text-slate-900">{conditionCounts.FAIR}</span>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Damaged
              </span>
              <span className="text-xs font-bold text-rose-700">{conditionCounts.DAMAGED}</span>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Missing
              </span>
              <span className="text-xs font-bold text-purple-700">{conditionCounts.MISSING}</span>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Uninspected
              </span>
              <span className="text-xs font-bold text-slate-600">{conditionCounts.NOT_INSPECTED}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Handover Protocol Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Standard Handover Protocol</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              LeaseProof enforces objective photographic evidence. Follow the 4-phase verification cycle:
            </p>

            <ol className="mt-4 space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                  1
                </span>
                <span>
                  <strong>Move-In Baseline:</strong> Inspect every room, rate fixtures, and snap condition evidence.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                  2
                </span>
                <span>
                  <strong>Routine Audits:</strong> Document midterm maintenance and appliance upkeep.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                  3
                </span>
                <span>
                  <strong>Move-Out Audit:</strong> Evaluate same structure against baseline without auto-faulting.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                  4
                </span>
                <span>
                  <strong>Diff & Handover:</strong> Generate side-by-side comparison & capture local sign-offs.
                </span>
              </li>
            </ol>
          </div>

          <button
            onClick={() => onNavigate('handover-reports')}
            className="w-full text-center py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors border border-slate-200"
          >
            Access Handover Reports Archive →
          </button>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Inspection Records</h2>
            <p className="text-xs text-slate-500">Directly persisted locally in your browser IndexedDB vault</p>
          </div>
          <button
            onClick={() => onNavigate('inspections')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            View all ({inspections.length}) →
          </button>
        </div>

        {inspections.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
            No inspections logged yet. Click "Start Move-In" or "Load Demo Workspace".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Property</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Inspector</th>
                  <th className="py-2.5 px-3">Tenant</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspections.slice(0, 5).map((insp) => {
                  const prop = properties.find((p) => p.id === insp.property_id);
                  return (
                    <tr key={insp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <span className="font-mono text-slate-700">{insp.inspection_type}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {prop ? (
                          <button
                            onClick={() => onSelectProperty(prop.id)}
                            className="font-medium hover:underline text-slate-900"
                          >
                            {prop.name}
                          </button>
                        ) : (
                          <span className="text-slate-400">Unlinked</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{insp.inspection_date}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{insp.inspector_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{insp.tenant_name || '—'}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={insp.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onSelectInspection(insp.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors"
                        >
                          Open Audit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
