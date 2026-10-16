import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Solar Pulse] Uncaught runtime error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#070b13',
          color: '#f8fafc',
          fontFamily: "'Inter', sans-serif",
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#0d1322',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: '#f97316',
              color: '#070b13',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 20px',
              fontWeight: 800
            }}>
              ☀️
            </div>

            <h1 style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              margin: '0 0 10px',
              color: '#ffffff'
            }}>
              Solar Pulse Recovery
            </h1>

            <p style={{
              fontSize: '0.9rem',
              color: '#94a3b8',
              lineHeight: 1.6,
              margin: '0 0 24px'
            }}>
              An unexpected display issue occurred. You can safely reload the app or reset cached data to continue.
            </p>

            {this.state.error && (
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '24px',
                textAlign: 'left',
                maxHeight: '100px',
                overflowY: 'auto',
                fontSize: '0.78rem',
                color: '#f87171',
                fontFamily: 'monospace'
              }}>
                {String(this.state.error?.message || this.state.error)}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#f97316',
                  color: '#070b13',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '13px 20px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Reload Application
              </button>

              <button
                onClick={this.handleResetStorage}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '11px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Clear Cache &amp; Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
