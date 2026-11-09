import React from 'react';
import { X, Download, Trash2, Calendar, Tag, HardDrive } from 'lucide-react';
import { PhotoRecord } from '../../types';
import { formatBytes } from '../../services/imageUtils';

interface PhotoViewerModalProps {
  photo: PhotoRecord | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  roomName?: string;
  itemName?: string;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  photo,
  onClose,
  onDelete,
  roomName,
  itemName,
}) => {
  if (!photo) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photo.image_data;
    a.download = photo.file_name || `evidence_${photo.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
              {photo.photo_category}
            </span>
            <span className="text-sm font-semibold text-slate-800 truncate max-w-md">
              {photo.file_name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
              title="Download Photo"
            >
              <Download className="w-4 h-4" />
            </button>
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this evidence photograph permanently?')) {
                    onDelete(photo.id);
                    onClose();
                  }
                }}
                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                title="Delete Photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Preview Container */}
        <div className="p-4 bg-slate-900 flex items-center justify-center overflow-auto max-h-[65vh]">
          <img
            src={photo.image_data}
            alt={photo.file_name}
            className="max-h-[60vh] max-w-full object-contain rounded shadow-lg"
          />
        </div>

        {/* Metadata Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            {photo.description && (
              <p className="font-medium text-slate-900 text-sm">{photo.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-slate-500">
              {roomName && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Room: <strong>{roomName}</strong>
                </span>
              )}
              {itemName && (
                <span className="flex items-center gap-1">
                  Item: <strong>{itemName}</strong>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {photo.captured_at.replace('T', ' ').substring(0, 19)}
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" /> {formatBytes(photo.file_size)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
