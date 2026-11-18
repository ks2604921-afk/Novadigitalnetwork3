import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

// Catches runtime render errors inside the NOVA app so a crash shows a
// recovery screen instead of a blank page.
export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('NOVA app error:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-nova-black px-6">
        <div className="w-full max-w-sm rounded-xl border border-nova-line bg-nova-dark p-8 text-center">
          <h1 className="text-xl font-semibold text-nova-text">Something went wrong</h1>
          <p className="mt-2 text-sm text-nova-muted">
            The app hit an unexpected error. You can try again or reload the app.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="h-12 w-full rounded-md bg-nova-red font-semibold text-white transition-colors hover:bg-nova-red/90"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-12 w-full rounded-md border border-nova-line bg-nova-card font-medium text-nova-text transition-colors hover:border-nova-accent/50"
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
