/**
 * Support Page
 * Placeholder page for support and help resources
 */

import React from 'react';

export const Support: React.FC = () => {
    return (
        <div className="min-h-screen bg-dark text-white">
            {/* Header */}
            <header className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <span className="sr-only">Toggle menu</span>
                        <div className="w-6 h-6 flex flex-col justify-center">
                            <span className="block w-full h-0.5 bg-white mb-1"></span>
                            <span className="block w-full h-0.5 bg-white mb-1"></span>
                            <span className="block w-full h-0.5 bg-white"></span>
                        </div>
                    </button>
                    <h1 className="text-xl font-semibold">Support</h1>
                    <div></div>
                </div>
            </header>

            {/* Content */}
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-6">Support</h1>
                <p className="text-white/70">Support page coming soon...</p>
            </div>
        </div>
    );
};

export default Support;
