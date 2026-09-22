import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, Check, Globe } from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export function ModernMonthPicker({ value, onChange, placeholder = 'Pilih Periode', allowAll = true, variant = 'primary' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  // Update fixed portal position
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updateCoords = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const popoverHeight = 310;
        const popoverWidth = 280;

        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow < popoverHeight ? Math.max(10, rect.top - popoverHeight - 6) : rect.bottom + 6;
        const left = Math.min(Math.max(10, rect.left), window.innerWidth - popoverWidth - 10);

        setPopoverPos({ top, left });
      };

      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [isOpen]);

  // Parse YYYY-MM or fallback
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1; // 1-12

  let parsedYear = defaultYear;
  let parsedMonth = defaultMonth;
  const isAll = (value === 'semua' || value === 'ALL' || !value);

  if (value && typeof value === 'string' && value.includes('-')) {
    const parts = value.split('-');
    if (parts.length >= 2) {
      parsedYear = parseInt(parts[0], 10) || defaultYear;
      parsedMonth = parseInt(parts[1], 10) || defaultMonth;
    }
  }

  const [viewYear, setViewYear] = useState(parsedYear);

  useEffect(() => {
    if (value && typeof value === 'string' && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length >= 2) {
        setViewYear(parseInt(parts[0], 10) || defaultYear);
      }
    }
  }, [value, defaultYear]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && containerRef.current.contains(e.target)) return;
      const portalCard = document.getElementById('modern-monthpicker-portal');
      if (portalCard && portalCard.contains(e.target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMonth = (mIndex) => {
    const monthNum = (mIndex + 1).toString().padStart(2, '0');
    const newYM = `${viewYear}-${monthNum}`;
    onChange(newYM);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    onChange('semua');
    setIsOpen(false);
  };

  const handleSelectThisMonth = () => {
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    onChange(`${y}-${m}`);
    setViewYear(y);
    setIsOpen(false);
  };

  const formattedDisplay = () => {
    if (isAll) return 'Semua Periode';
    const monthName = MONTH_NAMES[parsedMonth - 1] || 'Bulan';
    return `${monthName} ${parsedYear}`;
  };

  // Dark Navy Theme matching Stock Bahan Baku
  const buttonBg = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
  const buttonBorder = '1px solid rgba(56, 189, 248, 0.4)';
  const buttonColor = '#ffffff';
  const badgeBg = 'rgba(56, 189, 248, 0.15)';
  const badgeColor = '#38bdf8';
  const chevronColor = '#94a3b8';

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.55rem',
          height: '34px',
          background: buttonBg,
          border: buttonBorder,
          borderRadius: '10px',
          padding: '0 0.85rem',
          color: buttonColor,
          fontSize: '0.8rem',
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
          transition: 'all 0.2s ease',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '5px',
          background: badgeBg,
          color: badgeColor
        }}>
          <Calendar size={13} />
        </div>
        <span>{formattedDisplay()}</span>
        <ChevronRight size={14} style={{
          transform: isOpen ? 'rotate(-90deg)' : 'rotate(90deg)',
          transition: 'transform 0.2s ease',
          color: chevronColor
        }} />
      </button>

      {/* Modern Popover Dropdown Portal */}
      {isOpen && createPortal(
        <div
          id="modern-monthpicker-portal"
          style={{
            position: 'fixed',
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            width: '280px',
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '14px',
            padding: '1rem',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.2)',
            backdropFilter: 'blur(16px)',
            zIndex: 999999,
            animation: 'fadeIn 0.18s ease-out'
          }}
        >
          {/* Year Navigation Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
            paddingBottom: '0.65rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={() => setViewYear(prev => prev - 1)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                borderRadius: '8px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              color: '#f8fafc',
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {viewYear}
            </span>

            <button
              type="button"
              onClick={() => setViewYear(prev => prev + 1)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                borderRadius: '8px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 12 Months Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.45rem',
            marginBottom: '0.85rem'
          }}>
            {MONTH_SHORT.map((name, idx) => {
              const isSelected = !isAll && parsedYear === viewYear && parsedMonth === (idx + 1);
              const isCurrentMonth = now.getFullYear() === viewYear && (now.getMonth()) === idx;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)'
                      : (isCurrentMonth ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)'),
                    border: isSelected
                      ? '1px solid #38bdf8'
                      : (isCurrentMonth ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)'),
                    borderRadius: '8px',
                    padding: '0.45rem 0.2rem',
                    color: isSelected ? '#ffffff' : (isCurrentMonth ? '#38bdf8' : '#cbd5e1'),
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 800 : (isCurrentMonth ? 700 : 500),
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = isCurrentMonth ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.color = isCurrentMonth ? '#38bdf8' : '#cbd5e1';
                    }
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* Quick Action Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.65rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '0.4rem'
          }}>
            <button
              type="button"
              onClick={handleSelectThisMonth}
              style={{
                flex: 1,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                borderRadius: '6px',
                padding: '0.35rem 0.5rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              <Calendar size={12} /> Bulan Ini
            </button>

            {allowAll && (
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  flex: 1,
                  background: isAll ? 'rgba(34, 197, 94, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                  border: isAll ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isAll ? '#4ade80' : '#94a3b8',
                  borderRadius: '6px',
                  padding: '0.35rem 0.5rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem'
                }}
              >
                <Globe size={12} /> Semua Periode
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export function ModernDatePicker({ value, onChange, label = null, min, max, variant = 'primary' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  // Update fixed portal position
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updateCoords = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const popoverHeight = 360;
        const popoverWidth = 300;

        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow < popoverHeight ? Math.max(10, rect.top - popoverHeight - 6) : rect.bottom + 6;
        const left = Math.min(Math.max(10, rect.left), window.innerWidth - popoverWidth - 10);

        setPopoverPos({ top, left });
      };

      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && containerRef.current.contains(e.target)) return;
      const portalCard = document.getElementById('modern-datepicker-portal');
      if (portalCard && portalCard.contains(e.target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayStr = new Date().toISOString().substring(0, 10);
  const selectedDateStr = value || todayStr;

  // Parse current selected date
  const selectedParts = selectedDateStr.split('-');
  const selYear = parseInt(selectedParts[0], 10) || new Date().getFullYear();
  const selMonth = (parseInt(selectedParts[1], 10) || (new Date().getMonth() + 1)) - 1; // 0-indexed

  // Navigation view state
  const [viewYear, setViewYear] = useState(selYear);
  const [viewMonth, setViewMonth] = useState(selMonth);

  useEffect(() => {
    if (value && value.includes('-')) {
      const p = value.split('-');
      if (p.length === 3) {
        setViewYear(parseInt(p[0], 10));
        setViewMonth(parseInt(p[1], 10) - 1);
      }
    }
  }, [value]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const formatDisplay = (dateStr) => {
    if (!dateStr) return 'Pilih Tanggal';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      const monthName = MONTH_NAMES[monthIdx] || parts[1];
      return `${day} ${monthName} ${year}`;
    }
    return dateStr;
  };

  // Generate calendar days for viewYear & viewMonth
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = [];

  // Prev month padding
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      month: viewMonth - 1,
      year: viewMonth === 0 ? viewYear - 1 : viewYear,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true
    });
  }

  // Next month padding to fill grid (42 cells = 6 weeks)
  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({
      day: d,
      month: viewMonth + 1,
      year: viewMonth === 11 ? viewYear + 1 : viewYear,
      isCurrentMonth: false
    });
  }

  const handleSelectDay = (cell) => {
    const mStr = String(cell.month + 1).padStart(2, '0');
    const dStr = String(cell.day).padStart(2, '0');
    const fullDateStr = `${cell.year}-${mStr}-${dStr}`;

    if (min && fullDateStr < min) return;
    if (max && fullDateStr > max) return;

    if (onChange) onChange(fullDateStr);
    setIsOpen(false);
  };

  const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const isLight = variant === 'light';
  const buttonBg = isLight ? '#ffffff' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
  const buttonBorder = isLight ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.4)';
  const buttonColor = isLight ? '#0f172a' : '#ffffff';
  const iconColor = isLight ? '#f59e0b' : '#38bdf8';
  const labelColor = isLight ? '#64748b' : '#94a3b8';
  const badgeBg = isLight ? '#fef3c7' : 'rgba(56, 189, 248, 0.15)';

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          height: '32px',
          background: buttonBg,
          border: buttonBorder,
          borderRadius: '8px',
          padding: '0 0.75rem',
          color: buttonColor,
          fontSize: '0.78rem',
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.03)' : '0 4px 12px rgba(15, 23, 42, 0.25)',
          transition: 'all 0.2s ease',
          outline: 'none',
          userSelect: 'none',
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          borderRadius: '5px',
          background: badgeBg,
          color: iconColor
        }}>
          <Calendar size={12} />
        </div>
        {label && <span style={{ fontSize: '0.74rem', fontWeight: 600, color: labelColor }}>{label}:</span>}
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: buttonColor }}>
          {formatDisplay(selectedDateStr)}
        </span>
      </button>

      {/* Modern Custom Floating Calendar Card Portal */}
      {isOpen && createPortal(
        <div
          id="modern-datepicker-portal"
          style={{
            position: 'fixed',
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            width: '300px',
            background: '#0f172a',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            padding: '1rem',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.2)',
            backdropFilter: 'blur(16px)',
            zIndex: 999999,
            animation: 'fadeIn 0.18s ease-out'
          }}
        >
          {/* Calendar Header: Month/Year Nav */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.85rem',
              paddingBottom: '0.65rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                borderRadius: '8px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <span
              style={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: '#f8fafc',
                letterSpacing: '0.3px'
              }}
            >
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                borderRadius: '8px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekdays Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '0.4rem' }}>
            {WEEKDAYS.map((wd, i) => (
              <span key={wd} style={{ fontSize: '0.68rem', fontWeight: 700, color: i === 0 ? '#fb7185' : '#94a3b8' }}>
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.75rem' }}>
            {calendarDays.map((cell, idx) => {
              const mStr = String(cell.month + 1).padStart(2, '0');
              const dStr = String(cell.day).padStart(2, '0');
              const cellDateStr = `${cell.year}-${mStr}-${dStr}`;

              const isSelected = cellDateStr === selectedDateStr;
              const isToday = cellDateStr === todayStr;
              const isDisabled = (min && cellDateStr < min) || (max && cellDateStr > max);

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(cell)}
                  style={{
                    height: '32px',
                    borderRadius: '8px',
                    border: isSelected
                      ? '1px solid #38bdf8'
                      : (isToday ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent'),
                    background: isSelected
                      ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)'
                      : (isToday ? 'rgba(56, 189, 248, 0.15)' : 'transparent'),
                    color: isDisabled
                      ? '#475569'
                      : (isSelected ? '#ffffff' : (cell.isCurrentMonth ? '#f8fafc' : '#64748b')),
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 800 : (isToday ? 700 : 500),
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: cell.isCurrentMonth ? 1 : 0.35,
                    boxShadow: isSelected ? '0 4px 10px rgba(37, 99, 235, 0.4)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Quick Footer Action */}
          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                if (onChange) onChange(todayStr);
                setIsOpen(false);
              }}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                borderRadius: '6px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Calendar size={12} /> Hari Ini
            </button>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>📅 Per Tanggal Harian</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export function ModernSearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = '-- Pilih --',
  icon: Icon = Tag,
  maxWidth = '100%'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = useMemo(() => {
    if (!value) return null;
    return options.find(o => (o.value || o.id || o.nama || o) === value);
  }, [value, options]);

  const selectedLabel = useMemo(() => {
    if (!selectedItem) return placeholder;
    return selectedItem.label || selectedItem.nama || selectedItem;
  }, [selectedItem, placeholder]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase();
    return options.filter(opt => {
      const lbl = String(opt.label || opt.nama || opt).toLowerCase();
      const code = String(opt.kode || '').toLowerCase();
      return lbl.includes(q) || code.includes(q);
    });
  }, [options, searchTerm]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth }}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.45rem',
          height: '34px',
          width: '100%',
          background: '#ffffff',
          border: isOpen ? '1px solid #0284c7' : '1px solid #cbd5e1',
          borderRadius: '7px',
          padding: '0 0.65rem',
          fontSize: '0.76rem',
          fontWeight: 700,
          color: selectedItem ? '#0f172a' : '#94a3b8',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(2, 132, 199, 0.12)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {Icon && <Icon size={13} style={{ color: '#0284c7', flexShrink: 0 }} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedLabel}</span>
        </div>
        <ChevronRight size={13} style={{ color: '#64748b', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease', flexShrink: 0 }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.15)',
            padding: '0.4rem',
            maxHeight: '260px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ padding: '0.2rem 0.2rem 0.4rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.3rem' }}>
            <input
              type="text"
              placeholder="🔍 Cari kode / nama pelanggan..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                height: '32px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0 0.6rem',
                fontSize: '0.76rem',
                outline: 'none',
                boxSizing: 'border-box',
                background: '#f8fafc'
              }}
            />
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: !value ? 800 : 600,
                color: !value ? '#0284c7' : '#64748b',
                background: !value ? '#f0f9ff' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                marginBottom: '0.15rem'
              }}
            >
              <span>{placeholder}</span>
              {!value && <Check size={13} style={{ color: '#0284c7' }} />}
            </div>

            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                Tidak ditemukan pelanggan cocok
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const val = typeof opt === 'string' ? opt : (opt.value || opt.id || opt.nama);
                const lbl = typeof opt === 'string' ? opt : (opt.label || opt.nama);
                const isSel = value === val;

                return (
                  <div
                    key={val || idx}
                    onClick={() => {
                      onChange(val, opt);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '0.45rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: isSel ? 800 : 600,
                      color: isSel ? '#0284c7' : '#334155',
                      background: isSel ? '#f0f9ff' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      marginBottom: '0.15rem'
                    }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span>{lbl}</span>
                    {isSel && <Check size={13} style={{ color: '#0284c7' }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ModernFilterSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Semua Brand',
  icon: Icon = Tag,
  maxWidth = '180px'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = useMemo(() => {
    if (!value) return placeholder;
    const found = options.find(o => (o.value || o.id || o.nama || o) === value);
    return found ? (found.label || found.nama || found) : value;
  }, [value, options, placeholder]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', minWidth: '130px', maxWidth }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          gap: '0.45rem',
          height: '36px',
          width: '100%',
          background: '#ffffff',
          border: isOpen ? '1px solid #0284c7' : '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '0 0.65rem',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: '#0f172a',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(2, 132, 199, 0.12)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {Icon && <Icon size={13} style={{ color: '#0284c7', flexShrink: 0 }} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedLabel}</span>
        </div>
        <ChevronRight size={13} style={{ color: '#64748b', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease', flexShrink: 0 }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            padding: '0.3rem',
            minWidth: '150px',
            maxHeight: '220px',
            overflowY: 'auto'
          }}
        >
          <div
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            style={{
              padding: '0.45rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: !value ? 800 : 600,
              color: !value ? '#0284c7' : '#334155',
              background: !value ? '#f0f9ff' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              marginBottom: '0.15rem'
            }}
          >
            <span>{placeholder}</span>
            {!value && <Check size={13} style={{ color: '#0284c7' }} />}
          </div>

          {options.map((opt, idx) => {
            const val = typeof opt === 'string' ? opt : (opt.value || opt.id || opt.nama);
            const lbl = typeof opt === 'string' ? opt : (opt.label || opt.nama);
            const isSel = value === val;

            return (
              <div
                key={val || idx}
                onClick={() => {
                  onChange(val);
                  setIsOpen(false);
                }}
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: isSel ? 800 : 600,
                  color: isSel ? '#0284c7' : '#334155',
                  background: isSel ? '#f0f9ff' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  marginBottom: '0.15rem'
                }}
              >
                <span>🏷️ {lbl}</span>
                {isSel && <Check size={13} style={{ color: '#0284c7' }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
