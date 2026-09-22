import React, { useState, useMemo } from 'react';
import { Boxes, Search, AlertTriangle, Plus, Edit3, ArrowUpRight, ArrowDownRight, Package, Tag, Check, X, RefreshCw, Star, Upload, FileSpreadsheet, Calendar } from 'lucide-react';
import { formatNumber, getSkuSortIndex } from '../data/initialData';
import { ModernDatePicker, ModernFilterSelect } from './ModernDatePicker';
import { ModalImportStokAwalExcel } from './Modals';

const formatRp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');

export default function StokProdukSalesTab({
  produkSalesList = [],
  brandList = [],
  hasilProduksi = [],
  penjualanList = [],
  returList = [],
  activeRoleView,
  onUpdateProdukSales,
  onImportStokAwalProduk,
  showAlert
}) {
  const todayStr = new Date().toISOString().substring(0, 10);

  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [stokFilter, setStokFilter] = useState('ALL'); // 'ALL', 'LOW', 'READY'
  const [filterTanggal, setFilterTanggal] = useState(todayStr);
  const [isImportStokAwalOpen, setIsImportStokAwalOpen] = useState(false);

  // Modal Stock Adjustment State
  const [selectedProduk, setSelectedProduk] = useState(null);
  const [adjustType, setAdjustType] = useState('MASUK'); // 'MASUK' (Tambah), 'KELUAR' (Kurangi), 'SET' (Set Exact)
  const [adjustJumlah, setAdjustJumlah] = useState(0);
  const [adjustCatatan, setAdjustCatatan] = useState('');

  const canEdit = ['ADMIN_PRODUK', 'TIM_PENJUALAN', 'SALES', 'ADMIN'].includes(activeRoleView);

  const safeBrandList = useMemo(() => {
    if (!Array.isArray(brandList)) return [];
    return brandList
      .filter(Boolean)
      .map(b => typeof b === 'string' ? { id: b, nama: b } : b)
      .filter(b => b && b.nama && !['Saren Bakery', 'Saren Frozen', 'Dapur Saren', 'Saren One Original'].includes(b.nama));
  }, [brandList]);

  // Kalkulasi Timeline Stok Per-Tanggal Continuously (Stok Awal = Stok Akhir H-1)
  const getProdukDailyTimeline = (p, targetDateStr) => {
    if (!p) return { stokAwal: 0, pembelians: 0, penjualans: 0, stokAkhir: 0 };
    const targetDate = targetDateStr || todayStr;
    const pSku = String(p.sku || p.kode || '').trim().toUpperCase();

    let currentStock = 0;
    const targetPeriode = targetDate ? targetDate.substring(0, 7) : '2026-08';
    const periodStokLocal = localStorage.getItem(`STOK_AWAL_PRODUK_${targetPeriode}_${pSku}`);
    const generalStokLocal = localStorage.getItem('STOK_AWAL_PRODUK_' + pSku);

    if (p.stokAwalMap && p.stokAwalMap[targetPeriode] !== undefined && p.stokAwalMap[targetPeriode] !== null && !isNaN(Number(p.stokAwalMap[targetPeriode]))) {
      currentStock = Number(p.stokAwalMap[targetPeriode]);
    } else if (periodStokLocal !== null && !isNaN(Number(periodStokLocal))) {
      currentStock = Number(periodStokLocal);
    } else if (p.stokAwal !== undefined && p.stokAwal !== null && !isNaN(Number(p.stokAwal))) {
      currentStock = Number(p.stokAwal);
    } else if (generalStokLocal !== null && !isNaN(Number(generalStokLocal))) {
      currentStock = Number(generalStokLocal);
    } else {
      currentStock = Number(p.stokReady) || 0;
    }

    if (!targetDate) {
      return { stokAwal: currentStock, pembelians: 0, penjualans: 0, stokAkhir: currentStock };
    }

    const startDate = `${targetPeriode}-01`;
    let runStokAwal = currentStock;
    let runPembelians = 0;
    let runPenjualans = 0;
    let runStokAkhir = currentStock;

    // Iterasi dari tanggal 01 sampai targetDate
    let currLoopDate = new Date(startDate);
    const endDate = new Date(targetDate);

    while (currLoopDate <= endDate) {
      const loopStr = currLoopDate.toISOString().substring(0, 10);

      // Hitung Pembelian (Hasil Produksi Dapur) di tanggal loopStr
      const dayPembelians = (hasilProduksi || []).reduce((acc, hp) => {
        const hpDate = String(hp.tanggal || '').substring(0, 10);
        if (hpDate === loopStr) {
          const matchSku = String(hp.kode || hp.alias || hp.produkId || hp.produkNama || '').trim().toLowerCase();
          const pNameLower = String(p.namaProduk || p.nama || '').trim().toLowerCase();
          const pSkuLower = String(p.sku || p.kode || '').trim().toLowerCase();
          const pAliasLower = String(p.alias || '').trim().toLowerCase();

          if (matchSku === pSkuLower || matchSku === pAliasLower || (pNameLower && matchSku.includes(pNameLower)) || (matchSku && pNameLower.includes(matchSku))) {
            return acc + (Number(hp.jumlahPcs) || 0);
          }
        }
        return acc;
      }, 0);

      // Hitung Penjualan di tanggal loopStr
      const dayPenjualans = (penjualanList || []).reduce((acc, pj) => {
        const pjDate = String(pj.tanggal || pj.tanggalInvoice || '').substring(0, 10);
        if (pjDate === loopStr) {
          const items = pj.items || pj.produkList || [];
          items.forEach(it => {
            const itKey = String(it.produkId || it.kode || it.sku || it.namaProduk || '').trim().toLowerCase();
            const pNameLower = String(p.namaProduk || p.nama || '').trim().toLowerCase();
            const pSkuLower = String(p.sku || p.kode || '').trim().toLowerCase();
            const pAliasLower = String(p.alias || '').trim().toLowerCase();

            if (itKey === pSkuLower || itKey === pAliasLower || (pNameLower && itKey.includes(pNameLower)) || (itKey && pNameLower.includes(itKey))) {
              acc += (Number(it.jumlah || it.qty || it.jumlahPcs) || 0);
            }
          });
        }
        return acc;
      }, 0);

      // Hitung Retur (Penerimaan: Stok + & Pengembalian: Stok -) di tanggal loopStr
      let dayReturMasuk = 0;
      let dayReturKeluar = 0;

      (returList || []).forEach(r => {
        const rDate = String(r.tanggal || r.createdAt || '').substring(0, 10);
        if (rDate === loopStr) {
          const items = r.items || [];
          items.forEach(it => {
            const itKey = String(it.produkId || it.kode || it.sku || it.namaProduk || '').trim().toLowerCase();
            const pNameLower = String(p.namaProduk || p.nama || '').trim().toLowerCase();
            const pSkuLower = String(p.sku || p.kode || '').trim().toLowerCase();
            const pAliasLower = String(p.alias || '').trim().toLowerCase();

            if (itKey === pSkuLower || itKey === pAliasLower || (pNameLower && itKey.includes(pNameLower)) || (itKey && pNameLower.includes(itKey))) {
              const q = Number(it.qty || it.jumlah || 0);
              if (r.tipeRetur === 'PENGEMBALIAN') {
                dayReturKeluar += q;
              } else {
                dayReturMasuk += q;
              }
            }
          });
        }
      });

      if (loopStr === targetDate) {
        runPembelians = dayPembelians;
        runPenjualans = dayPenjualans;
        runStokAkhir = runStokAwal + dayPembelians - dayPenjualans + dayReturMasuk - dayReturKeluar;
        break;
      }

      runStokAwal = runStokAwal + dayPembelians - dayPenjualans + dayReturMasuk - dayReturKeluar;
      currLoopDate.setDate(currLoopDate.getDate() + 1);
    }

    return {
      stokAwal: runStokAwal,
      pembelians: runPembelians,
      penjualans: runPenjualans,
      stokAkhir: Math.max(0, runStokAkhir)
    };
  };

  // Process and sort products naturally by numerical SKU (P1, P2, P3, ... P39)
  const processedList = useMemo(() => {
    const list = produkSalesList.map(p => {
      const timeline = getProdukDailyTimeline(p, filterTanggal);
      return {
        ...p,
        timeline
      };
    });

    return list.sort((a, b) => getSkuSortIndex(a.sku) - getSkuSortIndex(b.sku));
  }, [produkSalesList, filterTanggal, hasilProduksi, penjualanList, returList]);

  const filtered = useMemo(() => {
    return processedList.filter(p => {
      const q = search.toLowerCase();
      const matchQ = !search || p.namaProduk?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
      const matchB = !brandFilter || p.brand === brandFilter;

      const stokVal = Number(p.timeline.stokAkhir);
      let matchS = true;
      if (stokFilter === 'LOW') matchS = stokVal < 20;
      else if (stokFilter === 'READY') matchS = stokVal >= 20;

      return matchQ && matchB && matchS;
    });
  }, [processedList, search, brandFilter, stokFilter]);

  const totalItem = filtered.length;
  const totalStokPcs = useMemo(() => filtered.reduce((s, p) => s + (Number(p.timeline.stokAkhir) || 0), 0), [filtered]);
  const lowStockItems = useMemo(() => filtered.filter(p => (Number(p.timeline.stokAkhir) || 0) < 20), [filtered]);
  
  const totalNilaiPersediaanModal = useMemo(() => filtered.reduce((s, p) => {
    const stokAkhir = Number(p.timeline.stokAkhir) || 0;
    const hpp = Number(p.hargaModal || p.hargaPabrik || p.hargaJual || 0);
    return s + (stokAkhir * hpp);
  }, 0), [filtered]);

  const openAdjustModal = (p, type = 'MASUK') => {
    setSelectedProduk(p);
    setAdjustType(type);
    setAdjustJumlah(0);
    setAdjustCatatan('');
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduk) return;

    const currentStok = Number(selectedProduk.timeline.stokAkhir) || 0;
    const qty = Number(adjustJumlah) || 0;

    if (qty <= 0) {
      if (showAlert) showAlert('Jumlah stok harus lebih besar dari 0!', 'error');
      return;
    }

    let newStok = currentStok;
    if (adjustType === 'MASUK') newStok = currentStok + qty;
    else if (adjustType === 'KELUAR') {
      if (qty > currentStok) {
        if (showAlert) showAlert('Pengurangan stok melebihi stok ready yang ada!', 'error');
        return;
      }
      newStok = currentStok - qty;
    } else if (adjustType === 'SET') newStok = qty;

    const newStatus = newStok === 0 ? 'Stok Habis' : 'Tersedia';

    if (onUpdateProdukSales) {
      await onUpdateProdukSales(selectedProduk.id || selectedProduk._id, {
        ...selectedProduk,
        stokReady: newStok,
        status: newStatus
      });
      if (showAlert) showAlert(`Stok produk "${selectedProduk.namaProduk}" diperbarui menjadi ${newStok} Pcs!`, 'success');
    }

    setSelectedProduk(null);
  };

  const handleImportStokAwalSubmit = async (data, periodeKey, periodeLabel) => {
    try {
      if (onImportStokAwalProduk) {
        await onImportStokAwalProduk(data, periodeKey, periodeLabel);
      } else {
        // Fallback simpan ke local storage
        data.forEach(item => {
          const skuStr = String(item.sku || '').toUpperCase();
          if (skuStr && item.stokAwal !== undefined) {
            localStorage.setItem(`STOK_AWAL_PRODUK_${periodeKey}_${skuStr}`, String(item.stokAwal));
            localStorage.setItem(`STOK_AWAL_PRODUK_${skuStr}`, String(item.stokAwal));
          }
        });
        if (showAlert) showAlert(`Stok Awal Bulan Produk periode ${periodeLabel} berhasil diimpor & disimpan!`, 'success', 'Import Stok Awal Berhasil! 📦');
      }
    } catch (err) {
      if (showAlert) showAlert('Gagal mengimpor Stok Awal Produk: ' + err.message, 'error');
    }
  };

  return (
    <div className="tab-container" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* BARIS KONTROL TANGGAL & IMPORT STOK AWAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        <ModernDatePicker
          value={filterTanggal}
          onChange={setFilterTanggal}
          variant="primary"
        />

        {canEdit && (
          <button
            className="btn btn-emerald"
            onClick={() => setIsImportStokAwalOpen(true)}
            style={{ height: '34px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.85rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <FileSpreadsheet size={15} /> Import Stok Awal Bulan
          </button>
        )}
      </div>

      {/* STATS CARDS COMPACT 2 BARIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #0284c7', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            TOTAL STOK READY
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Boxes size={15} style={{ color: '#0284c7' }} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
              {formatNumber(totalStokPcs)} <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 800 }}>Pcs</span>
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #ef4444', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            STOK MENIPIS (&lt;20 PCS)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={15} style={{ color: '#ef4444' }} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: lowStockItems.length > 0 ? '#dc2626' : '#0f172a', lineHeight: 1.1 }}>
              {lowStockItems.length} <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 800 }}>SKU</span>
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: '3.5px solid #059669', borderRadius: '10px', padding: '0.65rem 0.85rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            NILAI ASSET PERSEDIAAN
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Package size={15} style={{ color: '#059669' }} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#047857', lineHeight: 1.1 }}>
              {formatRp(totalNilaiPersediaanModal)}
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR SEARCH & FILTER */}
      <div style={{ background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-box" style={{ flex: 1, minWidth: '220px', height: '32px' }}>
          <Search size={14} />
          <input placeholder="Cari SKU, nama produk, atau brand..." value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: '0.76rem' }} />
        </div>

        <ModernFilterSelect
          value={brandFilter}
          onChange={setBrandFilter}
          options={safeBrandList}
          placeholder="Semua Brand"
          icon={Tag}
          maxWidth="170px"
        />
      </div>

      {/* TABLE STOK PER-TANGGAL */}
      <div className="table-responsive" style={{ borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <table className="custom-table" style={{ width: '100%', fontSize: '0.73rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0', fontSize: '0.7rem' }}>
              <th style={{ padding: '0.35rem 0.5rem', whiteSpace: 'nowrap', width: '45px' }}>SKU</th>
              <th style={{ padding: '0.35rem 0.5rem', whiteSpace: 'nowrap' }}>NAMA PRODUK PERSEDIAAN</th>
              <th style={{ padding: '0.35rem 0.5rem', whiteSpace: 'nowrap' }}>BRAND</th>
              <th style={{ padding: '0.35rem 0.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>HARGA MODAL HPP</th>
              <th style={{ padding: '0.35rem 0.5rem', textAlign: 'right', background: '#f1f5f9', color: '#475569', whiteSpace: 'nowrap' }}>STOK AWAL</th>
              <th style={{ padding: '0.35rem 0.5rem', textAlign: 'right', background: '#ecfdf5', color: '#047857', whiteSpace: 'nowrap' }}>PEMBELIAN (+)</th>
              <th style={{ padding: '0.35rem 0.5rem', textAlign: 'right', background: '#fff1f2', color: '#be123c', whiteSpace: 'nowrap' }}>PENJUALAN (-)</th>
              <th style={{ padding: '0.35rem 0.5rem', textAlign: 'right', background: '#e0f2fe', color: '#0369a1', fontWeight: 900, whiteSpace: 'nowrap' }}>STOK AKHIR </th>
              <th style={{ padding: '0.35rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>STATUS</th>
              {canEdit && <th style={{ padding: '0.35rem 0.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 10 : 9} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontWeight: 600 }}>
                  Tidak ada data persediaan produk yang sesuai filter.
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const stokAwalVal = p.timeline.stokAwal;
                const pembeliansVal = p.timeline.pembelians;
                const penjualansVal = p.timeline.penjualans;
                const stokAkhirVal = p.timeline.stokAkhir;
                const isLow = stokAkhirVal < 20;
                const hpp = Number(p.hargaModal || p.hargaPabrik || p.hargaJual || 0);

                return (
                  <tr key={p.id || p._id || p.sku} style={{ borderBottom: '1px solid #f1f5f9', background: isLow ? '#fff1f2' : 'transparent' }}>
                    <td style={{ padding: '0.3rem 0.5rem', whiteSpace: 'nowrap' }}>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.68rem', fontWeight: 800, padding: '0.08rem 0.35rem', borderRadius: '4px' }}>
                        {p.sku}
                      </span>
                    </td>
                    <td style={{ padding: '0.3rem 0.5rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {p.namaProduk}
                    </td>
                    <td style={{ padding: '0.3rem 0.5rem', whiteSpace: 'nowrap' }}>
                      <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontSize: '0.66rem', fontWeight: 800, padding: '0.08rem 0.35rem', borderRadius: '4px' }}>
                        🏷️ {p.brand || 'SAREN ONE'}
                      </span>
                    </td>
                    <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>
                      {formatRp(hpp)}
                    </td>
                    <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#475569', background: '#f8fafc', whiteSpace: 'nowrap' }}>
                      {formatNumber(stokAwalVal)} Pcs
                    </td>
                    <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right', fontWeight: 800, color: pembeliansVal > 0 ? '#059669' : '#94a3b8', background: '#f0fdf4', whiteSpace: 'nowrap' }}>
                      {pembeliansVal > 0 ? `+${formatNumber(pembeliansVal)}` : '0'} Pcs
                    </td>
                    <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right', fontWeight: 800, color: penjualansVal > 0 ? '#dc2626' : '#94a3b8', background: '#fff1f2', whiteSpace: 'nowrap' }}>
                      {penjualansVal > 0 ? `-${formatNumber(penjualansVal)}` : '0'} Pcs
                    </td>
                    <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right', fontWeight: 900, fontSize: '0.82rem', color: isLow ? '#dc2626' : '#0369a1', background: '#f0f9ff', whiteSpace: 'nowrap' }}>
                      {formatNumber(stokAkhirVal)} Pcs
                    </td>
                    <td style={{ padding: '0.3rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {isLow ? (
                        <span style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontSize: '0.64rem', fontWeight: 800, padding: '0.08rem 0.35rem', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <AlertTriangle size={11} /> Menipis
                        </span>
                      ) : (
                        <span style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', fontSize: '0.64rem', fontWeight: 800, padding: '0.08rem 0.35rem', borderRadius: '5px' }}>
                          ✓ Aman
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => openAdjustModal(p, 'MASUK')}
                            title="Adjust Stok Ready"
                            style={{ height: '24px', fontSize: '0.68rem', padding: '0 0.45rem', borderRadius: '5px', fontWeight: 700 }}
                          >
                            <Plus size={12} style={{ color: '#10b981' }} /> Adjust
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL IMPORT STOK AWAL PRODUK */}
      <ModalImportStokAwalExcel
        isOpen={isImportStokAwalOpen}
        onClose={() => setIsImportStokAwalOpen(false)}
        onImportStokAwal={handleImportStokAwalSubmit}
        bahanBaku={produkSalesList.map(p => ({ sku: p.sku, nama: p.namaProduk, hargaAwal: p.hargaModal }))}
        showAlert={showAlert}
      />

      {/* MODAL ADJUSTMENT STOK */}
      {selectedProduk && (
        <div className="modal-overlay" onClick={() => setSelectedProduk(null)}>
          <div className="modal-card modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Boxes size={20} style={{ color: 'var(--accent-primary)' }} /> Penyesuaian Stok Produk</h3>
              <button className="modal-close" onClick={() => setSelectedProduk(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveAdjustment}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Produk:</div>
                  <strong style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block', margin: '2px 0 6px' }}>{selectedProduk.namaProduk}</strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                    <span style={{ color: '#64748b' }}>Stok Akhir ({filterTanggal}):</span>
                    <strong style={{ color: '#10b981' }}>{selectedProduk.timeline?.stokAkhir || 0} Pcs</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Jenis Penyesuaian *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustType === 'MASUK' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setAdjustType('MASUK')}
                    >
                      ➕ Tambah
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustType === 'KELUAR' ? 'btn-danger' : 'btn-outline'}`}
                      onClick={() => setAdjustType('KELUAR')}
                    >
                      ➖ Kurang
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${adjustType === 'SET' ? 'btn-secondary' : 'btn-outline'}`}
                      onClick={() => setAdjustType('SET')}
                    >
                      ✏️ Set Exact
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">
                    {adjustType === 'MASUK' && 'Jumlah Tambah Stok (Pcs) *'}
                    {adjustType === 'KELUAR' && 'Jumlah Pengurangan Stok (Pcs) *'}
                    {adjustType === 'SET' && 'Set Total Stok Baru (Pcs) *'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    value={adjustJumlah}
                    onChange={e => setAdjustJumlah(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginTop: '0.85rem' }}>
                  <label className="form-label">Catatan / Alasan Penyesuaian</label>
                  <input
                    className="form-input"
                    placeholder="Contoh: Hasil batch produksi baru, retur, audit fisik..."
                    value={adjustCatatan}
                    onChange={e => setAdjustCatatan(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedProduk(null)}>Batal</button>
                <button type="submit" className="btn btn-primary"><Check size={16} /> Simpan Penyesuaian</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
