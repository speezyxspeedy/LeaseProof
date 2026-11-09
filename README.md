# LeaseProof
### Property Inspection, Rental Handover & Condition Documentation Platform
> **Tagline:** Document Every Detail. Protect Every Handover.

LeaseProof is an institutional-grade property inspection and rental handover platform designed for landlords, tenants, property managers, and real estate agencies. It enables comprehensive room-by-room condition audits, photographic evidence capture, before/after condition comparisons, defect tracking, and printable handover reports.

---

## 1. Visual & Architectural Philosophy
- **Light & Gray Institutional Design:** Crisp slate-50 canvas, razor-thin slate-200 borders, high-contrast slate-900 typography, and clean color-coded indicators (Emerald for Good/Excellent, Amber for Fair/Attention, Rose for Damaged).
- **Anti-AI Slop:** Zero gratuitous chatbot panels, zero bubbly cartoon pills, zero gradient mesh backgrounds. Pure, reliable, high-precision engineering for real-estate operations.
- **Privacy-First Local Persistence:** 100% client-side data vault using browser **IndexedDB**. No external database or cloud storage dependencies; all photographs, signatures, and lease documents stay on the user's device.

---

## 2. Core Functional Modules

### A. Property & Area Management
- Unique auto-generated property identifiers (`LP-YYYY-XXXX`).
- Full CRUD operations with search, filtering by asset type (Apartment, House, Villa, Commercial, etc.), and sorting.
- Dynamic room and area builder with custom room creation, renaming, reordering, and category assignments.

### B. Digital Inspection Engine
- Room-by-room inspection workflow supporting **Move-In**, **Move-Out**, **Routine**, and **Maintenance** audits.
- Pre-populated standard inspection checklists across 7 element categories:
  - Walls & Paint (Paint condition, Cracks, Stains, Water damage)
  - Flooring (Tiles, Hardwood, Scratches, Baseboards)
  - Doors & Windows (Locks, Deadbolts, Hinges, Glass, Latches)
  - Electrical (Light fixtures, Switches, Sockets, Fans)
  - Furniture & Fixtures (Wardrobes, Cabinets, Shelves)
  - Plumbing (Taps, Sinks, Toilets, Drains, Water leakage)
  - Appliances (Air conditioner, Refrigerator, Stove, Water heater)
  - Custom user-defined items
- Strict condition rating scale: `EXCELLENT`, `GOOD`, `FAIR`, `DAMAGED`, `MISSING`, `NOT_APPLICABLE`, `NOT_INSPECTED`.
- In-place photographic evidence attachment and live camera viewfinder.
- Audit finalization lock to prevent silent alterations, with documented amendment tracking.

### C. Before & After Handover Comparison Workspace
- Interactive side-by-side workspace: Move-In baseline on the left, Move-Out condition on the right.
- Automated difference classifier: `NO_CHANGE`, `IMPROVED`, `CONDITION_DECLINED`, `NEW_DAMAGE`, `ITEM_MISSING`, `REQUIRES_REVIEW`, `NOT_COMPARABLE`.
- Side-by-side photographic evidence viewer with high-resolution lightbox.
- Room-wise change counts and repair cost aggregates.

### D. Damage Register & Repair Tracking
- Defect tracking with severity levels (`Minor`, `Moderate`, `Severe`, `Critical`).
- Workflow status pipeline: `OPEN` → `UNDER_REVIEW` → `REPAIR_SCHEDULED` → `REPAIRED` → `ACCEPTED` → `CLOSED`.
- Maintenance work orders with contractor assignment and estimated vs. actual billed expense reconciliation.

### E. Digital Handover Report Generator
- Printable HTML document layout with `@media print` CSS for physical printing and browser **Print to PDF**.
- Clean itemized condition matrix, damage schedules, and embedded photo exhibits.
- HTML5 Canvas signature pad for recording on-device acknowledgements (Inspector, Landlord, Tenant).
- JSON and CSV data exports.
- Clear legal boundary disclaimer: documents observed condition without automated legal adjudication.

### F. Document Vault & Audit History
- Local document store for rental agreements, invoices, floor plans, and certificates.
- Immutable timestamped event log tracking property creation, inspection locks, photo attachments, and restores.

### G. Backup & Restore
- Full JSON backup archive encapsulating all 11 IndexedDB object stores and photo Blobs.
- Schema validator, version checker, and restore preview with duplicate resolution.
- 1-click Demo Workspace loader and complete workspace reset.

---

## 3. Technology Stack & File Architecture

```
/
├── index.html                  # HTML entry point with Plus Jakarta Sans & print meta
├── manifest.json               # Progressive Web App manifest
├── sw.js                       # Service Worker for offline inspection capability
├── metadata.json               # AI Studio app metadata
├── package.json                # Dependencies and build scripts
├── vite.config.ts              # Vite configuration
├── README.md                   # Complete documentation
│
└── src/
    ├── main.tsx                # React DOM entry
    ├── App.tsx                 # Master state & view coordinator
    ├── index.css               # Tailwind v4 directives & print styles
    │
    ├── types/
    │   └── index.ts            # Complete TypeScript interfaces & enums
    │
    ├── services/
    │   ├── db.ts               # IndexedDB database engine with 11 stores
    │   ├── checklistTemplate.ts# Default room-by-room inspection checklists
    │   ├── comparison.ts       # Side-by-side diff & rating comparison engine
    │   ├── imageUtils.ts       # Canvas image compression & synthetic photo generator
    │   ├── demoData.ts         # 3 complete realistic properties & handover records
    │   └── backup.ts           # JSON backup packager & restore validator
    │
    └── components/
        ├── common/
        │   ├── Navbar.tsx      # Top nav with search, quick inspection CTA & alerts
        │   ├── Sidebar.tsx     # 11-section workspace navigation sidebar
        │   ├── StatusBadge.tsx # Light-and-gray styled condition indicators
        │   ├── Modal.tsx       # Accessible modal dialog wrapper
        │   ├── SignaturePad.tsx# HTML5 Canvas signature capture
        │   ├── PhotoUploader.tsx# Camera capture & file upload with local compression
        │   └── PhotoViewerModal.tsx # Lightbox photo viewer with metadata
        │
        └── views/
            ├── DashboardView.tsx         # Real-time KPI metrics & condition health
            ├── PropertiesView.tsx        # Property inventory & registration
            ├── PropertyDetailView.tsx    # Property overview, rooms & history
            ├── InspectionsView.tsx       # Inspection archive & starter
            ├── InspectionWorkflowView.tsx# Room-by-room audit engine
            ├── ComparisonView.tsx        # Side-by-side Before/After diff workspace
            ├── DamageRegisterView.tsx    # Defect register & status workflow
            ├── RepairsView.tsx           # Maintenance work orders & contractor tracking
            ├── HandoverReportView.tsx    # Printable PDF report generator & CSV export
            ├── DocumentsView.tsx         # Local document vault
            ├── ActivityHistoryView.tsx   # Tamper-evident activity trail
            └── SettingsView.tsx          # Full JSON backup, restore & demo seeder
```

---

## 4. Local Setup Instructions

### Prerequisites
- Node.js (version 18 or higher)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### Run with Vite Dev Server
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

### Windows 11 & VS Code Live Server
1. Clone or download the repository to your Windows 11 machine.
2. Open the project folder in **Visual Studio Code**.
3. Run `npm install` and `npm run build` in the integrated terminal (PowerShell).
4. Run `npm run preview` or serve the `dist/` directory via the **Live Server** extension.

---

## 5. IndexedDB Storage Architecture
LeaseProof uses a single IndexedDB database (`LeaseProof_DB`) with 11 distinct object stores:
1. `properties` (Indexed by `property_code`, `created_at`)
2. `rooms` (Indexed by `property_id`, `display_order`)
3. `inspections` (Indexed by `property_id`, `inspection_type`, `inspection_date`)
4. `inspection_items` (Indexed by `inspection_id`, `room_id`)
5. `photos` (Indexed by `property_id`, `inspection_id`, `room_id`, `inspection_item_id`)
6. `damages` (Indexed by `property_id`, `inspection_id`, `status`)
7. `repairs` (Indexed by `property_id`, `damage_id`, `status`)
8. `documents` (Indexed by `property_id`, `inspection_id`)
9. `signatures` (Indexed by `inspection_id`)
10. `activity_logs` (Indexed by `property_id`, `timestamp`)
11. `settings` (Application preferences & disclaimer)

---

## 6. Privacy & Legal Principles
- **No Remote Telemetry:** No user data, inspection logs, or photos are uploaded to any external server.
- **Legal Non-Adjudication Principle:** LeaseProof records objective, observed property condition. It does not automatically allocate deposit deductions or make legal determinations of fault.
- **Regular Backups:** Because browser storage is local, users are encouraged to use the built-in **Download Full Backup** feature in Settings to export portable `.json` archives regularly.
