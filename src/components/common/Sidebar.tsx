import React from 'react';
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  LogIn,
  LogOut,
  GitCompare,
  AlertTriangle,
  FileText,
  FolderLock,
  History,
  Settings,
  Wrench,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'properties'
  | 'inspections'
  | 'move-in'
  | 'move-out'
  | 'comparison'
  | 'damages'
  | 'repairs'
  | 'handover-reports'
  | 'documents'
  | 'activity'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  propertiesCount: number;
  inspectionsCount: number;
  openDamagesCount: number;
  pendingRepairsCount: number;
  documentsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  propertiesCount,
  inspectionsCount,
  openDamagesCount,
  pendingRepairsCount,
  documentsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'properties' as NavTab,
      label: 'Properties',
      icon: Building2,
      badge: propertiesCount > 0 ? propertiesCount : null,
    },
    {
      id: 'inspections' as NavTab,
      label: 'All Inspections',
      icon: ClipboardCheck,
      badge: inspectionsCount > 0 ? inspectionsCount : null,
    },
    {
      id: 'move-in' as NavTab,
      label: 'Move-In Reports',
      icon: LogIn,
      badge: null,
    },
    {
      id: 'move-out' as NavTab,
      label: 'Move-Out Reports',
      icon: LogOut,
      badge: null,
    },
    {
      id: 'comparison' as NavTab,
      label: 'Condition Comparison',
      icon: GitCompare,
      badge: 'Diff',
    },
    {
      id: 'damages' as NavTab,
      label: 'Damage Register',
      icon: AlertTriangle,
      badge: openDamagesCount > 0 ? openDamagesCount : null,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'repairs' as NavTab,
      label: 'Maintenance & Repairs',
      icon: Wrench,
      badge: pendingRepairsCount > 0 ? pendingRepairsCount : null,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'handover-reports' as NavTab,
      label: 'Handover Reports',
      icon: FileText,
      badge: null,
    },
    {
      id: 'documents' as NavTab,
      label: 'Documents',
      icon: FolderLock,
      badge: documentsCount > 0 ? documentsCount : null,
    },
    {
      id: 'activity' as NavTab,
      label: 'Activity History',
      icon: History,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings & Backup',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none no-print">
      {/* Workspace Brand / Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Local Vault Active</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">100% Client-Side</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1.5">
          Workspace Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500">
        <p className="font-semibold text-slate-400">LeaseProof Platform</p>
        <p className="text-[10px] mt-0.5 text-slate-500">IndexedDB Blob Storage</p>
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
          <span>Privacy Hardened</span>
          <span className="text-emerald-400">● Encrypted Local</span>
        </div>
      </div>
    </aside>
  );
};
