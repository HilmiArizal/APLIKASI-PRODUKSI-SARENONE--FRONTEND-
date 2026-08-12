import React, { useState, useMemo } from 'react';
import { ClipboardCheck, Clock, MapPin, User, Camera, CheckCircle, XCircle, AlertCircle, RefreshCw, Download, Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AbsensiTab({ activeUser, absensiList, onRefresh }) {
  const [filterTanggal, setFilterTanggal] = useState(() => new Date().toISOString().substring(0, 10));
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'rekap'

  const canDelete = activeUser?.role === 'ADMIN_PRODUK';

  // Filter data
  const filtered = useMemo(() => {
    return (absensiList || []).filter(d => {
      const matchTanggal = !filterTanggal || d.tanggal === filterTanggal;
      const matchName = !filterName || d.name?.toLowerCase().includes(filterName.toLowerCase());
      const matchType = !filterType || d.type === filterType;
      return matchTanggal && matchName && matchType;
    });
  }, [absensiList, filterTanggal, filterName, filterType]);

  // Rekap: group by name (for today)
  const rekap = useMemo(() => {
    const grouped = {};
    filtered.forEach(item => {
      if (!grouped[item.name]) grouped[item.name] = { name: item.name, checkIn: null, checkOut: null, items: [] };
      grouped[item.name].items.push(item);
      if (item.type === 'Check-In' && !grouped[item.name].checkIn) grouped[item.name].checkIn = item;
      if (item.type === 'Check-Out') grouped[item.name].checkOut = item;
    });
    return Object.values(grouped);
  }, [filtered]);

  // Stats for today
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayData = useMemo(() => (absensiList || []).filter(d => d.tanggal === todayStr), [absensiList, todayStr]);
  const todayNames = [...new Set(todayData.map(d => d.name))];
  const sudahCheckIn = todayNames.filter(n => todayData.some(d => d.name === n && d.type === 'Check-In')).length;
  const sudahCheckOut = todayNames.filter(n => todayData.some(d => d.name === n && d.type === 'Check-Out')).length;
  const belumCheckOut = sudahCheckIn - sudahCheckOut;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data absensi ini?')) return;
    try {
      await fetch(`${API}/api/absensi/${id}`, { method: 'DELETE' });
      if (onRefresh) await onRefresh();
    } catch (e) {
      alert('Gagal menghapus: ' + e.message);
    }
  };

  const handleExportCSV = () => {
    if (!filtered.length) return alert('Tidak ada data untuk diexport.');
    const header = 'Nama,Tipe,Waktu,Tanggal,Latitude,Longitude,FotoUrl';
    const rows = filtered.map(d =>
      `"${d.name}","${d.type}","${d.time}","${d.tanggal}","${d.latitude || ''}","${d.longitude || ''}","${d.photoUrl || ''}"`
    ).join('\n');
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `absensi_${filterTanggal || 'semua'}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const openMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="tab-content">
      {/* HEADER */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardCheck size={20} style={{ color: 'var(--primary)' }} />
            Absensi SPG / Sales
          </h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Pantau data check in & check out tim lapangan secara real-time dari app mobile PresensiKu.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* STAT CARDS — HARI INI */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <CheckCircle size={20} style={{ color: '#10b981' }} />
          </div>
          <div>
            <div className="stat-value">{sudahCheckIn}</div>
            <div className="stat-label">Sudah Check In</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <XCircle size={20} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <div className="stat-value">{sudahCheckOut}</div>
            <div className="stat-label">Sudah Check Out</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(234,179,8,0.15)' }}>
            <AlertCircle size={20} style={{ color: '#eab308' }} />
          </div>
          <div>
            <div className="stat-value">{belumCheckOut > 0 ? belumCheckOut : 0}</div>
            <div className="stat-label">Belum Check Out</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <User size={20} style={{ color: '#6366f1' }} />
          </div>
          <div>
            <div className="stat-value">{todayNames.length}</div>
            <div className="stat-label">Total SPG/Sales Hari Ini</div>
          </div>
        </div>
      </div>

      {/* VIEW MODE TOGGLE */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setViewMode('list')}
          style={{ fontSize: '0.82rem' }}
        >
          📋 Log Semua Absensi
        </button>
        <button
          className={`btn ${viewMode === 'rekap' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setViewMode('rekap')}
          style={{ fontSize: '0.82rem' }}
        >
          👥 Rekap Per Orang
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="date"
            value={filterTanggal}
            onChange={e => setFilterTanggal(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', flex: 1, minWidth: '160px' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari nama SPG/Sales..."
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', width: '100%' }}
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="select-input"
          style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
        >
          <option value="">Semua Tipe</option>
          <option value="Check-In">Check-In</option>
          <option value="Check-Out">Check-Out</option>
        </select>
        {(filterName || filterType) && (
          <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            onClick={() => { setFilterName(''); setFilterType(''); }}>
            <X size={13} /> Reset
          </button>
        )}
        <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: 'auto' }}>
          {filtered.length} data
        </span>
      </div>

      {/* ===== LIST VIEW ===== */}
      {viewMode === 'list' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama SPG/Sales</th>
                <th>Tipe</th>
                <th>Waktu</th>
                <th>Tanggal</th>
                <th>Lokasi GPS</th>
                <th>Foto</th>
                {canDelete && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <ClipboardCheck size={32} style={{ display: 'block', margin: '0 auto 0.5rem', opacity: 0.3 }} />
                    Belum ada data absensi untuk filter ini.
                  </td>
                </tr>
              ) : filtered.map(item => (
                <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedItem(item)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {item.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                      background: item.type === 'Check-In' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: item.type === 'Check-In' ? '#10b981' : '#ef4444',
                      border: `1px solid ${item.type === 'Check-In' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                    }}>
                      {item.type === 'Check-In' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {item.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Clock size={13} /> {item.time}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.tanggal}</td>
                  <td>
                    {item.latitude && item.longitude ? (
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        onClick={e => { e.stopPropagation(); openMaps(item.latitude, item.longitude); }}
                      >
                        <MapPin size={12} /> {parseFloat(item.latitude).toFixed(4)}, {parseFloat(item.longitude).toFixed(4)}
                      </button>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>Tidak ada GPS</span>
                    )}
                  </td>
                  <td>
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt="selfie"
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); setSelectedItem(item); }}
                      />
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.78rem' }}>-</span>
                    )}
                  </td>
                  {canDelete && (
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-danger" style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => handleDelete(item.id)}>Hapus</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== REKAP VIEW ===== */}
      {viewMode === 'rekap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rekap.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <ClipboardCheck size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 0.75rem' }} />
              Belum ada data absensi untuk filter ini.
            </div>
          ) : rekap.map(r => (
            <div key={r.name} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {r.name?.charAt(0)?.toUpperCase()}
                </div>
                {/* Name & Status */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{r.name}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    {r.checkIn ? (
                      <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', borderRadius: 20, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle size={11} /> CI: {r.checkIn.time}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', borderRadius: 20, background: 'rgba(100,116,139,0.15)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                        Belum Check In
                      </span>
                    )}
                    {r.checkOut ? (
                      <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', borderRadius: 20, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <XCircle size={11} /> CO: {r.checkOut.time}
                      </span>
                    ) : r.checkIn ? (
                      <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', borderRadius: 20, background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' }}>
                        ⏳ Masih di Lapangan
                      </span>
                    ) : null}
                  </div>
                </div>
                {/* Foto CI */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {r.checkIn?.photoUrl && (
                    <div style={{ textAlign: 'center' }}>
                      <img src={r.checkIn.photoUrl} alt="CI" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '2px solid #10b981', cursor: 'pointer' }}
                        onClick={() => setSelectedItem(r.checkIn)} />
                      <div style={{ fontSize: '0.65rem', color: '#10b981', marginTop: 2 }}>CI</div>
                    </div>
                  )}
                  {r.checkOut?.photoUrl && (
                    <div style={{ textAlign: 'center' }}>
                      <img src={r.checkOut.photoUrl} alt="CO" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '2px solid #ef4444', cursor: 'pointer' }}
                        onClick={() => setSelectedItem(r.checkOut)} />
                      <div style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: 2 }}>CO</div>
                    </div>
                  )}
                </div>
                {/* GPS */}
                {r.checkIn?.latitude && (
                  <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    onClick={() => openMaps(r.checkIn.latitude, r.checkIn.longitude)}>
                    <MapPin size={12} /> Lihat Lokasi
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-card" style={{ maxWidth: 480, width: '92vw' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={18} style={{ color: 'var(--primary)' }} />
                Detail Absensi — {selectedItem.type}
              </h3>
              <button className="btn btn-outline" style={{ padding: '0.3rem 0.5rem' }} onClick={() => setSelectedItem(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.25rem' }}>
              {/* Foto */}
              {selectedItem.photoUrl ? (
                <img src={selectedItem.photoUrl} alt="Foto Selfie"
                  style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 12, marginBottom: '1rem', border: '1px solid var(--border-color)' }} />
              ) : (
                <div style={{ width: '100%', height: 180, background: 'var(--bg-card)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                  <Camera size={40} style={{ opacity: 0.2 }} />
                </div>
              )}

              {/* Info Grid */}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <User size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nama SPG/Sales</div>
                    <div style={{ fontWeight: 700 }}>{selectedItem.name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <Clock size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Waktu & Tanggal</div>
                    <div style={{ fontWeight: 700 }}>{selectedItem.time}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedItem.tanggal}</div>
                  </div>
                </div>
                {selectedItem.latitude && selectedItem.longitude && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <MapPin size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lokasi GPS</div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {parseFloat(selectedItem.latitude).toFixed(6)}, {parseFloat(selectedItem.longitude).toFixed(6)}
                      </div>
                    </div>
                    <button className="btn btn-outline" style={{ fontSize: '0.78rem' }}
                      onClick={() => openMaps(selectedItem.latitude, selectedItem.longitude)}>
                      Buka Maps
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: selectedItem.type === 'Check-In' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', border: `1px solid ${selectedItem.type === 'Check-In' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                  {selectedItem.type === 'Check-In' ? <CheckCircle size={16} style={{ color: '#10b981' }} /> : <XCircle size={16} style={{ color: '#ef4444' }} />}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status Absensi</div>
                    <div style={{ fontWeight: 700, color: selectedItem.type === 'Check-In' ? '#10b981' : '#ef4444' }}>{selectedItem.type}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
