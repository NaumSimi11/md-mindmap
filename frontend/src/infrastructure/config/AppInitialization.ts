/**
 * Application Initialization
 * 
 * Setup services on app start.
 */

import { setupServices } from '@/infrastructure/di/ServiceRegistration';

/**
 * Initialize the application
 * Call this once at app startup (in main.tsx or App.tsx)
 */
export function initializeApp(): void {
    // Setup dependency injection
    setupServices();

    // Add other initialization logic here
    console.log('✅ Application initialized');
}
