/**
 * Dependency Injection Container
 * 
 * Service locator pattern for managing dependencies.
 * Senior pattern: Centralized dependency management.
 */

type Factory<T> = () => T;
type AsyncFactory<T> = () => Promise<T>;

export class DIContainer {
    private static instance: DIContainer;
    private services = new Map<string, Factory<any> | AsyncFactory<any>>();
    private singletons = new Map<string, any>();

    private constructor() { }

    static getInstance(): DIContainer {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }

    /**
     * Register a service factory
     */
    register<T>(key: string, factory: Factory<T> | AsyncFactory<T>): void {
        this.services.set(key, factory);
    }

    /**
     * Register a singleton service
     */
    registerSingleton<T>(key: string, factory: Factory<T> | AsyncFactory<T>): void {
        this.services.set(key, factory);
        // Mark as singleton by storing in separate map
        this.singletons.set(key, null);
    }

    /**
     * Resolve a service
     */
    resolve<T>(key: string): T {
        const factory = this.services.get(key);

        if (!factory) {
            throw new Error(`Service '${key}' not registered`);
        }

        // Check if singleton
        if (this.singletons.has(key)) {
            let instance = this.singletons.get(key);

            if (!instance) {
                instance = factory();
                this.singletons.set(key, instance);
            }

            return instance;
        }

        // Create new instance
        return factory();
    }

    /**
     * Resolve async service
     */
    async resolveAsync<T>(key: string): Promise<T> {
        const factory = this.services.get(key);

        if (!factory) {
            throw new Error(`Service '${key}' not registered`);
        }

        // Check if singleton
        if (this.singletons.has(key)) {
            let instance = this.singletons.get(key);

            if (!instance) {
                instance = await factory();
                this.singletons.set(key, instance);
            }

            return instance;
        }

        // Create new instance
        return await factory();
    }

    /**
     * Check if service is registered
     */
    has(key: string): boolean {
        return this.services.has(key);
    }

    /**
     * Clear all services (for testing)
     */
    clear(): void {
        this.services.clear();
        this.singletons.clear();
    }

    /**
     * Reset singleton instance (for testing)
     */
    static reset(): void {
        DIContainer.instance = new DIContainer();
    }
}
