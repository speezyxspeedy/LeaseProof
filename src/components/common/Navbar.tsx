import React, { useState } from 'react';
import { Search, Plus, Bell, Shield, Sparkles, Building2 } from 'lucide-react';
import { Property, Inspection } from '../../types';

interface NavbarProps {
  onQuickInspection: () => void;
  onOpenSettings: () => void;
  onSelectProperty: (propertyId: string) => void;
  onSelectInspection: (inspectionId: string) => void;
  properties: Property[];
  inspections: Inspection[];
  openDamagesCount: number;
  pendingRepairsCount: number;
  hasDemoData: boolean;
  onLoadDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onQuickInspection,
  onOpenSettings,
  onSelectProperty,
  onSelectInspection,
  properties,
  inspections,
  openDamagesCount,
  pendingRepairsCount,
  hasDemoData,
  onLoadDemo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const filteredProperties = searchQuery.trim()
    ? properties.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.property_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.tenant_name && p.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const filteredInspections = searchQuery.trim()
    ? inspections.filter(
        (i) =>
          i.inspector_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.inspection_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const totalNotifications = openDamagesCount + pendingRepairsCount;

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between gap-4 no-print">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
          <Shield className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-slate-900">LeaseProof</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              v1.0 Local
            </span>
            {hasDemoData && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Demo Mode
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block leading-none mt-0.5 font-medium">
            Document Every Detail. Protect Every Handover.
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="relative flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            placeholder="Search properties, codes, inspectors, tenants..."
            className="w-full text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-slate-400 focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-40 max-h-80 overflow-y-auto">
            <div className="p-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Search results for "{searchQuery}"</span>
              <button
                onClick={() => setShowSearchResults(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold"
              >
                Close
              </button>
            </div>

            {filteredProperties.length === 0 && filteredInspections.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center">No matching records found.</div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredProperties.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Properties</div>
                    {filteredProperties.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProperty(p.id);
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{p.name}</p>
                            <p className="text-[11px] text-slate-500">{p.address}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {p.property_code}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {filteredInspections.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Inspections</div>
                    {filteredInspections.slice(0, 3).map((i) => (
                      <button
                        key={i.id}
                        onClick={() => {
                          onSelectInspection(i.id);
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {i.inspection_type} — {i.inspection_date}
                          </p>
                          <p className="text-[11px] text-slate-500">Inspector: {i.inspector_name}</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          {i.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {!hasDemoData && properties.length === 0 && (
          <button
            onClick={onLoadDemo}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            title="Load 3 sample properties with move-in/out records"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Demo Workspace</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {totalNotifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                {totalNotifications}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 text-xs">
              <div className="font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
                <span>Handover Alerts</span>
                <span className="text-[10px] text-slate-500">{totalNotifications} active</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded bg-rose-50 border border-rose-100 text-rose-900 flex justify-between items-center">
                  <span>Open Damage Reports</span>
                  <span className="font-bold text-rose-700">{openDamagesCount}</span>
                </div>
                <div className="p-2 rounded bg-amber-50 border border-amber-100 text-amber-900 flex justify-between items-center">
                  <span>Pending Maintenance</span>
                  <span className="font-bold text-amber-700">{pendingRepairsCount}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNotifications(false);
                  onOpenSettings();
                }}
                className="w-full mt-2 text-center text-[11px] text-slate-500 hover:text-slate-800 pt-1 border-t border-slate-100 block font-medium"
              >
                Workspace Settings & Backup
              </button>
            </div>
          )}
        </div>

        {/* Quick Inspection CTA */}
        <button
          onClick={onQuickInspection}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Start Inspection</span>
          <span className="sm:hidden">Inspect</span>
        </button>
      </div>
    </header>
  );
};
