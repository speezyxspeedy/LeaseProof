import React, { useState } from 'react';
import { History, Search, Filter, ShieldCheck, Clock, Building2 } from 'lucide-react';
import { ActivityLog, Property } from '../../types';

interface ActivityHistoryViewProps {
  logs: ActivityLog[];
  properties: Property[];
  onSelectProperty: (propertyId: string) => void;
}

export const ActivityHistoryView: React.FC<ActivityHistoryViewProps> = ({
  logs,
  properties,
  onSelectProperty,
}) => {
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('ALL');

  const filtered = logs.filter((l) => {
    const matchSearch =
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.event_type.toLowerCase().includes(search.toLowerCase());
    const matchEvent = eventFilter === 'ALL' || l.event_type === eventFilter;
    return matchSearch && matchEvent;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Trail & Activity Log</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
              Immutable Log
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident record of property registrations, finalized inspection locks, photo exhibits, and amendments.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Local Chain Active</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail entries by keyword..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Event Type:</span>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Events ({logs.length})</option>
            <option value="PROPERTY_SAVED">Property Saved</option>
            <option value="INSPECTION_SAVED">Inspection Saved</option>
            <option value="PHOTO_ATTACHED">Photo Attached</option>
            <option value="DAMAGE_RECORDED">Damage Recorded</option>
            <option value="REPAIR_UPDATED">Repair Updated</option>
            <option value="SIGNATURE_RECORDED">Signature Recorded</option>
            <option value="BACKUP_RESTORED">Backup Restored</option>
          </select>
        </div>
      </div>

      {/* Log Feed */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No activity events found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Audit logs are generated automatically as properties are inspected or modified.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filtered.map((log) => {
              const prop = properties.find((p) => p.id === log.property_id);
              return (
                <div key={log.id} className="relative group text-xs">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-900 ring-4 ring-white" />

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {log.event_type}
                      </span>
                      {prop && (
                        <button
                          onClick={() => onSelectProperty(prop.id)}
                          className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:underline"
                        >
                          {prop.name}
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {log.timestamp.replace('T', ' ').substring(0, 19)} UTC
                    </span>
                  </div>

                  <p className="text-slate-800 font-medium mt-1">{log.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
