import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  resetKey: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, resetKey: 0 };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error.message);
    console.error('[ErrorBoundary] Component stack:', info.componentStack?.slice(0, 400));
  }

  handleRetry = () => {
    // Bump resetKey so children remount fresh instead of re-throwing on the same state.
    this.setState((s) => ({ hasError: false, error: null, resetKey: s.resetKey + 1 }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const message = this.state.error?.message?.trim();

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen flex items-center justify-center p-6 bg-background"
        >
          <div className="max-w-sm w-full bg-card border border-border rounded-2xl p-6 shadow-lg text-center">
            <div className="text-4xl mb-3" aria-hidden="true">⚠️</div>
            <h1 className="text-lg font-semibold text-foreground mb-1">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground mb-5">
              This page hit an unexpected error. Your data is safe.
            </p>

            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleRetry}
                autoFocus
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Reload
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Home
              </button>
            </div>

            {message && (
              <details className="mt-5 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  Details
                </summary>
                <pre className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3 overflow-auto max-h-40 whitespace-pre-wrap break-words">
                  {message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    // key forces a fresh mount of the subtree after a retry.
    return <div key={this.state.resetKey} style={{ display: 'contents' }}>{this.props.children}</div>;
  }
}
