import React, { useState, useMemo } from 'react';
import { ClipboardCheck, Clock, MapPin, User, Camera, CheckCircle, XCircle, AlertCircle, RefreshCw, Download, Search, Filter, X, ChevronDown, ChevronUp, Trash2, FileText } from 'lucide-react';
import { deleteAbsensiApi, clearAllAbsensiApi } from '../services/api';
import { ModernMonthPicker, ModernFilterSelect } from './ModernDatePicker';

export default function AbsensiTab({ activeUser, absensiList, onRefresh }) {
  const [filterBulan, setFilterBulan] = useState('ALL'); // Default 'ALL' = Tampilkan Semua Periode (seluruh 41+ data database)
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'rekap'
  const [geoNames, setGeoNames] = useState({});

  React.useEffect(() => {
    // Only reverse geocode items missing lokasiNama, max 3 items concurrently to prevent Network Throttling / Slowdown
    const unmapped = (absensiList || []).filter(item => !item.lokasiNama && item.latitude && item.longitude && !geoNames[item.id]).slice(0, 3);
    unmapped.forEach(item => {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${item.latitude}&lon=${item.longitude}&zoom=16`, {
        headers: { 'User-Agent': 'SarenOneApp/1.0' }
      })
        .then(r => r.json())
        .then(data => {
          if (data?.address) {
            const a = data.address;
            const parts = [
              a.amenity || a.building || a.shop || a.road || a.pedestrian,
              a.suburb || a.village || a.quarter || a.neighbourhood || a.city_district,
              a.city || a.regency || a.town || a.county
            ].filter(Boolean);
            const locStr = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',');
            if (locStr) {
              setGeoNames(prev => ({ ...prev, [item.id]: locStr }));
            }
          }
        })
        .catch(() => {});
    });
  }, [absensiList, geoNames]);

  const getLocName = (item) => {
    if (!item) return '';
    if (item.lokasiNama) return item.lokasiNama;
    if (geoNames[item.id]) return geoNames[item.id];
    if (item.latitude && item.longitude) {
      return `${parseFloat(item.latitude).toFixed(4)}, ${parseFloat(item.longitude).toFixed(4)}`;
    }
    return '';
  };

  const canDelete = activeUser?.role === 'ADMIN_PRODUK';

  // Filter data
  const filtered = useMemo(() => {
    return (absensiList || []).filter(d => {
      if (!d) return false;
      const tgl = d.tanggal || (d.createdAt ? String(d.createdAt).substring(0, 10) : '');
      const matchBulan = !filterBulan || filterBulan === 'semua' || filterBulan === 'ALL' || (tgl && tgl.startsWith(filterBulan));
      
      const nama = d.name || d.nama || d.user || '';
      const matchName = !filterName || nama.toLowerCase().includes(filterName.toLowerCase());
      
      const tipe = d.type || d.tipe || '';
      const matchType = !filterType || tipe === filterType;
      
      return matchBulan && matchName && matchType;
    });
  }, [absensiList, filterBulan, filterName, filterType]);

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

  // Stats based on filtered data (or entire list)
  const statData = useMemo(() => {
    const dataToUse = filtered;
    const names = [...new Set(dataToUse.map(d => d.name || d.nama || d.user).filter(Boolean))];
    const ciCount = names.filter(n => dataToUse.some(d => (d.name || d.nama || d.user) === n && (d.type || d.tipe) === 'Check-In')).length;
    const coCount = names.filter(n => dataToUse.some(d => (d.name || d.nama || d.user) === n && (d.type || d.tipe) === 'Check-Out')).length;
    const pendingCount = Math.max(0, ciCount - coCount);
    return {
      sudahCheckIn: ciCount || dataToUse.filter(d => (d.type || d.tipe) === 'Check-In').length,
      sudahCheckOut: coCount || dataToUse.filter(d => (d.type || d.tipe) === 'Check-Out').length,
      belumCheckOut: pendingCount,
      totalPersonil: names.length || dataToUse.length
    };
  }, [filtered]);

  const { sudahCheckIn, sudahCheckOut, belumCheckOut, totalPersonil } = statData;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data absensi ini?')) return;
    try {
      const res = await deleteAbsensiApi(id);
      if (res?.success) {
        if (onRefresh) await onRefresh();
      } else {
        alert(res?.message || 'Gagal menghapus absensi');
      }
    } catch (e) {
      alert('Gagal menghapus: ' + e.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ WARNINIG: Apakah Anda yakin ingin MENGHAPUS SELURUH DATA ABSENSI dari Database MongoDB? Tindakan ini tidak dapat dibatalkan!')) return;
    try {
      const res = await clearAllAbsensiApi();
      if (res?.success) {
        alert('Seluruh data absensi di database MongoDB telah berhasil dikosongkan! 🗑️');
        if (onRefresh) await onRefresh();
      } else {
        alert(res?.message || 'Gagal mengosongkan absensi database.');
      }
    } catch (e) {
      alert('Gagal mengosongkan database: ' + e.message);
    }
  };

  const handleExportCSV = () => {
    if (!filtered.length) return alert('Tidak ada data untuk diexport.');
    const header = 'Nama,Tipe,Waktu,Tanggal,Lokasi,Keterangan,FotoUrl';
    const rows = filtered.map(d =>
      `"${d.name}","${d.type}","${d.time}","${d.tanggal}","${(d.lokasiNama || '').replace(/"/g, '""')}","${(d.keterangan || '').replace(/"/g, '""')}","${d.photoUrl || ''}"`
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
    <div className="tab-container" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* STATS CARDS RAMPING CLEAN WHITE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #10b981', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>SUDAH CHECK IN</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={15} style={{ color: '#10b981' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#047857', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {sudahCheckIn} <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800 }}>Personil</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #ef4444', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>SUDAH CHECK OUT</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={15} style={{ color: '#ef4444' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#be123c', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {sudahCheckOut} <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 800 }}>Personil</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #d97706', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>BELUM CHECK OUT</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={15} style={{ color: '#d97706' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#92400e', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {belumCheckOut > 0 ? belumCheckOut : 0} <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 800 }}>Personil</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #0284c7', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>TOTAL SPG / SALES</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={15} style={{ color: '#0284c7' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0369a1', marginTop: '0.2rem', lineHeight: 1.1 }}>
            {totalPersonil} <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 800 }}>Orang</span>
          </div>
        </div>
      </div>

      {/* VIEW TOGGLE & ACTIONS CARD */}
      <div style={{
        background: '#ffffff',
        padding: '0.65rem 0.85rem',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        marginBottom: '0.75rem',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('list')}
            style={{ fontSize: '0.78rem', fontWeight: 800, height: '32px', padding: '0 0.85rem', borderRadius: '7px' }}
          >
            📋 Log Semua Absensi
          </button>
          <button
            className={`btn ${viewMode === 'rekap' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('rekap')}
            style={{ fontSize: '0.78rem', fontWeight: 800, height: '32px', padding: '0 0.85rem', borderRadius: '7px' }}
          >
            👥 Rekap Per Orang
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ height: '32px', fontSize: '0.76rem', fontWeight: 700, padding: '0 0.75rem', borderRadius: '7px' }}
          >
            <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <button
            className="btn btn-outline"
            onClick={handleExportCSV}
            style={{ height: '32px', fontSize: '0.76rem', fontWeight: 700, padding: '0 0.75rem', borderRadius: '7px' }}
          >
            <Download size={13} /> Export CSV
          </button>
          {canDelete && (
            <button
              className="btn btn-outline-danger"
              onClick={handleClearAll}
              title="Hapus / Kosongkan Seluruh Data Absensi di Database MongoDB"
              style={{ height: '32px', fontSize: '0.76rem', fontWeight: 800, padding: '0 0.75rem', borderRadius: '7px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Trash2 size={13} /> Kosongkan Semua Data
            </button>
          )}
        </div>
      </div>

      {/* FILTER BAR CARD */}
      <div style={{
        background: '#ffffff',
        padding: '0.65rem 0.85rem',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        marginBottom: '1rem',
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <ModernMonthPicker
          value={filterBulan}
          onChange={setFilterBulan}
          allowAll={true}
          variant="primary"
        />

        <div className="search-box" style={{ flex: 1, minWidth: '220px', height: '34px' }}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Cari nama SPG/Sales..."
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
            style={{ fontSize: '0.78rem' }}
          />
        </div>

        {/* <ModernFilterSelect
          value={filterType}
          onChange={setFilterType}
          options={['Check-In', 'Check-Out']}
          placeholder="Semua Tipe"
          icon={Filter}
          maxWidth="150px"
        /> */}
{/* 
        {(filterName || filterType || (filterBulan && filterBulan !== 'ALL')) && (
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.74rem', height: '34px', padding: '0 0.65rem', borderRadius: '7px', fontWeight: 700 }}
            onClick={() => { setFilterName(''); setFilterType(''); setFilterBulan('ALL'); }}
          >
            <X size={13} /> Reset Filter
          </button>
        )} */}

        <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700, marginLeft: 'auto' }}>
          {filtered.length} Data Absensi
        </span>
      </div>

      {/* ===== LIST VIEW ===== */}
      {viewMode === 'list' && (
        <div className="table-responsive" style={{ borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <table className="custom-table" style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>NAMA SPG / SALES</th>
                <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>TIPE</th>
                <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>WAKTU</th>
                <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>TANGGAL</th>
                <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>LOKASI GPS</th>
                <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>KETERANGAN</th>
                <th style={{ padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>FOTO</th>
                {canDelete && <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? 8 : 7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 600 }}>
                    <ClipboardCheck size={32} style={{ display: 'block', margin: '0 auto 0.5rem', opacity: 0.3 }} />
                    Belum ada data absensi untuk filter ini.
                  </td>
                </tr>
              ) : filtered.map(item => {
                const displayName = item.name || item.nama || item.user || 'Sales';
                const displayType = item.type || item.tipe || 'Check-In';
                const displayTime = item.waktu || item.time || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString('id-ID') : '-');
                const displayDate = item.tanggal || (item.createdAt ? String(item.createdAt).substring(0, 10) : '-');
                const displayPhoto = item.photoUrl || item.foto;

                return (
                  <tr key={item.id || item._id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setSelectedItem(item)}>
                    <td style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {displayName.charAt(0)?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>{displayName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.1rem 0.45rem', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 800,
                        background: displayType === 'Check-In' ? '#ecfdf5' : '#fff1f2',
                        color: displayType === 'Check-In' ? '#047857' : '#be123c',
                        border: `1px solid ${displayType === 'Check-In' ? '#a7f3d0' : '#fecdd3'}`
                      }}>
                        {displayType === 'Check-In' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        {displayType}
                      </span>
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#475569', fontSize: '0.78rem', fontWeight: 700 }}>
                        <Clock size={12} style={{ color: '#0284c7' }} /> {displayTime}
                      </div>
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {displayDate}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>
                      {getLocName(item) ? (
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '5px', fontWeight: 700, textTransform: 'capitalize' }}
                          onClick={e => { e.stopPropagation(); openMaps(item.latitude, item.longitude); }}
                          title="Klik untuk buka lokasi di Maps"
                        >
                          <MapPin size={11} style={{ flexShrink: 0, color: '#0284c7' }} /> {getLocName(item)}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tidak ada GPS</span>
                      )}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.78rem', color: item.keterangan ? '#334155' : '#94a3b8', fontWeight: 600 }}>
                        {item.keterangan || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', whiteSpace: 'nowrap' }}>
                      {displayPhoto ? (
                        <img src={displayPhoto} alt="selfie"
                          style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                          onClick={e => { e.stopPropagation(); setSelectedItem(item); }}
                        />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    {canDelete && (
                      <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          style={{ height: '26px', fontSize: '0.68rem', padding: '0 0.45rem', borderRadius: '5px', fontWeight: 700 }}
                          onClick={() => handleDelete(item.id || item._id)}
                        >
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
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
                {getLocName(selectedItem) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <MapPin size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lokasi Absensi</div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {getLocName(selectedItem)}
                      </div>
                    </div>
                    {selectedItem.latitude && selectedItem.longitude && (
                      <button className="btn btn-outline" style={{ fontSize: '0.78rem' }}
                        onClick={() => openMaps(selectedItem.latitude, selectedItem.longitude)}>
                        Buka Maps
                      </button>
                    )}
                  </div>
                )}
                {selectedItem.keterangan && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <FileText size={16} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Keterangan / Catatan</div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedItem.keterangan}</div>
                    </div>
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
