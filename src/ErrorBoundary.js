import React from 'react';
import { logger } from './utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Unity Game Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          color: 'white',
          background: '#0a0e27',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '10px', color: '#ff6b6b' }}>Game Error</h2>
          <p style={{ marginBottom: '20px', color: '#cbd5e0' }}>
            The game encountered an error. Please try reloading or return to the menu.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ 
              marginBottom: '20px', 
              textAlign: 'left',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '15px',
              borderRadius: '8px',
              maxWidth: '600px',
              overflow: 'auto'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Error Details</summary>
              <pre style={{ 
                fontSize: '12px', 
                color: '#ff6b6b',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '12px 24px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#764ba2'}
              onMouseOut={(e) => e.target.style.background = '#667eea'}
            >
              Reload Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

