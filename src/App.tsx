/**
 * LeaseProof — Property Inspection & Handover Documentation Platform
 * Tagline: Document Every Detail. Protect Every Handover.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Property,
  Inspection,
  Room,
  InspectionItem,
  DamageRecord,
  RepairRecord,
  DocumentRecord,
  ActivityLog,
  AppSettings,
  InspectionType,
} from './types';
import { dbService } from './services/db';
import { seedDemoData } from './services/demoData';

// Common Components
import { Navbar } from './components/common/Navbar';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { Modal } from './components/common/Modal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { PropertiesView } from './components/views/PropertiesView';
import { PropertyDetailView } from './components/views/PropertyDetailView';
import { InspectionsView } from './components/views/InspectionsView';
import { InspectionWorkflowView } from './components/views/InspectionWorkflowView';
import { ComparisonView } from './components/views/ComparisonView';
import { DamageRegisterView } from './components/views/DamageRegisterView';
import { RepairsView } from './components/views/RepairsView';
import { HandoverReportView } from './components/views/HandoverReportView';
import { DocumentsView } from './components/views/DocumentsView';
import { ActivityHistoryView } from './components/views/ActivityHistoryView';
import { SettingsView } from './components/views/SettingsView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [compareMoveOutId, setCompareMoveOutId] = useState<string | undefined>(undefined);

  // Database Records State
  const [properties, setProperties] = useState<Property[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allItems, setAllItems] = useState<InspectionItem[]>([]);
  const [damages, setDamages] = useState<DamageRecord[]>([]);
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Inspection Modal State
  const [isQuickInspectionModalOpen, setIsQuickInspectionModalOpen] = useState(false);
  const [quickPropId, setQuickPropId] = useState('');
  const [quickType, setQuickType] = useState<InspectionType>('MOVE-IN');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().substring(0, 10));
  const [quickInspector, setQuickInspector] = useState('Certified Property Inspector');
  const [quickTenant, setQuickTenant] = useState('');

  // Refresh all state from IndexedDB
  const refreshAllData = useCallback(async () => {
    try {
      const [
        loadedProps,
        loadedInspections,
        loadedDamages,
        loadedRepairs,
        loadedDocs,
        loadedLogs,
        loadedSettings,
      ] = await Promise.all([
        dbService.getProperties(),
        dbService.getInspections(),
        dbService.getDamages(),
        dbService.getRepairs(),
        dbService.getDocuments(),
        dbService.getActivityLogs(),
        dbService.getSettings(),
      ]);

      setProperties(loadedProps);
      setInspections(loadedInspections);
      setDamages(loadedDamages);
      setRepairs(loadedRepairs);
      setDocuments(loadedDocs);
      setActivityLogs(loadedLogs);
      setSettings(loadedSettings);

      // Collect all inspection items across all inspections for analytics
      const itemsCollector: InspectionItem[] = [];
      for (const insp of loadedInspections) {
        const inspItems = await dbService.getInspectionItems(insp.id);
        itemsCollector.push(...inspItems);
      }
      setAllItems(itemsCollector);

      // If a property is selected, refresh its specific rooms
      if (selectedPropertyId) {
        const propRooms = await dbService.getRoomsByProperty(selectedPropertyId);
        setRooms(propRooms);
      }
    } catch (err) {
      console.error('Failed to load IndexedDB data', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPropertyId]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      // Check if DB is completely empty; if so, seed demo data automatically so user starts with a rich experience
      const props = await dbService.getProperties();
      if (props.length === 0) {
        await seedDemoData();
      }
      await refreshAllData();
    };
    init();
  }, [refreshAllData]);

  // When selectedPropertyId changes, update rooms
  useEffect(() => {
    if (selectedPropertyId) {
      dbService.getRoomsByProperty(selectedPropertyId).then(setRooms);
    }
  }, [selectedPropertyId]);

  // Navigation handlers
  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    setSelectedPropertyId(null);
    setSelectedInspectionId(null);
    setSelectedReportId(null);
  };

  const handleSelectProperty = (id: string) => {
    setSelectedPropertyId(id);
    setSelectedInspectionId(null);
    setSelectedReportId(null);
  };

  const handleSelectInspection = (id: string) => {
    setSelectedInspectionId(id);
    setSelectedPropertyId(null);
    setSelectedReportId(null);
  };

  const handleNavigateToReport = (inspectionId: string) => {
    setSelectedReportId(inspectionId);
    setSelectedInspectionId(null);
    setSelectedPropertyId(null);
    setCurrentTab('handover-reports');
  };

  const handleNavigateToComparison = (moveOutId: string) => {
    setCompareMoveOutId(moveOutId);
    setSelectedInspectionId(null);
    setSelectedPropertyId(null);
    setCurrentTab('comparison');
  };

  // Quick Inspection Submission
  const handleQuickInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPropId) {
      alert('Please select a property');
      return;
    }

    const newInsp: Inspection = {
      id: 'insp_' + Date.now(),
      property_id: quickPropId,
      inspection_type: quickType,
      inspector_name: quickInspector.trim() || 'Inspector',
      tenant_name: quickTenant.trim() || undefined,
      inspection_date: quickDate,
      status: 'IN_PROGRESS',
      created_at: new Date().toISOString(),
    };

    await dbService.saveInspection(newInsp);
    await refreshAllData();
    setIsQuickInspectionModalOpen(false);
    handleSelectInspection(newInsp.id);
  };

  // Open Quick Inspection Dialog
  const handleOpenQuickInspection = (type: InspectionType = 'MOVE-IN') => {
    if (properties.length === 0) {
      alert('Please register at least one property first.');
      return;
    }
    setQuickPropId(properties[0].id);
    setQuickType(type);
    setQuickTenant(properties[0].tenant_name || '');
    setIsQuickInspectionModalOpen(true);
  };

  const hasDemoData = properties.some((p) => p.is_demo);
  const openDamagesCount = damages.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length;
  const pendingRepairsCount = repairs.filter(
    (r) => r.status === 'PENDING' || r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS'
  ).length;

  if (isLoading || !settings) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 space-y-3 font-sans">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Initializing Local Vault...
        </p>
      </div>
    );
  }

  // Current Property & Inspection Lookups
  const activeProperty = properties.find((p) => p.id === selectedPropertyId);
  const activeInspection = inspections.find((i) => i.id === selectedInspectionId);
  const inspectionProperty = properties.find((p) => p.id === activeInspection?.property_id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-slate-200">
      {/* Top Header */}
      <Navbar
        onQuickInspection={() => handleOpenQuickInspection('MOVE-IN')}
        onOpenSettings={() => handleTabChange('settings')}
        onSelectProperty={handleSelectProperty}
        onSelectInspection={handleSelectInspection}
        properties={properties}
        inspections={inspections}
        openDamagesCount={openDamagesCount}
        pendingRepairsCount={pendingRepairsCount}
        hasDemoData={hasDemoData}
        onLoadDemo={async () => {
          await seedDemoData();
          await refreshAllData();
        }}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={handleTabChange}
          propertiesCount={properties.length}
          inspectionsCount={inspections.length}
          openDamagesCount={openDamagesCount}
          pendingRepairsCount={pendingRepairsCount}
          documentsCount={documents.length}
        />

        {/* Central Dynamic View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Active Inspection Audit Workflow View */}
          {selectedInspectionId && activeInspection && inspectionProperty ? (
            <InspectionWorkflowView
              inspection={activeInspection}
              property={inspectionProperty}
              rooms={rooms.length > 0 ? rooms : []}
              onBack={() => setSelectedInspectionId(null)}
              onRefreshData={refreshAllData}
              onNavigateToReport={handleNavigateToReport}
              onNavigateToComparison={handleNavigateToComparison}
            />
          ) : selectedPropertyId && activeProperty ? (
            /* Active Property Detail View */
            <PropertyDetailView
              property={activeProperty}
              rooms={rooms}
              inspections={inspections.filter((i) => i.property_id === activeProperty.id)}
              damages={damages.filter((d) => d.property_id === activeProperty.id)}
              documents={documents.filter((d) => d.property_id === activeProperty.id)}
              onBack={() => setSelectedPropertyId(null)}
              onRefreshData={refreshAllData}
              onSelectInspection={handleSelectInspection}
              onNewInspection={(propId, type) => {
                setQuickPropId(propId);
                setQuickType(type || 'MOVE-IN');
                setIsQuickInspectionModalOpen(true);
              }}
            />
          ) : currentTab === 'dashboard' ? (
            /* Dashboard View */
            <DashboardView
              properties={properties}
              inspections={inspections}
              damages={damages}
              repairs={repairs}
              allItems={allItems}
              onNavigate={handleTabChange}
              onSelectProperty={handleSelectProperty}
              onSelectInspection={handleSelectInspection}
              onNewProperty={() => handleTabChange('properties')}
              onNewInspection={(type) => handleOpenQuickInspection(type)}
              onLoadDemo={async () => {
                await seedDemoData();
                await refreshAllData();
              }}
            />
          ) : currentTab === 'properties' ? (
            /* Properties Management View */
            <PropertiesView
              properties={properties}
              onSelectProperty={handleSelectProperty}
              onRefreshProperties={refreshAllData}
              onNewInspection={(propId) => {
                setQuickPropId(propId);
                setQuickType('MOVE-IN');
                setIsQuickInspectionModalOpen(true);
              }}
            />
          ) : currentTab === 'inspections' ? (
            /* All Inspections Archive */
            <InspectionsView
              inspections={inspections}
              properties={properties}
              onSelectInspection={handleSelectInspection}
              onRefreshInspections={refreshAllData}
              onNavigateToReport={handleNavigateToReport}
              onNavigateToComparison={handleNavigateToComparison}
              defaultTypeFilter="ALL"
            />
          ) : currentTab === 'move-in' ? (
            /* Dedicated Move-In View */
            <InspectionsView
              inspections={inspections}
              properties={properties}
              onSelectInspection={handleSelectInspection}
              onRefreshInspections={refreshAllData}
              onNavigateToReport={handleNavigateToReport}
              onNavigateToComparison={handleNavigateToComparison}
              defaultTypeFilter="MOVE-IN"
            />
          ) : currentTab === 'move-out' ? (
            /* Dedicated Move-Out View */
            <InspectionsView
              inspections={inspections}
              properties={properties}
              onSelectInspection={handleSelectInspection}
              onRefreshInspections={refreshAllData}
              onNavigateToReport={handleNavigateToReport}
              onNavigateToComparison={handleNavigateToComparison}
              defaultTypeFilter="MOVE-OUT"
            />
          ) : currentTab === 'comparison' ? (
            /* Before/After Condition Comparison Workspace */
            <ComparisonView
              properties={properties}
              inspections={inspections}
              initialMoveOutId={compareMoveOutId}
              onNavigateToReport={handleNavigateToReport}
            />
          ) : currentTab === 'damages' ? (
            /* Damage Register */
            <DamageRegisterView
              damages={damages}
              properties={properties}
              onRefreshDamages={refreshAllData}
              onSelectProperty={handleSelectProperty}
            />
          ) : currentTab === 'repairs' ? (
            /* Maintenance & Repairs Tracker */
            <RepairsView
              repairs={repairs}
              properties={properties}
              damages={damages}
              onRefreshRepairs={refreshAllData}
              onSelectProperty={handleSelectProperty}
            />
          ) : currentTab === 'handover-reports' ? (
            /* Handover Reports Generator */
            <HandoverReportView
              inspectionId={selectedReportId || inspections[0]?.id || ''}
              properties={properties}
              inspections={inspections}
              onBack={() => setCurrentTab('dashboard')}
              onSelectInspection={(id) => setSelectedReportId(id)}
            />
          ) : currentTab === 'documents' ? (
            /* Document Vault */
            <DocumentsView
              documents={documents}
              properties={properties}
              onRefreshDocuments={refreshAllData}
              onSelectProperty={handleSelectProperty}
            />
          ) : currentTab === 'activity' ? (
            /* Tamper-Evident Activity Log */
            <ActivityHistoryView
              logs={activityLogs}
              properties={properties}
              onSelectProperty={handleSelectProperty}
            />
          ) : currentTab === 'settings' ? (
            /* Settings & Full Backup/Restore */
            <SettingsView
              settings={settings}
              onRefreshData={refreshAllData}
              hasDemoData={hasDemoData}
            />
          ) : null}
        </main>
      </div>

      {/* Quick Inspection Modal */}
      <Modal
        isOpen={isQuickInspectionModalOpen}
        onClose={() => setIsQuickInspectionModalOpen(false)}
        title="Start Quick Property Inspection"
        subtitle="Initiate room-by-room condition checklist immediately."
      >
        <form onSubmit={handleQuickInspectionSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Target Property *</label>
            <select
              required
              value={quickPropId}
              onChange={(e) => {
                setQuickPropId(e.target.value);
                const p = properties.find((prop) => prop.id === e.target.value);
                if (p?.tenant_name) setQuickTenant(p.tenant_name);
              }}
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
                value={quickType}
                onChange={(e) => setQuickType(e.target.value as InspectionType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              >
                <option value="MOVE-IN">MOVE-IN (Baseline)</option>
                <option value="MOVE-OUT">MOVE-OUT (Handover)</option>
                <option value="ROUTINE">ROUTINE (Periodic)</option>
                <option value="MAINTENANCE">MAINTENANCE (Repair Check)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Inspector Full Name *</label>
              <input
                type="text"
                required
                value={quickInspector}
                onChange={(e) => setQuickInspector(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Tenant Name</label>
              <input
                type="text"
                value={quickTenant}
                onChange={(e) => setQuickTenant(e.target.value)}
                placeholder="Optional"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsQuickInspectionModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              Open Checklist
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
