import React from 'react';
import { Check, X, ShieldCheck, AlertCircle } from 'lucide-react';

export default function PasswordStrengthChecker({ password }) {
  const isMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&#^_-]/.test(password);

  const score = [isMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (!password) return { text: 'Belum diisi', color: 'var(--text-muted)', width: '0%' };
    if (score <= 2) return { text: 'Sangat Lemah ⚠️', color: 'var(--rose)', width: '30%' };
    if (score <= 4) return { text: 'Sedang (Butuh Simbol/Angka) 🟡', color: 'var(--amber)', width: '65%' };
    return { text: 'Sangat Kuat & Aman! 🟢✨', color: 'var(--emerald)', width: '100%' };
  };

  const strength = getStrengthLabel();

  return (
    <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginTop: '0.65rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.78rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Tingkat Keamanan Password:</span>
        <strong style={{ color: strength.color, fontWeight: 700 }}>{strength.text}</strong>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.75rem' }}>
        <div style={{ width: strength.width, height: '100%', background: strength.color, transition: 'all 0.3s ease' }}></div>
      </div>

      {/* Checklist Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem' }}>
        <div style={{ color: isMinLength ? 'var(--emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {isMinLength ? <Check size={13} /> : <X size={13} />} Minimal 8 Karakter
        </div>
        <div style={{ color: (hasUpper && hasLower) ? 'var(--emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {(hasUpper && hasLower) ? <Check size={13} /> : <X size={13} />} Huruf Besar & Kecil
        </div>
        <div style={{ color: hasNumber ? 'var(--emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {hasNumber ? <Check size={13} /> : <X size={13} />} Angka (0-9)
        </div>
        <div style={{ color: hasSpecial ? 'var(--emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {hasSpecial ? <Check size={13} /> : <X size={13} />} Simbol (@, #, $, %, !)
        </div>
      </div>
    </div>
  );
}
