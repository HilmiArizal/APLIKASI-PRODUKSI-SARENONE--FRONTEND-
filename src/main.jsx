import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#f8fafc',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.8rem' }}>⚠️ Terjadi Kesalahan Sesi / Tampilan</h2>
          <p style={{ color: '#94a3b8', maxWidth: '500px', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Aplikasi mengalami kendala pemuatan data cache lokal. Klik tombol di bawah untuk membersihkan cache &amp; memuat ulang aplikasi.
          </p>
          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#f87171', textAlign: 'left', maxWidth: '600px', overflowX: 'auto' }}>
            {this.state.error?.toString()}
          </div>
          <button
            onClick={this.handleReset}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              padding: '0.8rem 1.8rem',
              fontSize: '1rem',
              fontWeight: '600',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
            }}
          >
            🔄 Reset Cache &amp; Muat Ulang Aplikasi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
