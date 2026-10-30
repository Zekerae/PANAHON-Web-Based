import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
          : this.props.fallback;
      }

      // Default resilient fallback
      return (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          background: 'rgba(30, 10, 10, 0.95)',
          border: '2px solid #EF4444',
          borderRadius: '8px',
          padding: '16px',
          color: '#FCA5A5',
          fontFamily: 'monospace',
          maxWidth: '420px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.8)'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#F87171' }}>⚠️ Component Render Error</h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#CBD5E1' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={this.handleReset}
              style={{
                background: '#DC2626',
                color: '#FFF',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Dismiss & Continue
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#374151',
                color: '#E5E7EB',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

