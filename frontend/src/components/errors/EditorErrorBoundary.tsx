/**
 * Editor Error Boundary
 * 
 * Specialized error boundary for the editor component.
 * Provides editor-specific fallback UI and recovery options.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  documentId?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class EditorErrorBoundary extends Component<Props, State> {
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
    console.error('🚨 [EditorErrorBoundary] Editor error:', {
      documentId: this.props.documentId,
      error,
      errorInfo,
    });

    // TODO: Send to error tracking with editor context
    // trackError(error, { ...errorInfo, documentId: this.props.documentId });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });

    // Call parent reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px] bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
          <div className="max-w-md text-center p-8">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Editor Error
            </h2>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The editor encountered an error and couldn't load properly.
            </p>

            {/* Error Message (Development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-left">
                <p className="text-xs font-mono text-yellow-800 dark:text-yellow-300">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Editor
              </Button>
              <Button
                onClick={() => window.location.href = '/workspace'}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Back to Workspace
              </Button>
            </div>

            {/* Tip */}
            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              Tip: Try refreshing the page or selecting a different document.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

