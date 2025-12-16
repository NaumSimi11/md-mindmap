/**
 * Sidebar Error Boundary
 * 
 * Specialized error boundary for the sidebar component.
 * Prevents sidebar errors from crashing the entire app.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SidebarErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('🚨 [SidebarErrorBoundary] Sidebar error:', error, errorInfo);

    // TODO: Send to error tracking
    // trackError(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 bg-red-50 dark:bg-red-900/10">
          {/* Icon */}
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Sidebar Error
          </h3>

          {/* Description */}
          <p className="text-xs text-center text-gray-600 dark:text-gray-300 mb-4">
            The sidebar encountered an error.
          </p>

          {/* Error Message (Development) */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded w-full">
              <p className="text-xs font-mono text-red-800 dark:text-red-300 break-all">
                {this.state.error.message}
              </p>
            </div>
          )}

          {/* Action */}
          <Button
            onClick={this.handleReset}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-3 h-3" />
            Reload Sidebar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

