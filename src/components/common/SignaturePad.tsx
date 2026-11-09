import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, FileSignature } from 'lucide-react';
import { SignatureRecord } from '../../types';

interface SignaturePadProps {
  inspectionId: string;
  defaultRole?: 'Inspector' | 'Owner / Landlord' | 'Tenant' | 'Agent';
  onSaveSignature: (sig: SignatureRecord) => Promise<void>;
  existingSignatures?: SignatureRecord[];
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  inspectionId,
  defaultRole = 'Inspector',
  onSaveSignature,
  existingSignatures = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState<'Inspector' | 'Owner / Landlord' | 'Tenant' | 'Agent'>(defaultRole);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = 160 * 2;
    ctx.scale(2, 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, 160);

    // Baseline rule
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 125);
    ctx.lineTo(rect.width - 20, 125);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('SIGN HERE (TOUCH OR MOUSE)', 20, 142);
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, 160);

    // Redraw guide line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 125);
    ctx.lineTo(rect.width - 20, 125);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('SIGN HERE (TOUCH OR MOUSE)', 20, 142);

    setHasDrawn(false);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!signerName.trim()) {
      alert('Please enter signer full name');
      return;
    }
    if (!hasDrawn) {
      alert('Please draw a signature on the canvas');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const sigRecord: SignatureRecord = {
        id: 'sig_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        inspection_id: inspectionId,
        signer_name: signerName.trim(),
        signer_role: signerRole,
        signature_data: dataUrl,
        date: new Date().toISOString().substring(0, 10),
        notes: notes.trim(),
        created_at: new Date().toISOString(),
      };

      await onSaveSignature(sigRecord);
      setSaveSuccess(true);
      clearCanvas();
      setSignerName('');
      setNotes('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing signatures listing */}
      {existingSignatures.length > 0 && (
        <div className="space-y-2 mb-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recorded Sign-Offs</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {existingSignatures.map((sig) => (
              <div key={sig.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{sig.signer_name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                      {sig.signer_role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Recorded: {sig.date}</p>
                  {sig.notes && <p className="text-xs text-slate-600 mt-1 italic">"{sig.notes}"</p>}
                </div>
                <img
                  src={sig.signature_data}
                  alt={sig.signer_name}
                  className="h-10 w-24 object-contain border border-slate-200 rounded bg-white p-0.5"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signature Capture Form */}
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-medium text-sm">
            <FileSignature className="w-4 h-4 text-slate-600" />
            <span>Add New Acknowledgement Signature</span>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Status: {hasDrawn ? <span className="text-emerald-700 font-semibold">PROVIDED</span> : 'NOT PROVIDED'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Signer Full Name *</label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Signer Role *</label>
            <select
              value={signerRole}
              onChange={(e) => setSignerRole(e.target.value as any)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="Inspector">Inspector</option>
              <option value="Owner / Landlord">Owner / Landlord</option>
              <option value="Tenant">Tenant</option>
              <option value="Agent">Agent / Property Manager</option>
            </select>
          </div>
        </div>

        {/* Canvas area */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-700">Draw Signature Below *</label>
            <button
              type="button"
              onClick={clearCanvas}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium px-2 py-0.5 rounded hover:bg-slate-200 transition-colors"
            >
              <Eraser className="w-3.5 h-3.5" />
              Clear Pad
            </button>
          </div>
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
            <canvas
              ref={canvasRef}
              className="w-full h-40 cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Acknowledgement Notes (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Keys received and tested; condition documented as observed."
            className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <p className="text-[11px] text-slate-500 max-w-sm leading-tight">
            Note: Signatures are local on-device acknowledgements recorded in LeaseProof.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasDrawn || !signerName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : saveSuccess ? <><Check className="w-3.5 h-3.5" /> Saved</> : 'Record Sign-Off'}
          </button>
        </div>
      </div>
    </div>
  );
};
