import React from 'react';
import { UserCheck, Check, X, Trash2, Clock, ShieldCheck } from 'lucide-react';

export default function UserApprovalTab({ users, onApproveUser, onRejectUser, onDeleteUser }) {
  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const verifiedUsers = users.filter(u => u.status === 'VERIFIED');

  const getRoleLabel = (role) => {
    if (role === 'ADMIN') return 'Super Admin';
    if (role === 'BAHAN_BAKU') return 'Tim Gudang Bahan Baku';
    if (role === 'PRODUK') return 'Tim Produksi & Dapur';
    return role;
  };

  return (
    <div className="tab-pane active">
      {/* Pending Approval Section */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} style={{ color: 'var(--amber)' }} /> Antrean Pendaftaran Menunggu ACC Super Admin ({pendingUsers.length})
            </h3>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Pilih dan verifikasi pengajuan akses peran pengguna baru sebelum mereka dapat mengakses sistem.</p>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>NAMA PENDAFTAR</th>
                <th>METODE DAFTAR</th>
                <th>ROLE YANG DIAJUKAN</th>
                <th>CATATAN TUGAS</th>
                <th>WAKTU DAFTAR</th>
                <th style={{ textAlign: 'right' }}>VERIFIKASI & HAK AKSES</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                    Tidak ada pendaftaran pengguna baru yang menunggu ACC saat ini.
                  </td>
                </tr>
              ) : (
                pendingUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{u.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{u.email} (@{u.username})</div>
                    </td>
                    <td>
                      {u.provider === 'google' ? (
                        <span className="badge badge-cyan">Google Account</span>
                      ) : (
                        <span className="badge badge-emerald">Manual Email</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-amber">{getRoleLabel(u.requestedRole || u.role)}</span>
                    </td>
                    <td className="text-muted">{u.catatan || '-'}</td>
                    <td className="text-muted" style={{ fontSize: '0.78rem' }}>{u.createdAt}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-sm btn-emerald"
                          onClick={() => onApproveUser(u.id, u.requestedRole || 'PRODUK')}
                        >
                          <Check size={14} /> ACC Pendaftaran
                        </button>
                        <button
                          className="btn btn-sm btn-outline btn-danger"
                          onClick={() => onRejectUser(u.id)}
                        >
                          <X size={14} /> Tolak & Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verified Users Directory Section */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} style={{ color: 'var(--emerald)' }} /> Direktori Pengguna Terverifikasi ({verifiedUsers.length})
          </h3>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>Daftar seluruh akun yang telah disetujui dan aktif menggunakan sistem Saren One.</p>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>PENGGUNA TERVERIFIKASI</th>
                <th>METODE LOGIN</th>
                <th>PERAN / ROLE AKTIF</th>
                <th>STATUS AKUN</th>
                <th>WAKTU ACC</th>
                <th style={{ textAlign: 'right' }}>AKSI MANAJEMEN</th>
              </tr>
            </thead>
            <tbody>
              {verifiedUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{u.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{u.email} (@{u.username})</div>
                  </td>
                  <td>
                    {u.provider === 'google' ? (
                      <span className="badge badge-cyan">Google Account</span>
                    ) : (
                      <span className="badge badge-emerald">Manual Account</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-amber">{getRoleLabel(u.role)}</span>
                  </td>
                  <td>
                    <span className="badge badge-emerald"><UserCheck size={12} /> VERIFIED & AKTIF</span>
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.78rem' }}>{u.createdAt}</td>
                  <td style={{ textAlign: 'right' }}>
                    {u.role !== 'ADMIN' ? (
                      <button
                        className="btn btn-sm btn-outline btn-danger"
                        title="Hapus Akun Pengguna"
                        onClick={() => onDeleteUser(u.id)}
                      >
                        <Trash2 size={14} /> Hapus Akun
                      </button>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>Super Admin (Utama)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
