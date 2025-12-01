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

export class AIModalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('AI Modal Error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-[400px] p-8">
                    <div className="max-w-md text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">AI Assistant Error</h3>
                            <p className="text-sm text-muted-foreground">
                                {this.state.error?.message || 'Something went wrong with the AI assistant.'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={this.handleReset}
                                className="w-full"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>

                            <p className="text-xs text-muted-foreground">
                                If the problem persists, check your API key configuration.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
