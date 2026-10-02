import { Component, Suspense, lazy } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface BoundaryProps {
  fallbackTitle: string;
  children: ReactNode;
}

interface BoundaryState {
  hasError: boolean;
  message: string;
}

// Only class allowed: isolates render crashes.
export class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  reset = (): void => {
    this.setState({ hasError: false, message: '' });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h2>{this.props.fallbackTitle}</h2>
          <p>{this.state.message}</p>
          <button type="button" onClick={this.reset}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SlowPanel = lazy(async () => ({
  default: function SlowPanel({ label }: { label: string }) {
    return <p>Loaded panel: {label}</p>;
  },
}));

interface SafePanelProps {
  label: string;
  fallbackTitle: string;
}

export function SafePanel({ label, fallbackTitle }: SafePanelProps) {
  return (
    <ErrorBoundary fallbackTitle={fallbackTitle}>
      <Suspense fallback={<p>Loading panel...</p>}>
        <SlowPanel label={label} />
      </Suspense>
    </ErrorBoundary>
  );
}
