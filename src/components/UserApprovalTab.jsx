import React, { useState } from 'react';
import { UserCheck, Check, X, Trash2, Clock, ShieldCheck, UserPlus, Search, Edit, Filter, Users, ShieldAlert, Sparkles } from 'lucide-react';
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
    if (role === 'PENDING') return 'Menunggu ACC';
    return role;
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'ADMIN' || role === 'ADMIN_PRODUK') return 'badge-amber';
    if (role === 'PEMBELIAN' || role === 'TIM_PENJUALAN') return 'badge-emerald';
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
    <div className="tab-pane active">
      {/* Top Banner & Title */}
      <div className="tab-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 className="tab-title"><UserCheck size={24} /> Verifikasi User &amp; Akses Peran</h2>
          <p className="tab-subtitle">Modul persetujuan pendaftaran &amp; manajemen hak akses peran pengguna.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalCreateOpen(true)}>
          <UserPlus size={16} /> Buat Akun Staf Baru
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card border-indigo">
          <div className="stat-icon icon-indigo"><Users size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">TOTAL PENGGUNA TERDAFTAR</span>
            <strong className="stat-value">{users.length}</strong>
            <span className="stat-desc text-muted">Akun Super Admin &amp; Staf</span>
          </div>
        </div>

        <div className="stat-card border-amber">
          <div className="stat-icon icon-amber"><Clock size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">ANTREAN MENUNGGU ACC</span>
            <strong className="stat-value" style={{ color: pendingUsers.length > 0 ? 'var(--amber)' : '#fff' }}>
              {pendingUsers.length}
            </strong>
            <span className="stat-desc text-muted">
              {pendingUsers.length > 0 ? 'Perlu tindakan Super Admin' : 'Tidak ada antrean'}
            </span>
          </div>
        </div>

        <div className="stat-card border-emerald">
          <div className="stat-icon icon-emerald"><ShieldCheck size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">PENGGUNA TERVERIFIKASI</span>
            <strong className="stat-value text-emerald">{verifiedUsers.length}</strong>
            <span className="stat-desc text-emerald">Aktif Mengakses Sistem</span>
          </div>
        </div>
      </div>

      {/* Main Users Table Directory */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>PROFIL PENGGUNA</th>
              <th>METODE LOGIN</th>
              <th>ROLE / PERAN AKTIF</th>
              <th>STATUS VERIFIKASI</th>
              <th>TANGGAL DAFTAR</th>
              <th style={{ textAlign: 'right' }}>AKSI MANAJEMEN ADMIN</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Tidak ada data pengguna yang sesuai dengan filter pencarian.
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u.id || u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar-icon" style={{ width: '36px', height: '36px', fontSize: '0.95rem' }}>
                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{u.name}</strong>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                          {u.email} (@{u.username})
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {u.googleId ? (
                      <span className="badge badge-cyan">Google Auth</span>
                    ) : (
                      <span className="badge badge-emerald">Manual Password</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getRoleBadgeClass(u.role || u.requestedRole)}`}>
                      {getRoleLabel(u.role || u.requestedRole)}
                    </span>
                  </td>
                  <td>
                    {u.status === 'PENDING' ? (
                      <span className="status-badge status-warning">⏳ Pending ACC</span>
                    ) : u.status === 'VERIFIED' ? (
                      <span className="status-badge status-safe">✓ Terverifikasi</span>
                    ) : (
                      <span className="status-badge status-danger">✕ Ditolak</span>
                    )}
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.78rem' }}>{u.createdAt}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      {u.status === 'PENDING' && (
                        <button
                          className="btn btn-sm btn-emerald"
                          onClick={() => onApproveUser(u.id || u._id, u.requestedRole || 'BAHAN_BAKU')}
                          title="ACC & Verifikasi Akun Ini"
                        >
                          <Check size={14} /> ACC
                        </button>
                      )}

                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleOpenEdit(u)}
                        title="Ubah Role Staf"
                      >
                        <Edit size={14} /> Ubah Role
                      </button>

                      {u.role !== 'ADMIN' && u.role !== 'ADMIN_PRODUK' && (
                        <button
                          className="btn btn-sm btn-outline btn-danger"
                          onClick={() => onDeleteUser(u.id || u._id)}
                          title="Hapus Akun Pengguna"
                        >
                          <Trash2 size={14} />
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

      {/* Modal 1: Tambah Staf Baru oleh Admin */}
      {isModalCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsModalCreateOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><UserPlus size={20} style={{ color: 'var(--emerald)' }} /> Tambah Staf Baru</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsModalCreateOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nama Lengkap Staf *</label>
                  <input type="text" className="form-control" placeholder="Nama lengkap..." value={createName} onChange={(e) => setCreateName(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label>Username *</label>
                    <input type="text" className="form-control" placeholder="Username..." value={createUsername} onChange={(e) => setCreateUsername(e.target.value.replace(/\s+/g, ''))} required />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" className="form-control" placeholder="Email aktif..." value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Kata Sandi Awal *</label>
                  <input type={showCreatePass ? 'text' : 'password'} className="form-control" placeholder="Set kata sandi aman..." value={createPass} onChange={(e) => setCreatePass(e.target.value)} required />
                </div>

                <PasswordStrengthChecker password={createPass} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Penugasan Role / Divisi *</label>
                    <select className="select-input" value={createRole} onChange={(e) => setCreateRole(e.target.value)} style={{ width: '100%' }}>
                      <option value="BAHAN_BAKU">🏭 Tim Produksi (Bahan Baku)</option>
                      <option value="PEMBELIAN">🛒 Tim Pembelian (Bahan Baku)</option>
                      <option value="TIM_PENJUALAN">🛍️ Tim Penjualan (Produk)</option>
                      <option value="TIM_MARKETING">📣 Tim Marketing (Produk)</option>
                      <option value="ADMIN">🔑 Super Admin Bahan Baku</option>
                      <option value="ADMIN_PRODUK">🔑 Super Admin Produk</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status Verifikasi *</label>
                    <select className="select-input" value={createStatus} onChange={(e) => setCreateStatus(e.target.value)} style={{ width: '100%' }}>
                      <option value="VERIFIED">✅ Terverifikasi (Langsung Aktif)</option>
                      <option value="PENDING">⏳ Pending ACC</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalCreateOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-emerald"><Check size={16} /> Buat Akun Staf</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Modal Ubah Role Pengguna */}
      {isModalEditOpen && selectedUser && (
        <div className="modal-overlay" onClick={() => setIsModalEditOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Edit size={20} style={{ color: 'var(--cyan)' }} /> Ubah Role Pengguna</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsModalEditOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Akun Target:</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{selectedUser.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{selectedUser.username} • {selectedUser.email || '-'}</div>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Pilih Peran / Role Baru *</label>
                  <select className="select-input" value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}>
                    <option value="BAHAN_BAKU">🏭 Tim Produksi (Bahan Baku)</option>
                    <option value="PEMBELIAN">🛒 Tim Pembelian (Bahan Baku)</option>
                    <option value="TIM_PENJUALAN">🛍️ Tim Penjualan (Produk)</option>
                    <option value="TIM_MARKETING">📣 Tim Marketing (Produk)</option>
                    <option value="ADMIN">🔑 Super Admin Bahan Baku</option>
                    <option value="ADMIN_PRODUK">🔑 Super Admin Produk</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalEditOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary"><Check size={16} /> Simpan Role Baru</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
