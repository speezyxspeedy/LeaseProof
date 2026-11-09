import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  User,
  ArrowRight,
  Trash2,
  Edit2,
  Archive,
} from 'lucide-react';
import { Property, PropertyType, FurnishingType } from '../../types';
import { Modal } from '../common/Modal';
import { dbService } from '../../services/db';

interface PropertiesViewProps {
  properties: Property[];
  onSelectProperty: (id: string) => void;
  onRefreshProperties: () => Promise<void>;
  onNewInspection: (propertyId: string) => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  properties,
  onSelectProperty,
  onRefreshProperties,
  onNewInspection,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'NAME'>('NEWEST');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('Apartment');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [roomsCount, setRoomsCount] = useState(3);
  const [bathroomsCount, setBathroomsCount] = useState(1);
  const [furnishingType, setFurnishingType] = useState<FurnishingType>('Unfurnished');
  const [ownerName, setOwnerName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [rentalStartDate, setRentalStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState<number | ''>('');
  const [securityDeposit, setSecurityDeposit] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingProperty(null);
    setName('');
    setPropertyType('Apartment');
    setAddress('');
    setCity('');
    setState('');
    setPostalCode('');
    setRoomsCount(3);
    setBathroomsCount(1);
    setFurnishingType('Unfurnished');
    setOwnerName('');
    setTenantName('');
    setRentalStartDate('');
    setExpectedEndDate('');
    setMonthlyRent('');
    setSecurityDeposit('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (prop: Property, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProperty(prop);
    setName(prop.name);
    setPropertyType(prop.property_type);
    setAddress(prop.address);
    setCity(prop.city);
    setState(prop.state);
    setPostalCode(prop.postal_code);
    setRoomsCount(prop.rooms_count);
    setBathroomsCount(prop.bathrooms_count);
    setFurnishingType(prop.furnishing_type);
    setOwnerName(prop.owner_name);
    setTenantName(prop.tenant_name || '');
    setRentalStartDate(prop.rental_start_date || '');
    setExpectedEndDate(prop.expected_end_date || '');
    setMonthlyRent(prop.monthly_rent || '');
    setSecurityDeposit(prop.security_deposit || '');
    setNotes(prop.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !ownerName.trim()) {
      alert('Please fill in Property Name, Address, and Owner Name.');
      return;
    }

    const currentYear = new Date().getFullYear();
    const nextCode = `LP-${currentYear}-${String(properties.length + 1).padStart(4, '0')}`;

    const propData: Property = {
      id: editingProperty ? editingProperty.id : 'prop_' + Date.now(),
      property_code: editingProperty ? editingProperty.property_code : nextCode,
      name: name.trim(),
      property_type: propertyType,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      postal_code: postalCode.trim(),
      rooms_count: Number(roomsCount) || 1,
      bathrooms_count: Number(bathroomsCount) || 1,
      furnishing_type: furnishingType,
      owner_name: ownerName.trim(),
      tenant_name: tenantName.trim() || undefined,
      rental_start_date: rentalStartDate || undefined,
      expected_end_date: expectedEndDate || undefined,
      monthly_rent: monthlyRent !== '' ? Number(monthlyRent) : undefined,
      security_deposit: securityDeposit !== '' ? Number(securityDeposit) : undefined,
      notes: notes.trim() || undefined,
      created_at: editingProperty ? editingProperty.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_demo: editingProperty ? editingProperty.is_demo : false,
    };

    await dbService.saveProperty(propData);

    // If new property, automatically seed default rooms
    if (!editingProperty) {
      const defaultRooms = [
        { name: 'Living Room', type: 'Living Room' },
        { name: 'Master Bedroom', type: 'Bedroom' },
        { name: 'Kitchen', type: 'Kitchen' },
        { name: 'Bathroom', type: 'Bathroom' },
      ];
      for (let i = 0; i < defaultRooms.length; i++) {
        await dbService.saveRoom({
          id: `room_${propData.id}_${i}`,
          property_id: propData.id,
          room_name: defaultRooms[i].name,
          room_type: defaultRooms[i].type as any,
          description: `Primary ${defaultRooms[i].name} area`,
          display_order: i + 1,
          created_at: new Date().toISOString(),
        });
      }
    }

    await onRefreshProperties();
    setIsModalOpen(false);
  };

  const handleDeleteProperty = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete property "${name}"? Linked inspections will remain intact or can be cleaned up.`)) {
      await dbService.deleteProperty(id);
      await onRefreshProperties();
    }
  };

  // Filter & Sort
  const filtered = properties
    .filter((p) => {
      const matchQuery =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.property_code.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'ALL' || p.property_type === filterType;
      return matchQuery && matchType;
    })
    .sort((a, b) => {
      if (sortBy === 'NAME') return a.name.localeCompare(b.name);
      if (sortBy === 'OLDEST') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Property Portfolio</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage real-estate assets, customize room checklists, and initiate handover inspections.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Register New Property</span>
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
            placeholder="Search by property name, code (LP-...), street or city..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-slate-600 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Type:</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Types ({properties.length})</option>
            <option value="Apartment">Apartment</option>
            <option value="Independent House">Independent House</option>
            <option value="Villa">Villa</option>
            <option value="Commercial Shop">Commercial Shop</option>
            <option value="Office">Office</option>
            <option value="Warehouse">Warehouse</option>
            <option value="PG / Hostel">PG / Hostel</option>
            <option value="Other">Other</option>
          </select>

          <span className="text-slate-300">|</span>

          <span className="text-slate-600 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="NAME">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Properties Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No properties match your filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or register a new property in your local vault.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" /> Register Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((prop) => (
            <div
              key={prop.id}
              onClick={() => onSelectProperty(prop.id)}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Top badges */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {prop.property_code}
                  </span>
                  <div className="flex items-center gap-1">
                    {prop.is_demo && (
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        Demo
                      </span>
                    )}
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {prop.property_type}
                    </span>
                  </div>
                </div>

                {/* Title & Address */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                    {prop.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{prop.address}, {prop.city}</span>
                  </p>
                </div>

                {/* Spec Pills */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center text-xs">
                  <div className="bg-slate-50 p-1.5 rounded">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Rooms</div>
                    <div className="font-bold text-slate-800">{prop.rooms_count}</div>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Baths</div>
                    <div className="font-bold text-slate-800">{prop.bathrooms_count}</div>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Furnished</div>
                    <div className="font-bold text-slate-800 truncate text-[11px]">{prop.furnishing_type}</div>
                  </div>
                </div>

                {/* Tenancy & Financials */}
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <User className="w-3.5 h-3.5" /> Tenant:
                    </span>
                    <span className="font-medium text-slate-900">{prop.tenant_name || 'Vacant / Pending'}</span>
                  </div>
                  {prop.monthly_rent && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Monthly Rent:</span>
                      <span className="font-bold text-slate-900">${prop.monthly_rent.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => openEditModal(prop, e)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                    title="Edit Property Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteProperty(prop.id, prop.name, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Delete Property"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewInspection(prop.id);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors"
                  >
                    Inspect
                  </button>
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProperty ? `Edit ${editingProperty.property_code}` : 'Register New Property'}
        subtitle="Saved purely in your local browser vault. No cloud dependencies."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveProperty} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Property Name / Unit Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Oakridge Heights Apt 3C"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Property Type *</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="Apartment">Apartment</option>
                <option value="Independent House">Independent House</option>
                <option value="Villa">Villa</option>
                <option value="Commercial Shop">Commercial Shop</option>
                <option value="Office">Office</option>
                <option value="Warehouse">Warehouse</option>
                <option value="PG / Hostel">PG / Hostel</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Street Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 742 Evergreen Terrace"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Springfield"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">State / Province</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="OR"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="97477"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Number of Rooms</label>
              <input
                type="number"
                min="1"
                max="50"
                value={roomsCount}
                onChange={(e) => setRoomsCount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Bathrooms</label>
              <input
                type="number"
                min="0"
                max="20"
                value={bathroomsCount}
                onChange={(e) => setBathroomsCount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Furnishing Status</label>
              <select
                value={furnishingType}
                onChange={(e) => setFurnishingType(e.target.value as FurnishingType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="Unfurnished">Unfurnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Fully Furnished">Fully Furnished</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Owner / Landlord Name *</label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Jonathan Smith"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tenant Name (Optional)</label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="e.g. Alice Johnson"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Rental Start Date</label>
              <input
                type="date"
                value={rentalStartDate}
                onChange={(e) => setRentalStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Expected End Date</label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Monthly Rent ($)</label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="2000"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Security Deposit ($)</label>
              <input
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="4000"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Additional Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Master key code, meter locations, parking bay #14..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              {editingProperty ? 'Save Property' : 'Register Property'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
