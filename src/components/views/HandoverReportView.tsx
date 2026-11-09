import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  FileSpreadsheet,
  ArrowLeft,
  Building2,
  Calendar,
  Shield,
  User,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import {
  Inspection,
  Property,
  Room,
  InspectionItem,
  PhotoRecord,
  DamageRecord,
  SignatureRecord,
  RepairRecord,
} from '../../types';
import { dbService } from '../../services/db';
import { StatusBadge } from '../common/StatusBadge';

interface HandoverReportViewProps {
  inspectionId: string;
  properties: Property[];
  inspections: Inspection[];
  onBack: () => void;
  onSelectInspection: (id: string) => void;
}

export const HandoverReportView: React.FC<HandoverReportViewProps> = ({
  inspectionId,
  properties,
  inspections,
  onBack,
  onSelectInspection,
}) => {
  const [currentId, setCurrentId] = useState(inspectionId || inspections[0]?.id || '');
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [damages, setDamages] = useState<DamageRecord[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [includePhotosInPrint, setIncludePhotosInPrint] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const inspection = inspections.find((i) => i.id === currentId);
  const property = properties.find((p) => p.id === inspection?.property_id);

  useEffect(() => {
    const loadReportData = async () => {
      if (!currentId) return;
      setIsLoading(true);
      const insp = inspections.find((i) => i.id === currentId);
      if (insp) {
        const loadedRooms = await dbService.getRoomsByProperty(insp.property_id);
        const loadedItems = await dbService.getInspectionItems(insp.id);
        const loadedPhotos = await dbService.getPhotos(insp.property_id, insp.id);
        const loadedSigs = await dbService.getSignatures(insp.id);
        const loadedDamages = await dbService.getDamages(insp.property_id);

        setRooms(loadedRooms);
        setItems(loadedItems);
        setPhotos(loadedPhotos);
        setSignatures(loadedSigs);
        setDamages(loadedDamages.filter((d) => d.inspection_id === insp.id || !d.inspection_id));
      }
      setIsLoading(false);
    };

    loadReportData();
  }, [currentId, inspections]);

  if (!inspection || !property) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
        Please select a valid inspection to view its handover report.
      </div>
    );
  }

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Room', 'Category', 'Item Name', 'Condition Rating', 'Inspector Notes', 'Estimated Cost ($)'];
    const rows = items.map((it) => {
      const room = rooms.find((r) => r.id === it.room_id);
      return [
        `"${room?.room_name || 'General'}"`,
        `"${it.category}"`,
        `"${it.item_name.replace(/"/g, '""')}"`,
        `"${it.condition}"`,
        `"${(it.notes || '').replace(/"/g, '""')}"`,
        it.estimated_repair_cost || 0,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Handover_${property.property_code}_${inspection.inspection_type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export Handler
  const handleExportJSON = () => {
    const reportData = {
      reportType: 'LeaseProof Property Condition Handover Report',
      generatedAt: new Date().toISOString(),
      property,
      inspection,
      rooms,
      items,
      damages,
      signaturesSummary: signatures.map((s) => ({
        signer: s.signer_name,
        role: s.signer_role,
        date: s.date,
        notes: s.notes,
      })),
      photoCount: photos.length,
      disclaimer:
        'This report documents observed conditions at time of handover inspection. It does not constitute legal adjudication.',
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LeaseProof_Report_${inspection.id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Control Header (Hidden when printing) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div>
            <span className="text-xs font-semibold text-slate-500 mr-2">Select Inspection:</span>
            <select
              value={currentId}
              onChange={(e) => setCurrentId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none"
            >
              {inspections.map((i) => {
                const p = properties.find((pr) => pr.id === i.property_id);
                return (
                  <option key={i.id} value={i.id}>
                    {i.inspection_type} &bull; {p?.name} ({i.inspection_date})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer mr-2">
            <input
              type="checkbox"
              checked={includePhotosInPrint}
              onChange={(e) => setIncludePhotosInPrint(e.target.checked)}
              className="rounded text-slate-900"
            />
            <span>Include Photo Exhibits in Print</span>
          </label>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs"
            title="Download CSV Condition Matrix"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs"
            title="Export JSON Data Payload"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (Formatted for Print) */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 md:p-12 shadow-sm print-container print:border-none print:shadow-none print:p-0 space-y-8 text-slate-900">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">LeaseProof</span>
                <span className="text-[11px] font-mono font-medium text-slate-500 block">
                  PROPERTY CONDITION & HANDOVER DOCUMENTATION SYSTEM
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 font-medium">
              Official Room-by-Room Inspection Audit Record
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 text-xs font-extrabold uppercase rounded bg-slate-900 text-white">
              {inspection.inspection_type} REPORT
            </span>
            <div className="text-xs font-mono text-slate-500 mt-1">
              Doc ID: {inspection.id.toUpperCase()}
            </div>
            <div className="text-xs text-slate-700 font-semibold mt-0.5">
              Status: {inspection.status}
            </div>
          </div>
        </div>

        {/* Section 1: Property & Handover Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Property Asset</span>
            <div className="font-bold text-slate-900 mt-0.5">{property.name}</div>
            <div className="text-slate-600 font-mono text-[11px]">{property.property_code}</div>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Property Address</span>
            <div className="font-medium text-slate-900 mt-0.5">{property.address}</div>
            <div className="text-slate-600 text-[11px]">{property.city}, {property.state} {property.postal_code}</div>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Tenancy Information</span>
            <div className="font-medium text-slate-900 mt-0.5">Tenant: {inspection.tenant_name || property.tenant_name || 'N/A'}</div>
            <div className="text-slate-600 text-[11px]">Owner: {property.owner_name}</div>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Inspection Details</span>
            <div className="font-bold text-slate-900 mt-0.5">Date: {inspection.inspection_date}</div>
            <div className="text-slate-600 text-[11px]">Officer: {inspection.inspector_name}</div>
          </div>
        </div>

        {/* Section 2: Executive Summary */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
          <h3 className="font-bold uppercase tracking-wider text-slate-800 text-[11px]">Handover Executive Summary</h3>
          <p className="text-slate-600 leading-relaxed">
            {inspection.notes ||
              `A detailed, room-by-room condition inspection was conducted on ${inspection.inspection_date}. All visible walls, flooring, electrical sockets, windows, plumbing fixtures, and built-in elements were checked and logged below.`}
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 text-[11px]">
            <span>Total Inspected Items: <strong>{items.length}</strong></span>
            <span>Damaged Items: <strong className="text-rose-700">{items.filter((i) => i.condition === 'DAMAGED').length}</strong></span>
            <span>Attached Evidence Photos: <strong>{photos.length}</strong></span>
            <span>Recorded Sign-Offs: <strong>{signatures.length}</strong></span>
          </div>
        </div>

        {/* Section 3: Room-by-Room Itemized Condition Schedule */}
        <div className="space-y-6">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
            <span>Room-by-Room Condition Schedule</span>
            <span className="text-xs text-slate-500 font-normal lowercase">({rooms.length} rooms audited)</span>
          </h3>

          {rooms.map((room) => {
            const roomItems = items.filter((i) => i.room_id === room.id);
            if (roomItems.length === 0) return null;

            return (
              <div key={room.id} className="space-y-2 print-avoid-break">
                <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900">{room.room_name} ({room.room_type})</span>
                  <span className="text-slate-500 font-mono text-[11px]">{roomItems.length} items verified</span>
                </div>

                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="py-2 px-3 w-1/4">Element / Fixture</th>
                      <th className="py-2 px-3 w-1/6">Category</th>
                      <th className="py-2 px-3 w-1/6">Observed Condition</th>
                      <th className="py-2 px-3">Inspector Notes & Defect Details</th>
                      <th className="py-2 px-3 text-right w-24">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {roomItems.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-medium text-slate-900">{it.item_name}</td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">{it.category.replace('_', ' ')}</td>
                        <td className="py-2 px-3">
                          <StatusBadge status={it.condition} />
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">{it.notes || '—'}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-900 font-medium">
                          {it.estimated_repair_cost ? `$${it.estimated_repair_cost}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Section 4: Damage & Defect Register Summary */}
        {damages.length > 0 && (
          <div className="space-y-3 print-avoid-break">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
              Damage Register & Repair Allocations
            </h3>

            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-semibold text-slate-500">
                <tr>
                  <th className="py-2 px-3">Damage Code</th>
                  <th className="py-2 px-3">Damaged Item</th>
                  <th className="py-2 px-3">Severity</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {damages.map((dmg) => (
                  <tr key={dmg.id}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{dmg.damage_code}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{dmg.item_name}</td>
                    <td className="py-2 px-3">{dmg.severity}</td>
                    <td className="py-2 px-3 text-slate-600">{dmg.description}</td>
                    <td className="py-2 px-3">
                      <StatusBadge status={dmg.status} />
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">${dmg.estimated_cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section 5: Photographic Evidence Exhibits */}
        {includePhotosInPrint && photos.length > 0 && (
          <div className="space-y-3 print-avoid-break">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>Photographic Evidence Exhibits</span>
              <span className="text-xs text-slate-500 font-normal">{photos.length} exhibits on file</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((p, index) => {
                const room = rooms.find((r) => r.id === p.room_id);
                return (
                  <div key={p.id} className="border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1.5 text-xs">
                    <img
                      src={p.image_data}
                      alt={p.file_name}
                      className="w-full h-32 object-cover rounded border border-slate-200 bg-white"
                    />
                    <div className="flex items-center justify-between text-[10px] font-semibold">
                      <span className="px-1.5 py-0.2 rounded bg-slate-900 text-white uppercase">
                        {p.photo_category}
                      </span>
                      <span className="text-slate-500">Exhibit #{index + 1}</span>
                    </div>
                    <p className="font-medium text-slate-800 truncate text-[11px]">{p.description || p.file_name}</p>
                    <p className="text-[10px] text-slate-400">
                      {room?.room_name || 'General Area'} &bull; {p.captured_at.substring(0, 10)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 6: Official Acknowledgements & Signatures */}
        <div className="space-y-4 print-avoid-break border-t-2 border-slate-900 pt-6">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
            Handover Acknowledgements & Sign-Off
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {signatures.length === 0 ? (
              <div className="col-span-full p-4 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400 italic">
                No signatures have been drawn for this inspection yet. Signatures can be recorded directly in the inspection audit workspace.
              </div>
            ) : (
              signatures.map((sig) => (
                <div key={sig.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{sig.signer_name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {sig.signer_role}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded p-1 flex items-center justify-center h-20">
                    <img src={sig.signature_data} alt={sig.signer_name} className="h-16 object-contain" />
                  </div>

                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Date: {sig.date}</span>
                    <span className="text-emerald-700 font-semibold">● Provided</span>
                  </div>
                  {sig.notes && (
                    <p className="text-[10px] text-slate-600 italic">"{sig.notes}"</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 7: Legal Disclaimer & Principle Notice */}
        <div className="p-4 bg-slate-100 rounded-xl text-[10px] text-slate-500 leading-relaxed print-avoid-break space-y-1">
          <p className="font-bold uppercase tracking-wider text-slate-700">Notice of Purpose & Legal Boundary</p>
          <p>
            LeaseProof documents observed property conditions as recorded at the specific date and time of inspection.
            This report does not automatically make legal determinations regarding security deposit allocations,
            tenant fault, or latent structural defects. Signatures recorded above represent local on-device acknowledgements
            within this application and do not represent independently certified cryptographic digital signatures.
          </p>
        </div>
      </div>
    </div>
  );
};
