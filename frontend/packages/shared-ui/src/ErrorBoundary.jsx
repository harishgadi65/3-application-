import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(this.state.error, this.handleReload)
          : this.props.fallback;
      }

      return (
        <div className="sad-error-boundary" role="alert">
          <h2 className="sad-error-boundary-title">Something went wrong</h2>
          <p className="sad-error-boundary-message">
            {this.state.error && this.state.error.message
              ? this.state.error.message
              : 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            className="sad-error-boundary-button"
            onClick={this.handleReload}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
