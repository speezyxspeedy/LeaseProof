import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, Check } from 'lucide-react';
import { PhotoCategory, PhotoRecord } from '../../types';
import { compressImageFile } from '../../services/imageUtils';
import { dbService } from '../../services/db';

interface PhotoUploaderProps {
  propertyId: string;
  inspectionId?: string | null;
  roomId?: string | null;
  inspectionItemId?: string | null;
  defaultCategory?: PhotoCategory;
  onPhotoUploaded: (photo: PhotoRecord) => void;
  compact?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  propertyId,
  inspectionId,
  roomId,
  inspectionItemId,
  defaultCategory = 'GENERAL',
  onPhotoUploaded,
  compact = false,
}) => {
  const [category, setCategory] = useState<PhotoCategory>(defaultCategory);
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Camera access denied or unavailable';
      setCameraError(message);
      // Fallback to file input
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    stopCamera();
    await savePhotoRecord(dataUrl, `capture_${Date.now()}.jpg`, 'image/jpeg', Math.round(dataUrl.length * 0.75));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressedDataUrl = await compressImageFile(file, 1600, 0.8);
        await savePhotoRecord(compressedDataUrl, file.name, file.type, Math.round(compressedDataUrl.length * 0.75));
      }
    } catch (err) {
      console.error('Failed to compress/save photo', err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const savePhotoRecord = async (dataUrl: string, fileName: string, fileType: string, fileSize: number) => {
    const photo: PhotoRecord = {
      id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      property_id: propertyId,
      inspection_id: inspectionId || null,
      room_id: roomId || null,
      inspection_item_id: inspectionItemId || null,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      image_data: dataUrl,
      photo_category: category,
      description: description.trim(),
      captured_at: new Date().toISOString(),
    };

    await dbService.savePhoto(photo);
    onPhotoUploaded(photo);
    setDescription('');
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          multiple
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
          title="Upload Photo Evidence"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>Upload</span>
        </button>
        <button
          type="button"
          onClick={startCamera}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
          title="Capture with Camera"
        >
          <Camera className="w-3.5 h-3.5 text-slate-500" />
          <span>Camera</span>
        </button>

        {showCamera && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-w-md w-full space-y-3">
              <div className="flex justify-between items-center text-white">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Live Camera</span>
                <button onClick={stopCamera} className="p-1 hover:bg-slate-800 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-black aspect-4/3 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={captureFrame}
                  className="px-5 py-2.5 bg-white text-slate-900 rounded-full font-bold text-sm shadow hover:bg-slate-100 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4 text-slate-900" />
                  Snap Evidence Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-slate-500" /> Attach Photo Evidence
        </label>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Category:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PhotoCategory)}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none"
          >
            <option value="GENERAL">General Condition</option>
            <option value="BEFORE">Before (Move-In)</option>
            <option value="AFTER">After (Move-Out)</option>
            <option value="DAMAGE">Damage Evidence</option>
            <option value="REPAIR">Repair Evidence</option>
          </select>
        </div>
      </div>

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Brief photo description or note (e.g. Scuff near bottom door edge)..."
        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
      />

      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          multiple
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-slate-600" />
          <span>Upload From Gallery</span>
        </button>

        <button
          type="button"
          onClick={startCamera}
          disabled={isProcessing}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Capture With Camera</span>
        </button>
      </div>

      {cameraError && (
        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
          Camera notice: {cameraError}. (You can still upload photos from file gallery).
        </p>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-600 py-1">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Optimizing and saving photo locally...
        </div>
      )}

      {/* Camera Live Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-w-md w-full space-y-3">
            <div className="flex justify-between items-center text-white">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Live Viewfinder</span>
              <button onClick={stopCamera} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative rounded-lg overflow-hidden bg-black aspect-4/3 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={captureFrame}
                className="px-5 py-2.5 bg-white text-slate-900 rounded-full font-bold text-sm shadow hover:bg-slate-100 flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-slate-900" />
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
