import React, { useState, useRef } from 'react';
import {
  FolderLock,
  Upload,
  FileText,
  FileCheck,
  Download,
  Trash2,
  Search,
  Filter,
  Eye,
  Building2,
  Calendar,
  HardDrive,
} from 'lucide-react';
import { DocumentRecord, Property, DocumentCategory } from '../../types';
import { formatBytes } from '../../services/imageUtils';
import { dbService } from '../../services/db';
import { Modal } from '../common/Modal';

interface DocumentsViewProps {
  documents: DocumentRecord[];
  properties: Property[];
  onRefreshDocuments: () => Promise<void>;
  onSelectProperty: (propertyId: string) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  properties,
  onRefreshDocuments,
  onSelectProperty,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState<DocumentRecord | null>(null);

  // Upload state
  const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
  const [category, setCategory] = useState<DocumentCategory>('Agreement');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !propertyId) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileDataUrl = event.target?.result as string;

        const docRecord: DocumentRecord = {
          id: 'doc_' + Date.now(),
          property_id: propertyId,
          file_name: selectedFile.name,
          file_type: selectedFile.type || 'application/octet-stream',
          file_size: selectedFile.size,
          file_data: fileDataUrl,
          description: description.trim() || undefined,
          category,
          uploaded_at: new Date().toISOString(),
        };

        await dbService.saveDocument(docRecord);
        await onRefreshDocuments();
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setDescription('');
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error(err);
      alert('Failed to read file locally');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Permanently remove document "${name}" from local browser vault?`)) {
      await dbService.deleteDocument(id);
      await onRefreshDocuments();
    }
  };

  const handleDownload = (doc: DocumentRecord) => {
    const a = document.createElement('a');
    a.href = doc.file_data;
    a.download = doc.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filtered = documents.filter((d) => {
    const prop = properties.find((p) => p.id === d.property_id);
    const matchSearch =
      d.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase())) ||
      (prop && prop.name.toLowerCase().includes(search.toLowerCase()));

    const matchCategory = categoryFilter === 'ALL' || d.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Document Vault</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
              {documents.length} Stored Locally
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Store lease agreements, repair invoices, certificates, and handover reports securely in browser IndexedDB.
          </p>
        </div>

        <button
          onClick={() => {
            setPropertyId(properties[0]?.id || '');
            setSelectedFile(null);
            setDescription('');
            setIsUploadModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Upload className="w-4 h-4 text-emerald-400" />
          <span>Upload Document</span>
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
            placeholder="Search documents by name, description, property..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Agreement">Lease Agreement</option>
            <option value="Invoice">Repair Invoice</option>
            <option value="Report">Inspection Report</option>
            <option value="Other">Other Document</option>
          </select>
        </div>
      </div>

      {/* Document Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <FolderLock className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No documents stored</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload residential lease agreements, maintenance work receipts, or inspection files.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const prop = properties.find((p) => p.id === doc.property_id);
            const isImage = doc.file_type.startsWith('image/');
            const isPdf = doc.file_type.includes('pdf');

            return (
              <div
                key={doc.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {doc.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatBytes(doc.file_size)}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      {isPdf ? (
                        <FileCheck className="w-5 h-5 text-rose-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <div className="truncate">
                      <h3 className="text-xs font-bold text-slate-900 truncate" title={doc.file_name}>
                        {doc.file_name}
                      </h3>
                      {doc.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{doc.description}</p>
                      )}
                    </div>
                  </div>

                  {prop && (
                    <div className="text-[11px] text-slate-600 flex items-center gap-1 pt-1 border-t border-slate-100">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{prop.name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {doc.uploaded_at.substring(0, 10)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedDocPreview(doc)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                      title="Download Original"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.file_name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Store Document in Local Vault"
        subtitle="Saved directly in browser storage. No external cloud upload."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
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
            <label className="block font-medium text-slate-700 mb-1">Document Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
            >
              <option value="Agreement">Rental / Lease Agreement</option>
              <option value="Invoice">Repair Invoice / Contractor Receipt</option>
              <option value="Report">Inspection Report PDF</option>
              <option value="Other">Other Supporting Document</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Select File (PDF, DOC, Images) *</label>
            <input
              type="file"
              required
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Document Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Executed 2026 Lease Agreement with co-signer"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !selectedFile}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50"
            >
              {isProcessing ? 'Storing...' : 'Save to Vault'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      {selectedDocPreview && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDocPreview(null)}
          title={selectedDocPreview.file_name}
          subtitle={`${selectedDocPreview.category} &bull; ${formatBytes(selectedDocPreview.file_size)}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {selectedDocPreview.file_type.startsWith('image/') ? (
              <img
                src={selectedDocPreview.file_data}
                alt={selectedDocPreview.file_name}
                className="max-h-[60vh] max-w-full mx-auto object-contain rounded border border-slate-200"
              />
            ) : selectedDocPreview.file_type.includes('pdf') ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <FileCheck className="w-12 h-12 text-rose-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">PDF Document Ready</h4>
                <p className="text-xs text-slate-500">
                  This PDF is stored locally in your browser's IndexedDB. Download to view in your system reader.
                </p>
                <button
                  onClick={() => handleDownload(selectedDocPreview)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF File
                </button>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Binary Document File</h4>
                <button
                  onClick={() => handleDownload(selectedDocPreview)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5" /> Download File
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
