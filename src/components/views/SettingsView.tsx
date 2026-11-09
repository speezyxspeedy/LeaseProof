import React, { useState, useRef } from 'react';
import {
  Settings,
  Download,
  Upload,
  Sparkles,
  Trash2,
  ShieldCheck,
  Check,
  RefreshCw,
  HardDrive,
  Info,
  AlertOctagon,
} from 'lucide-react';
import { AppSettings } from '../../types';
import {
  createFullBackup,
  downloadBackupFile,
  validateBackupFile,
  executeRestore,
  RestorePreview,
} from '../../services/backup';
import { seedDemoData, clearDemoData } from '../../services/demoData';
import { dbService } from '../../services/db';

interface SettingsViewProps {
  settings: AppSettings;
  onRefreshData: () => Promise<void>;
  hasDemoData: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onRefreshData,
  hasDemoData,
}) => {
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Backup / Restore state
  const [isExporting, setIsExporting] = useState(false);
  const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(null);
  const [restoreFileContent, setRestoreFileContent] = useState<string>('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await dbService.saveSettings(currentSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackupExport = async () => {
    setIsExporting(true);
    try {
      const { jsonString } = await createFullBackup();
      downloadBackupFile(jsonString);
    } catch (err) {
      console.error(err);
      alert('Failed to generate full backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreFileContent(content);
      const preview = validateBackupFile(content);
      setRestorePreview(preview);
    };
    reader.readAsText(file);
  };

  const handleApplyRestore = async () => {
    if (!restorePreview || !restorePreview.isValid) return;

    const confirmRestore = confirm(
      `Restore will import ${restorePreview.totalRecords} records across all stores. Overwrite existing duplicate IDs?`
    );
    if (!confirmRestore) return;

    setIsRestoring(true);
    try {
      const res = await executeRestore(restoreFileContent, false);
      setRestoreSuccessMsg(`Successfully restored ${res.importedCount} records into local vault.`);
      setRestorePreview(null);
      setRestoreFileContent('');
      await onRefreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to apply restore';
      alert(`Restore Error: ${message}`);
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadDemo = async () => {
    if (confirm('Load sample properties, rooms, move-in/out inspections, and damages into your local workspace?')) {
      await seedDemoData();
      await onRefreshData();
      alert('Demo workspace loaded successfully.');
    }
  };

  const handleClearDemo = async () => {
    if (confirm('Remove all demo properties and linked demo inspections from the workspace?')) {
      await clearDemoData();
      await onRefreshData();
      alert('Demo data removed.');
    }
  };

  const handleResetWorkspace = async () => {
    const promptText = prompt(
      'WARNING: This will permanently purge all properties, inspections, photos, damages, and documents stored in this browser. Type "DELETE ALL" to confirm:'
    );
    if (promptText === 'DELETE ALL') {
      await dbService.clearAllData();
      await onRefreshData();
      alert('Local workspace reset completely.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workspace Settings & Data Vault</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure inspection defaults, generate portable JSON backups, and manage browser storage.
        </p>
      </div>

      {/* Demo Workspace Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" /> Demo Sample Workspace
            </h2>
            <p className="text-xs text-slate-500">
              Load 3 sample real-world properties, completed move-in baseline, and move-out condition audits.
            </p>
          </div>
          {hasDemoData ? (
            <button
              onClick={handleClearDemo}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              Clear Demo Data
            </button>
          ) : (
            <button
              onClick={handleLoadDemo}
              className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Load Demo Data
            </button>
          )}
        </div>
      </div>

      {/* Full Backup & Restore */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-slate-700" /> Complete Backup & Restore (JSON Archive)
          </h2>
          <p className="text-xs text-slate-500">
            Export every property, inspection checklist, photo evidence, damage log, and signature in a self-contained portable file.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Export Local Vault</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generates a verified, portable JSON backup file containing all 11 object stores and photo Blobs.
            </p>
            <button
              type="button"
              onClick={handleBackupExport}
              disabled={isExporting}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Packaging Archive...' : 'Download Full Backup (.json)'}
            </button>
          </div>

          {/* Import / Restore Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Restore From File</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select a previously exported LeaseProof backup file to restore records safely with duplicate protection.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Select Backup File</span>
            </button>
          </div>
        </div>

        {/* Restore Preview Notification */}
        {restorePreview && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${restorePreview.isValid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
            {restorePreview.isValid ? (
              <>
                <div className="flex items-center justify-between font-bold">
                  <span>Valid Backup Archive Detected (Version {restorePreview.version})</span>
                  <span>{restorePreview.totalRecords} total records</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                  {Object.entries(restorePreview.counts).map(([store, count]) => (
                    <div key={store} className="bg-white/80 p-1.5 rounded border border-emerald-200">
                      <span className="font-semibold">{store}: </span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setRestorePreview(null)}
                    className="px-3 py-1 bg-white border border-emerald-300 rounded font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyRestore}
                    disabled={isRestoring}
                    className="px-4 py-1 bg-emerald-800 text-white rounded font-bold hover:bg-emerald-900"
                  >
                    {isRestoring ? 'Restoring...' : 'Confirm & Apply Restore'}
                  </button>
                </div>
              </>
            ) : (
              <div>
                <strong>Invalid Backup File: </strong> {restorePreview.errorMessage}
              </div>
            )}
          </div>
        )}

        {restoreSuccessMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            {restoreSuccessMsg}
          </div>
        )}
      </div>

      {/* Preferences Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Report & Inspection Preferences</h2>
          <p className="text-xs text-slate-500">
            Set company information and default inspection text used on generated handover documents.
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Company / Agency Name</label>
              <input
                type="text"
                value={currentSettings.company_name}
                onChange={(e) => setCurrentSettings({ ...currentSettings, company_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Company Tagline</label>
              <input
                type="text"
                value={currentSettings.company_tagline}
                onChange={(e) => setCurrentSettings({ ...currentSettings, company_tagline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Default Inspector Full Name</label>
              <input
                type="text"
                value={currentSettings.default_inspector_name}
                onChange={(e) => setCurrentSettings({ ...currentSettings, default_inspector_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Max Evidence Photo Size Limit (MB)</label>
              <input
                type="number"
                min="1"
                max="25"
                value={currentSettings.photo_size_limit_mb}
                onChange={(e) =>
                  setCurrentSettings({ ...currentSettings, photo_size_limit_mb: Number(e.target.value) })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Legal Report Disclaimer Text</label>
            <textarea
              rows={3}
              value={currentSettings.disclaimer_text}
              onChange={(e) => setCurrentSettings({ ...currentSettings, disclaimer_text: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            {saveSuccess ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Preferences Saved
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Reset Workspace */}
      <div className="bg-white border border-rose-200 rounded-xl p-5 shadow-2xs space-y-3">
        <div>
          <h2 className="text-sm font-bold text-rose-800 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-600" /> Workspace Reset (Danger Zone)
          </h2>
          <p className="text-xs text-slate-500">
            Purges all property and inspection records from this browser instance.
          </p>
        </div>

        <button
          onClick={handleResetWorkspace}
          className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" /> Purge Local Browser Vault
        </button>
      </div>
    </div>
  );
};
