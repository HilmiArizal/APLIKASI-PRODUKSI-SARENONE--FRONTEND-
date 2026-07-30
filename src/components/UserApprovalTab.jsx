import React, { useState } from 'react';
import { UserCheck, Check, X, Trash2, Clock, ShieldCheck, UserPlus, Search, Edit, KeyRound, Filter, Users, ShieldAlert, Sparkles, Eye, EyeOff } from 'lucide-react';
import PasswordStrengthChecker from './PasswordStrengthChecker';

export default function UserApprovalTab({ users, onApproveUser, onRejectUser, onDeleteUser, onSaveUser, onResetUserPassword, showAlert }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [isModalResetOpen, setIsModalResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form Create State
  const [createName, setCreateName] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPass, setCreatePass] = useState('');
  const [createRole, setCreateRole] = useState('BAHAN_BAKU');
  const [createStatus, setCreateStatus] = useState('VERIFIED');
  const [showCreatePass, setShowCreatePass] = useState(false);

  // Form Edit State
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('BAHAN_BAKU');
  const [editStatus, setEditStatus] = useState('VERIFIED');

  // Form Reset Password State
  const [resetNewPass, setResetNewPass] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);

  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const verifiedUsers = users.filter(u => u.status === 'VERIFIED');
  const rejectedUsers = users.filter(u => u.status === 'REJECTED');

  const getRoleLabel = (role) => {
    if (role === 'ADMIN') return 'Super Admin';
    if (role === 'BAHAN_BAKU') return 'Tim Produksi';
    if (role === 'PEMBELIAN') return 'Tim Pembelian';
    return role;
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'ADMIN') return 'badge-amber';
    if (role === 'PEMBELIAN') return 'badge-emerald';
    return 'badge-cyan';
  };

  // Filtering users for table
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter || u.requestedRole === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Open Edit Modal
  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditName(user.name || '');
    setEditUsername(user.username || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || user.requestedRole || 'PRODUK');
    setEditStatus(user.status || 'VERIFIED');
    setIsModalEditOpen(true);
  };

  // Open Reset Password Modal
  const handleOpenReset = (user) => {
    setSelectedUser(user);
    setResetNewPass('');
    setIsModalResetOpen(true);
  };

  // Submit Create User
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!createName || !createUsername || !createEmail || !createPass) {
      showAlert('Mohon isi semua bidang bertanda bintang (*)!', 'warning', 'Form Belum Lengkap');
      return;
    }

    if (createPass.length < 8 || !/[A-Z]/.test(createPass) || !/[a-z]/.test(createPass) || !/\d/.test(createPass) || !/[@$!%*?&#^_-]/.test(createPass)) {
      showAlert('Kata sandi harus memenuhi 5 Syarat Keamanan Password!', 'error', 'Syarat Keamanan Password');
      return;
    }

    onSaveUser({
      name: createName,
      username: createUsername.trim().toLowerCase(),
      email: createEmail.trim().toLowerCase(),
      pass: createPass,
      requestedRole: createRole,
      role: createRole,
      status: createStatus,
      provider: 'local',
      catatan: 'Dibuat oleh Super Admin'
    });

    setCreateName('');
    setCreateUsername('');
    setCreateEmail('');
    setCreatePass('');
    setIsModalCreateOpen(false);
  };

  // Submit Edit User
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    onSaveUser({
      id: selectedUser.id,
      name: editName,
      username: editUsername.trim().toLowerCase(),
      email: editEmail.trim().toLowerCase(),
      role: editRole,
      status: editStatus
    });

    setIsModalEditOpen(false);
  };

  // Submit Reset Password
  const handleResetSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser || !resetNewPass) return;

    if (resetNewPass.length < 8 || !/[A-Z]/.test(resetNewPass) || !/[a-z]/.test(resetNewPass) || !/\d/.test(resetNewPass) || !/[@$!%*?&#^_-]/.test(resetNewPass)) {
      showAlert('Kata sandi baru harus memenuhi 5 Syarat Keamanan Password!', 'error', 'Syarat Keamanan Password');
      return;
    }

    onResetUserPassword(selectedUser.id, resetNewPass);
    setIsModalResetOpen(false);
  };

  return (
    <div className="tab-pane active">
      {/* Upper Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card border-indigo">
          <div className="stat-icon icon-indigo"><Users size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">TOTAL PENGGUNA TERDAFTAR</span>
            <span className="stat-value">{users.length}</span>
            <span className="stat-desc text-muted">Akun Super Admin & Staf</span>
          </div>
        </div>

        <div className="stat-card border-amber">
          <div className="stat-icon icon-amber"><Clock size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">ANTREAN MENUNGGU ACC</span>
            <span className="stat-value" style={{ color: pendingUsers.length > 0 ? 'var(--amber)' : '#fff' }}>{pendingUsers.length}</span>
            <span className="stat-desc text-amber">{pendingUsers.length > 0 ? '⚠️ Butuh ACC Super Admin' : 'Tidak ada antrean'}</span>
          </div>
        </div>

        <div className="stat-card border-emerald">
          <div className="stat-icon icon-emerald"><ShieldCheck size={24} /></div>
          <div className="stat-details">
            <span className="stat-title">PENGGUNA TERVERIFIKASI</span>
            <span className="stat-value text-emerald">{verifiedUsers.length}</span>
            <span className="stat-desc text-emerald">Aktif Mengakses Sistem</span>
          </div>
        </div>
      </div>

      {/* Action Toolbar Header & Search Filters */}
      {/* <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={22} style={{ color: 'var(--amber)' }} /> Kelola & Verifikasi Pengguna (User CRUD)
            </h3>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Super Admin Control Panel untuk tambah staf baru, edit profil, reset password, dan ACC verifikasi role.</p>
          </div>

          <button className="btn btn-emerald" onClick={() => setIsModalCreateOpen(true)}>
            <UserPlus size={16} /> Tambah Staf Baru
          </button>
        </div> */}

        {/* Filter Controls */}
        {/* <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Cari pengguna berdasarkan nama, username, atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          <select className="select-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="ALL">Semua Peran (Role)</option>
            <option value="ADMIN">Super Admin</option>
            <option value="BAHAN_BAKU">Tim Gudang Bahan</option>
            <option value="PRODUK">Tim Produksi & Dapur</option>
          </select>

          <select className="select-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Semua Status</option>
            <option value="PENDING">⏳ Menunggu ACC (Pending)</option>
            <option value="VERIFIED">✅ Terverifikasi (Verified)</option>
            <option value="REJECTED">❌ Ditolak (Rejected)</option>
          </select>
        </div> */}
      {/* </div> */}

      {/* Main Users Table Directory */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
        <div className="table-container">
          <table className="custom-table">
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
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem' }} className="text-muted">
                    Tidak ditemukan pengguna yang sesuai dengan pencarian/filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{u.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.76rem' }}>{u.email} (@{u.username})</div>
                    </td>
                    <td>
                      {u.provider === 'google' ? (
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
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        {u.status === 'PENDING' && (
                          <button
                            className="btn btn-sm btn-emerald"
                            onClick={() => onApproveUser(u.id, u.requestedRole || 'BAHAN_BAKU')}
                            title="ACC & Verifikasi Akun Ini"
                          >
                            <Check size={14} /> ACC
                          </button>
                        )}

                        {u.role !== 'ADMIN' && (
                          <button
                            className="btn btn-sm btn-outline btn-danger"
                            onClick={() => onDeleteUser(u.id)}
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
      </div>

      {/* Modal 1: Tambah Staf Baru oleh Admin */}
      {isModalCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
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
                  <button type="button" onClick={() => setShowCreatePass(!showCreatePass)} style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showCreatePass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <PasswordStrengthChecker password={createPass} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label>Penugasan Role / Divisi *</label>
                    <select className="select-input" value={createRole} onChange={(e) => setCreateRole(e.target.value)} style={{ width: '100%' }}>
                      <option value="BAHAN_BAKU">🏭 Tim Produksi</option>
                      <option value="PEMBELIAN">🛒 Tim Pembelian &amp; Utang Supplier</option>
                      <option value="ADMIN">🔑 Super Admin</option>
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

      {/* Modal 2: Edit Profil & Role User */}
      {isModalEditOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3><Edit size={20} style={{ color: 'var(--cyan)' }} /> Edit Profil Pengguna</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsModalEditOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nama Lengkap Staf *</label>
                  <input type="text" className="form-control" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label>Username *</label>
                    <input type="text" className="form-control" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" className="form-control" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label>Peran / Role Aktif *</label>
                    <select className="select-input" value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ width: '100%' }}>
                      <option value="BAHAN_BAKU">🏭 Tim Produksi</option>
                      <option value="PEMBELIAN">🛒 Tim Pembelian &amp; Utang Supplier</option>
                      <option value="ADMIN">🔑 Super Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status Verifikasi *</label>
                    <select className="select-input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ width: '100%' }}>
                      <option value="VERIFIED">✅ Terverifikasi (VERIFIED)</option>
                      <option value="PENDING">⏳ Menunggu ACC (PENDING)</option>
                      <option value="REJECTED">❌ Ditolak (REJECTED)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalEditOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-cyan"><Check size={16} /> Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Reset Password User oleh Admin */}
      {isModalResetOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3><KeyRound size={20} style={{ color: 'var(--amber)' }} /> Reset Kata Sandi User</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsModalResetOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleResetSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Akun Target Reset:</span>
                  <div style={{ fontWeight: 700 }}>{selectedUser.name} (@{selectedUser.username})</div>
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Kata Sandi Baru *</label>
                  <input type={showResetPass ? 'text' : 'password'} className="form-control" placeholder="Masukkan password baru..." value={resetNewPass} onChange={(e) => setResetNewPass(e.target.value)} required />
                  <button type="button" onClick={() => setShowResetPass(!showResetPass)} style={{ position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showResetPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <PasswordStrengthChecker password={resetNewPass} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalResetOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-amber"><Check size={16} /> Reset Password Now</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
