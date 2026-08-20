import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, XCircle, HelpCircle } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function CustomAlertModal({ isOpen, title, message, type = 'info', onConfirm, onClose, confirmText = 'OK', cancelText = 'Batal', isConfirm = false }) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(52, 211, 153, 0.18)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}><CheckCircle2 size={32} /></div>;
      case 'error':
      case 'danger':
        return <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(251, 113, 133, 0.18)', color: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}><XCircle size={32} /></div>;
      case 'warning':
        return <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(251, 191, 36, 0.18)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}><AlertTriangle size={32} /></div>;
      case 'question':
        return <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.18)', color: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}><HelpCircle size={32} /></div>;
      default:
        return <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(129, 140, 248, 0.18)', color: 'var(--indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}><Info size={32} /></div>;
    }
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '420px', textAlign: 'center', borderRadius: '24px', border: '1px solid var(--border-color)', padding: '1.75rem 1.5rem', background: 'var(--bg-card)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <img src={logoImg} alt="SAREN ONE" style={{ maxHeight: '45px', margin: '0 auto 0.75rem auto' }} />
        
        {getIcon()}

        <h3 style={{ color: '#1f2d3d', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {title || (type === 'success' ? 'Berhasil!' : type === 'error' ? 'Perhatian!' : 'Notifikasi')}
        </h3>

        <div style={{ color: '#212529', fontSize: '0.92rem', fontWeight: 600, lineHeight: '1.5', marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
          {message}
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
          {isConfirm && (
            <button
              className="btn btn-secondary"
              onClick={onClose}
              style={{ flex: 1, padding: '0.65rem 1rem' }}
            >
              {cancelText}
            </button>
          )}

          <button
            className={`btn ${type === 'danger' || type === 'error' ? 'btn-danger' : type === 'success' ? 'btn-emerald' : 'btn-primary'}`}
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            style={{ flex: 1, padding: '0.65rem 1rem' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
