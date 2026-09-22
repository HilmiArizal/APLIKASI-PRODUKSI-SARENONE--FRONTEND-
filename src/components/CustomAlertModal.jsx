import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, XCircle, HelpCircle } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function CustomAlertModal({ isOpen, title, message, type = 'info', onConfirm, onClose, confirmText = 'OK', cancelText = 'Batal', isConfirm = false }) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', border: '2px solid rgba(16, 185, 129, 0.3)' }}><CheckCircle2 size={30} /></div>;
      case 'error':
      case 'danger':
      case 'confirm':
        return <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', border: '2px solid rgba(244, 63, 94, 0.3)' }}><XCircle size={30} /></div>;
      case 'warning':
        return <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', border: '2px solid rgba(245, 158, 11, 0.3)' }}><AlertTriangle size={30} /></div>;
      case 'question':
        return <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', border: '2px solid rgba(2, 132, 199, 0.3)' }}><HelpCircle size={30} /></div>;
      default:
        return <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.15)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', border: '2px solid rgba(37, 99, 235, 0.3)' }}><Info size={30} /></div>;
    }
  };

  const getConfirmButtonStyle = () => {
    if (type === 'danger' || type === 'error' || type === 'confirm') {
      return {
        background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 3px 10px rgba(225, 29, 72, 0.35)'
      };
    }
    if (type === 'success') {
      return {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 3px 10px rgba(5, 150, 105, 0.35)'
      };
    }
    return {
      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 3px 10px rgba(37, 99, 235, 0.35)'
    };
  };

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 999999 }}>
      <div style={{ maxWidth: '420px', width: '90%', textAlign: 'center', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem 1.5rem', background: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', margin: 'auto' }}>
        {getIcon()}

        <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem', marginTop: 0 }}>
          {title || (type === 'success' ? 'Berhasil!' : type === 'error' ? 'Perhatian!' : 'Konfirmasi')}
        </h3>

        <div style={{ color: '#475569', fontSize: '0.88rem', fontWeight: 500, lineHeight: '1.5', marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
          {message}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          {isConfirm && (
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.55rem 1rem',
                fontWeight: 700,
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            style={{
              flex: 1,
              padding: '0.55rem 1rem',
              fontWeight: 800,
              fontSize: '0.82rem',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              ...getConfirmButtonStyle()
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
