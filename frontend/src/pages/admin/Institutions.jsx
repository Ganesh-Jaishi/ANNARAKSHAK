/**
 * Admin Institutions — National Registry & Performance Directory
 * Displays comprehensive facility records including contact details,
 * physical dispatch addresses, email, phone, FSSAI licensing, and ESG impact.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';

export default function AdminInstitutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [activeModal, setActiveModal] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    api.getAllInstitutions()
      .then(setInstitutions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const types = ['all', ...Array.from(new Set(institutions.map(i => i.type).filter(Boolean)))];

  const filtered = institutions.filter(i => {
    const q = search.toLowerCase();
    const matchesSearch =
      i.name?.toLowerCase().includes(q) ||
      i.city?.toLowerCase().includes(q) ||
      i.state?.toLowerCase().includes(q) ||
      i.district?.toLowerCase().includes(q) ||
      i.address?.toLowerCase().includes(q) ||
      i.contact_person?.toLowerCase().includes(q) ||
      i.email?.toLowerCase().includes(q) ||
      i.phone?.toLowerCase().includes(q) ||
      i.fssai_license?.toLowerCase().includes(q) ||
      i.type?.toLowerCase().includes(q);

    const matchesType = selectedType === 'all' || i.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalCapacity = institutions.reduce((acc, i) => acc + (i.capacity_kg_daily || 0), 0);
  const totalRescued = institutions.reduce((acc, i) => acc + (i.total_rescued_kg || 0), 0);
  const totalBeneficiaries = institutions.reduce((acc, i) => acc + (i.total_beneficiaries || 0), 0);

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Donor Facilities & Institution Directory</h2>
          <p className="page-subtitle">
            National registry of verified catering, canteen, hotel & commercial donors with direct contacts and locations
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            📋 Table
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('cards')}
            title="Cards View"
          >
            📇 Directory Cards
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="card-grid" style={{ marginBottom: '24px' }}>
        <div className="card stat-card">
          <div className="card-title">Verified Donors</div>
          <div className="stat-value">{institutions.length}</div>
          <div className="stat-label">Active FSSAI registered facilities</div>
          <div className="stat-icon">🏢</div>
        </div>

        <div className="card stat-card active">
          <div className="card-title">Cumulative Capacity</div>
          <div className="stat-value">{totalCapacity.toLocaleString()} kg</div>
          <div className="stat-label">Daily kitchen output volume</div>
          <div className="stat-icon">⚡</div>
        </div>

        <div className="card stat-card rescued">
          <div className="card-title">Rescued via Network</div>
          <div className="stat-value">{totalRescued.toLocaleString()} kg</div>
          <div className="stat-label">Redirected to verified food banks</div>
          <div className="stat-icon">🌱</div>
        </div>

        <div className="card stat-card impact">
          <div className="card-title">Citizens Nourished</div>
          <div className="stat-value">{totalBeneficiaries.toLocaleString()}</div>
          <div className="stat-label">Beneficiary meal portions served</div>
          <div className="stat-icon">🤝</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search facility name, liaison contact, email, phone, location, FSSAI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: '420px', padding: '8px 14px', fontSize: '0.85rem' }}
          />
          {search && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSearch('')}
              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Type Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
            Type:
          </span>
          {types.map((t) => (
            <button
              key={t}
              type="button"
              className={`btn btn-sm ${selectedType === t ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: '0.75rem', textTransform: 'capitalize' }}
              onClick={() => setSelectedType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏳</div>
          <p style={{ color: 'var(--text-muted)' }}>Loading verified institutional directory...</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Facility & Registration</th>
                <th>Primary Contact / Liaison</th>
                <th>Location & Dispatch Address</th>
                <th>Daily Capacity</th>
                <th>Rescue Efficiency</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inst) => (
                <tr key={inst.id}>
                  {/* Facility & Type */}
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {inst.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {inst.type}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {inst.fssai_license || 'Verified Partner'}
                      </span>
                    </div>
                  </td>

                  {/* Contact Person, Email, Phone */}
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      👤 {inst.contact_person || 'Operations Lead'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', fontSize: '0.78rem' }}>
                      {inst.email && (
                        <a
                          href={`mailto:${inst.email}`}
                          style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Click to compose email"
                        >
                          ✉️ {inst.email}
                        </a>
                      )}
                      {inst.phone && (
                        <a
                          href={`tel:${inst.phone}`}
                          style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Click to dial phone"
                        >
                          📞 {inst.phone}
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Location & Address */}
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.825rem' }}>
                      📍 {inst.address || `${inst.city}, ${inst.state}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {inst.district ? `${inst.district}, ` : ''}{inst.city}, {inst.state}
                    </div>
                    {inst.lat && inst.lng && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        GPS: {inst.lat.toFixed(4)}, {inst.lng.toFixed(4)}
                      </div>
                    )}
                  </td>

                  {/* Daily Capacity */}
                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {inst.capacity_kg_daily?.toLocaleString() || 0} kg
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>daily output volume</div>
                  </td>

                  {/* Rescue Efficiency */}
                  <td style={{ minWidth: '150px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="progress-bar" style={{ width: '80px', height: '6px' }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(100, inst.rescue_rate)}%`,
                            background:
                              inst.rescue_rate > 50
                                ? 'var(--safe)'
                                : inst.rescue_rate > 20
                                  ? 'var(--urgent)'
                                  : 'var(--critical)',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {inst.rescue_rate}%
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--safe-text)', fontWeight: 600, marginTop: '2px' }}>
                      {inst.total_rescued_kg?.toLocaleString()} kg rescued
                    </div>
                  </td>

                  {/* Action Button */}
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveModal(inst)}
                      title="View complete facility information and liaison contacts"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No donor facilities match the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* DIRECTORY CARDS VIEW */
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filtered.map((inst) => (
            <div key={inst.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{inst.name}</h4>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {inst.type}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {inst.fssai_license || 'FSSAI Verified'}
                  </span>
                </div>

                {/* Liaison Contact Box */}
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Primary Liaison
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    👤 {inst.contact_person || 'Operations Lead'}
                  </div>
                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {inst.email && (
                      <a href={`mailto:${inst.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        ✉️ {inst.email}
                      </a>
                    )}
                    {inst.phone && (
                      <a href={`tel:${inst.phone}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        📞 {inst.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Location Info */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    📍 Dispatch Location
                  </div>
                  <div>{inst.address}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    {inst.district ? `${inst.district}, ` : ''}{inst.city}, {inst.state}
                  </div>
                </div>

                {/* Stats row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    padding: '8px 0',
                    borderTop: '1px solid var(--border)',
                    marginBottom: '14px',
                    fontSize: '0.78rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Daily Capacity:</span>{' '}
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{inst.capacity_kg_daily} kg</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Rescue Rate:</span>{' '}
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--safe-text)' }}>{inst.rescue_rate}%</strong>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setActiveModal(inst)}
              >
                View Full Profile & Coordinates
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FULL INSTITUTION PROFILE MODAL */}
      {activeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '24px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
              aria-label="Close"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary-border)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                }}
              >
                🏢
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {activeModal.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="status-badge status-safe">Verified Donor</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    Type: {activeModal.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1: Contact Liaison Information */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                👤 Primary Contact Liaison & Authority
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Contact Person:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {activeModal.contact_person || 'Operations Lead'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Official Email:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <a
                      href={`mailto:${activeModal.email}`}
                      style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem' }}
                    >
                      {activeModal.email || 'N/A'}
                    </a>
                    {activeModal.email && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                        onClick={() => handleCopy(activeModal.email, 'email')}
                      >
                        {copiedField === 'email' ? '✓ Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Direct Phone:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <a
                      href={`tel:${activeModal.phone}`}
                      style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.85rem' }}
                    >
                      {activeModal.phone || 'N/A'}
                    </a>
                    {activeModal.phone && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                        onClick={() => handleCopy(activeModal.phone, 'phone')}
                      >
                        {copiedField === 'phone' ? '✓ Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>FSSAI Registration:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                    {activeModal.fssai_license || 'Verified Partner'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Physical Location & Dispatch Logistics */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                📍 Physical Address & Geo Logistics
              </div>

              <div style={{ display: 'grid', gap: '8px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Dispatch Address: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{activeModal.address}</strong>
                </div>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
                  <div>District: <strong style={{ color: 'var(--text-primary)' }}>{activeModal.district || 'Central'}</strong></div>
                  <div>City: <strong style={{ color: 'var(--text-primary)' }}>{activeModal.city}</strong></div>
                  <div>State: <strong style={{ color: 'var(--text-primary)' }}>{activeModal.state}</strong></div>
                </div>

                {activeModal.lat && activeModal.lng && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      GPS: {activeModal.lat.toFixed(5)}, {activeModal.lng.toFixed(5)}
                    </span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${activeModal.lat}&mlon=${activeModal.lng}#map=15/${activeModal.lat}/${activeModal.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: '0.725rem' }}
                    >
                      🗺️ Open in Map ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Performance & Rescue Audit */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Daily Capacity</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {activeModal.capacity_kg_daily} kg
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Rescued</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: 'var(--safe-text)', marginTop: '2px' }}>
                  {activeModal.total_rescued_kg} kg
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rescue Rate</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', marginTop: '2px' }}>
                  {activeModal.rescue_rate}%
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {activeModal.email && (
                <a href={`mailto:${activeModal.email}`} className="btn btn-primary btn-sm">
                  ✉️ Email
                </a>
              )}
              {activeModal.phone && (
                <a href={`tel:${activeModal.phone}`} className="btn btn-secondary btn-sm">
                  📞 Call
                </a>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => setActiveModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
