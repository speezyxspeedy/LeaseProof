import React from 'react';
import { ConditionRating, DamageStatus, DamageSeverity, RepairStatus, InspectionStatus, ComparisonDiffCategory } from '../../types';

interface StatusBadgeProps {
  status: ConditionRating | DamageStatus | DamageSeverity | RepairStatus | InspectionStatus | ComparisonDiffCategory | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = status.toUpperCase();

  // Condition Ratings
  if (s === 'EXCELLENT') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded border px-2 py-0.5 text-xs bg-emerald-50 border-emerald-200 text-emerald-800`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        Excellent
      </span>
    );
  }
  if (s === 'GOOD') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded border px-2 py-0.5 text-xs bg-emerald-50/70 border-emerald-200 text-emerald-700`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Good
      </span>
    );
  }
  if (s === 'FAIR') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded border px-2 py-0.5 text-xs bg-amber-50 border-amber-200 text-amber-800`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Fair
      </span>
    );
  }
  if (s === 'DAMAGED') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded border px-2 py-0.5 text-xs bg-rose-50 border-rose-200 text-rose-800`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
        Damaged
      </span>
    );
  }
  if (s === 'MISSING') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded border px-2 py-0.5 text-xs bg-purple-50 border-purple-200 text-purple-800`}>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
        Missing
      </span>
    );
  }
  if (s === 'NOT_APPLICABLE' || s === 'N/A') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded border px-2 py-0.5 text-xs bg-slate-100 border-slate-200 text-slate-600`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        N/A
      </span>
    );
  }
  if (s === 'NOT_INSPECTED') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded border px-2 py-0.5 text-xs bg-slate-100 border-slate-300 text-slate-500 border-dashed`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        Not Inspected
      </span>
    );
  }

  // Comparison Categories
  if (s === 'NO_CHANGE') {
    return (
      <span className="inline-flex items-center gap-1 font-medium rounded border px-2 py-0.5 text-xs bg-slate-100 border-slate-200 text-slate-700">
        <span className="text-slate-400">●</span> No Change
      </span>
    );
  }
  if (s === 'IMPROVED') {
    return (
      <span className="inline-flex items-center gap-1 font-medium rounded border px-2 py-0.5 text-xs bg-emerald-50 border-emerald-300 text-emerald-800">
        <span className="text-emerald-600">↑</span> Improved
      </span>
    );
  }
  if (s === 'CONDITION_DECLINED') {
    return (
      <span className="inline-flex items-center gap-1 font-medium rounded border px-2 py-0.5 text-xs bg-amber-50 border-amber-300 text-amber-900">
        <span className="text-amber-600">↓</span> Declined
      </span>
    );
  }
  if (s === 'NEW_DAMAGE') {
    return (
      <span className="inline-flex items-center gap-1 font-medium rounded border px-2 py-0.5 text-xs bg-rose-50 border-rose-300 text-rose-900">
        <span className="text-rose-600">⚠</span> New Damage
      </span>
    );
  }
  if (s === 'ITEM_MISSING') {
    return (
      <span className="inline-flex items-center gap-1 font-medium rounded border px-2 py-0.5 text-xs bg-rose-50 border-rose-300 text-rose-800">
        ✕ Item Missing
      </span>
    );
  }
  if (s === 'NOT_COMPARABLE') {
    return (
      <span className="inline-flex items-center gap-1 font-medium rounded border px-2 py-0.5 text-xs bg-slate-100 border-slate-200 text-slate-500">
        Not Comparable
      </span>
    );
  }
  if (s === 'REQUIRES_REVIEW') {
    return (
      <span className="inline-flex items-center gap-1 font-medium rounded border px-2 py-0.5 text-xs bg-amber-50 border-amber-200 text-amber-700">
        Requires Review
      </span>
    );
  }

  // Inspection Statuses
  if (s === 'FINALIZED') {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium rounded border px-2 py-0.5 text-xs bg-slate-900 border-slate-900 text-white">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        Finalized
      </span>
    );
  }
  if (s === 'IN_PROGRESS') {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium rounded border px-2 py-0.5 text-xs bg-blue-50 border-blue-200 text-blue-800">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
        In Progress
      </span>
    );
  }
  if (s === 'AMENDED') {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium rounded border px-2 py-0.5 text-xs bg-purple-50 border-purple-200 text-purple-800">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
        Amended
      </span>
    );
  }

  // Damage Statuses
  if (s === 'OPEN') {
    return (
      <span className="inline-flex items-center gap-1 font-medium rounded border px-2 py-0.5 text-xs bg-rose-50 border-rose-200 text-rose-800">
        Open
      </span>
    );
  }
  if (s === 'REPAIR_SCHEDULED' || s === 'SCHEDULED') {
    return (
      <span className="inline-flex items-center gap-1 font-medium rounded border px-2 py-0.5 text-xs bg-blue-50 border-blue-200 text-blue-800">
        Scheduled
      </span>
    );
  }
  if (s === 'REPAIRED' || s === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 font-medium rounded border px-2 py-0.5 text-xs bg-emerald-50 border-emerald-200 text-emerald-800">
        Completed
      </span>
    );
  }
  if (s === 'CLOSED') {
    return (
      <span className="inline-flex items-center gap-1 font-medium rounded border px-2 py-0.5 text-xs bg-slate-100 border-slate-200 text-slate-700">
        Closed
      </span>
    );
  }

  // Default fallback badge
  return (
    <span className="inline-flex items-center font-medium rounded border px-2 py-0.5 text-xs bg-slate-100 border-slate-200 text-slate-700">
      {status}
    </span>
  );
};
