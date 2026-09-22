import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserCheck, Check, X, Trash2, Clock, ShieldCheck, UserPlus, Search, Edit, Edit3, Filter, Users, ShieldAlert, Sparkles } from 'lucide-react';
import PasswordStrengthChecker from './PasswordStrengthChecker';

export default function UserApprovalTab({ users, onApproveUser, onRejectUser, onDeleteUser, onSaveUser, showAlert, domainRoles }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const ALL_ROLES = [
    'BAHAN_BAKU',
    'PEMBELIAN',
    'TIM_PENJUALAN',
    'TIM_MARKETING',
    'ADMIN',
    'ADMIN_PRODUK'
  ];
  const ROLE_OPTIONS = (domainRoles && domainRoles.length) ? domainRoles : ALL_ROLES;
  const defaultRole = ROLE_OPTIONS[0] || 'BAHAN_BAKU';

  // Form Create State
  const [createName, setCreateName] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPass, setCreatePass] = useState('');
  const [createRole, setCreateRole] = useState(defaultRole);
  const [createStatus, setCreateStatus] = useState('VERIFIED');
  const [showCreatePass, setShowCreatePass] = useState(false);

  // Form Edit Role State
  const [editRole, setEditRole] = useState('BAHAN_BAKU');

  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const verifiedUsers = users.filter(u => u.status === 'VERIFIED');

  const getRoleLabel = (role) => {
    if (role === 'ADMIN') return 'Super Admin BB';
    if (role === 'ADMIN_PRODUK') return 'Super Admin Produk';
    if (role === 'BAHAN_BAKU') return 'Tim Produksi';
    if (role === 'PEMBELIAN') return 'Tim Pembelian';
    if (role === 'TIM_PENJUALAN') return 'Tim Penjualan';
    if (role === 'TIM_MARKETING') return 'Tim Marketing';
    if (role === 'SALES') return 'Tim Sales';
    if (role === 'PENDING') return 'Menunggu ACC';
    return role;
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'ADMIN' || role === 'ADMIN_PRODUK') return 'badge-amber';
    if (role === 'PEMBELIAN' || role === 'TIM_PENJUALAN' || role === 'SALES') return 'badge-emerald';
    if (role === 'TIM_MARKETING') return 'badge-indigo';
    return 'badge-cyan';
  };

  // Filtering users for table
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Open Edit Role Modal
  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditRole(user.role || user.requestedRole || 'BAHAN_BAKU');
    setIsModalEditOpen(true);
  };

  // Submit Create User
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!createName || !createUsername || !createEmail || !createPass) {
      showAlert('Mohon isi semua bidang bertanda bintang (*)!', 'warning', 'Form Belum Lengkap');
      return;
    }

    onSaveUser({
      name: createName,
      username: createUsername.trim().toLowerCase(),
      email: createEmail.trim().toLowerCase(),
      pass: createPass,
      role: createRole,
      status: createStatus
    });

    setCreateName('');
    setCreateUsername('');
    setCreateEmail('');
    setCreatePass('');
    setIsModalCreateOpen(false);
  };

  // Submit Edit Role
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    onSaveUser({
      id: selectedUser.id || selectedUser._id,
      name: selectedUser.name,
      username: selectedUser.username,
      email: selectedUser.email,
      role: editRole,
      status: 'VERIFIED'
    });

    setIsModalEditOpen(false);
  };

  return (
    <div className="tab-pane active" style={{ maxWidth: '100%', overflowX: 'hidden', color: '#1e293b' }}>
      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', marginBottom: '0.75rem' }}>
        {/* Card 1 */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '4px solid #6366f1', borderRadius: '10px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ background: '#e0e7ff', color: '#4338ca', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>TOTAL PENGGUNA</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>{users.length}</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Akun Super Admin &amp; Staf</div>
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '4px solid #f59e0b', borderRadius: '10px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ background: '#fef3c7', color: '#b45309', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>ANTREAN ACC</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: pendingUsers.length > 0 ? '#d97706' : '#0f172a', lineHeight: 1.1 }}>
              {pendingUsers.length}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              {pendingUsers.length > 0 ? '⚠️ Perlu ACC Admin' : 'Tidak ada antrean'}
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '4px solid #10b981', borderRadius: '10px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ background: '#d1fae5', color: '#047857', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>PENGGUNA AKTIF</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669', lineHeight: 1.1 }}>{verifiedUsers.length}</div>
            <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>Terverifikasi &amp; Aktif</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'flex-start' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsModalCreateOpen(true)}
          style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.85rem', borderRadius: '6px', boxShadow: '0 3px 10px rgba(2, 132, 199, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <UserPlus size={14} /> Buat Akun Staf Baru
        </button>
      </div>

      {/* Main Users Table Directory */}
      <div className="table-container" style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 3px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="custom-table" style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>PROFIL PENGGUNA</th>
                <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>METODE LOGIN</th>
                <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>ROLE / PERAN AKTIF</th>
                <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>STATUS VERIFIKASI</th>
                <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', whiteSpace: 'nowrap' }}>TANGGAL DAFTAR</th>
                <th style={{ padding: '0.4rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#475569', textAlign: 'right', whiteSpace: 'nowrap' }}>AKSI MANAJEMEN ADMIN</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Tidak ada data pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id || u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="avatar-icon" style={{ width: '28px', height: '28px', fontSize: '0.74rem', fontWeight: 800, borderRadius: '50%', background: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <strong style={{ color: '#0f172a', fontSize: '0.74rem', display: 'block' }}>{u.name}</strong>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            {u.email} (@{u.username})
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                      {u.googleId ? (
                        <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px', display: 'inline-block' }}>
                          Google Auth
                        </span>
                      ) : (
                        <span style={{ background: '#d1fae5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px', display: 'inline-block' }}>
                          Manual Password
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                      <span className={`badge ${getRoleBadgeClass(u.role || u.requestedRole)}`} style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px' }}>
                        {getRoleLabel(u.role || u.requestedRole)}
                      </span>
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', whiteSpace: 'nowrap' }}>
                      {u.status === 'PENDING' ? (
                        <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.68rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '5px', display: 'inline-block' }}>
                          ⏳ Pending ACC
                        </span>
                      ) : u.status === 'VERIFIED' ? (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          ✓ Terverifikasi
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          ✕ Ditolak
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.32rem 0.55rem', fontSize: '0.72rem', color: '#475569', whiteSpace: 'nowrap' }}>{u.createdAt}</td>
                    <td style={{ padding: '0.32rem 0.55rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                        {u.status === 'PENDING' && (
                          <button
                            type="button"
                            style={{
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                              borderRadius: '5px',
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              padding: '0 0.45rem',
                              height: '24px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              cursor: 'pointer'
                            }}
                            onClick={() => onApproveUser(u.id || u._id, u.requestedRole || 'BAHAN_BAKU')}
                            title="ACC & Verifikasi Akun Ini"
                          >
                            <Check size={12} /> ACC
                          </button>
                        )}

                        <button
                          type="button"
                          style={{
                            background: '#f0f9ff',
                            color: '#0284c7',
                            border: '1px solid #bae6fd',
                            borderRadius: '5px',
                            width: '24px',
                            height: '24px',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleOpenEdit(u)}
                          title="Ubah Role Staf"
                        >
                          <Edit3 size={12} />
                        </button>

                        {u.role !== 'ADMIN' && u.role !== 'ADMIN_PRODUK' && (
                          <button
                            type="button"
                            style={{
                              background: '#fef2f2',
                              color: '#ef4444',
                              border: '1px solid #fecaca',
                              borderRadius: '5px',
                              width: '24px',
                              height: '24px',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            onClick={() => onDeleteUser(u.id || u._id)}
                            title="Hapus Akun Pengguna"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Tambah Staf Baru oleh Admin */}
      {isModalCreateOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsModalCreateOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem', boxSizing: 'border-box' }}>
          <div className="modal-card" style={{ maxWidth: '480px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', flexShrink: 0 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserPlus size={16} style={{ color: '#059669' }} /> Tambah Staf Baru
              </h3>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsModalCreateOpen(false)} style={{ height: '24px', width: '24px', padding: 0, borderRadius: '5px' }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              <div className="modal-body" style={{ padding: '0.85rem 1rem', overflowY: 'auto', flex: 1 }}>
                <div className="form-group" style={{ marginBottom: '0.55rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.15rem', display: 'block' }}>Nama Lengkap Staf *</label>
                  <input type="text" className="form-control" placeholder="Nama lengkap..." value={createName} onChange={(e) => setCreateName(e.target.value)} required style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.6rem' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.55rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.15rem', display: 'block' }}>Username *</label>
                    <input type="text" className="form-control" placeholder="Username..." value={createUsername} onChange={(e) => setCreateUsername(e.target.value.replace(/\s+/g, ''))} required style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.6rem' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.15rem', display: 'block' }}>Email *</label>
                    <input type="email" className="form-control" placeholder="Email aktif..." value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.6rem' }} />
                  </div>
                </div>

                <div className="form-group" style={{ position: 'relative', marginBottom: '0.55rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.15rem', display: 'block' }}>Kata Sandi Awal *</label>
                  <input type={showCreatePass ? 'text' : 'password'} className="form-control" placeholder="Set kata sandi aman..." value={createPass} onChange={(e) => setCreatePass(e.target.value)} required style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.6rem' }} />
                </div>

                <PasswordStrengthChecker password={createPass} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.55rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.15rem', display: 'block' }}>Penugasan Role / Divisi *</label>
                    <select value={createRole} onChange={(e) => setCreateRole(e.target.value)} style={{ height: '34px', fontSize: '0.74rem', fontWeight: 700, width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.5rem', background: '#ffffff', color: '#0f172a', outline: 'none', lineHeight: 'normal' }}>
                      <option value="BAHAN_BAKU">🏭 Tim Produksi (Bahan Baku)</option>
                      <option value="PEMBELIAN">🛒 Tim Pembelian (Bahan Baku)</option>
                      <option value="TIM_PENJUALAN">🛍️ Tim Penjualan (Produk)</option>
                      <option value="TIM_MARKETING">📣 Tim Marketing (Produk)</option>
                      <option value="SALES">📱 Tim Sales / SPG (Khusus Mobile App)</option>
                      <option value="ADMIN">🔑 Super Admin Bahan Baku</option>
                      <option value="ADMIN_PRODUK">🔑 Super Admin Produk</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.15rem', display: 'block' }}>Status Verifikasi *</label>
                    <select value={createStatus} onChange={(e) => setCreateStatus(e.target.value)} style={{ height: '34px', fontSize: '0.74rem', fontWeight: 700, width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 0.5rem', background: '#ffffff', color: '#0f172a', outline: 'none', lineHeight: 'normal' }}>
                      <option value="VERIFIED">✅ Terverifikasi (Langsung Aktif)</option>
                      <option value="PENDING">⏳ Pending ACC</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '0.65rem 1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', background: '#f8fafc', flexShrink: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalCreateOpen(false)} style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.75rem' }}>Batal</button>
                <button type="submit" className="btn btn-emerald" style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.85rem', borderRadius: '6px', boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Check size={14} /> Buat Akun Staf</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Modal Ubah Role Pengguna */}
      {isModalEditOpen && selectedUser && createPortal(
        <div className="modal-overlay" onClick={() => setIsModalEditOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', padding: '1rem', boxSizing: 'border-box' }}>
          <div className="modal-card" style={{ maxWidth: '440px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', flexShrink: 0 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Edit size={16} style={{ color: '#0284c7' }} /> Ubah Role Pengguna
              </h3>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsModalEditOpen(false)} style={{ height: '24px', width: '24px', padding: 0, borderRadius: '5px' }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              <div className="modal-body" style={{ padding: '0.85rem 1rem', overflowY: 'auto', flex: 1 }}>
                <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', marginBottom: '0.85rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Akun Target:</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: '0.15rem 0' }}>{selectedUser.name}</div>
                  <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>@{selectedUser.username} • {selectedUser.email || '-'}</div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem', display: 'block' }}>Pilih Peran / Role Baru *</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    style={{
                      height: '34px',
                      padding: '0 0.6rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      width: '100%',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      background: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      lineHeight: 'normal'
                    }}
                  >
                    <option value="BAHAN_BAKU">🏭 Tim Produksi (Bahan Baku)</option>
                    <option value="PEMBELIAN">🛒 Tim Pembelian (Bahan Baku)</option>
                    <option value="TIM_PENJUALAN">🛍️ Tim Penjualan (Produk)</option>
                    <option value="TIM_MARKETING">📣 Tim Marketing (Produk)</option>
                    <option value="SALES">📱 Tim Sales / SPG (Khusus Mobile App)</option>
                    <option value="ADMIN">🔑 Super Admin Bahan Baku</option>
                    <option value="ADMIN_PRODUK">🔑 Super Admin Produk</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '0.65rem 1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', background: '#f8fafc', flexShrink: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalEditOpen(false)} style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.75rem', borderRadius: '6px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ height: '32px', fontSize: '0.78rem', fontWeight: 800, padding: '0 0.85rem', borderRadius: '6px', background: '#0284c7', color: '#ffffff', border: 'none', boxShadow: '0 3px 10px rgba(2, 132, 199, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Check size={14} /> Simpan Role Baru</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
