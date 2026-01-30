export class BrowserError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly viewId?: string
    ) {
        super(message);
        this.name = 'BrowserError';
    }
}

export class ViewNotFoundError extends BrowserError {
    constructor(viewId: string) {
        super(`Browser view not found: ${viewId}`, 'VIEW_NOT_FOUND', viewId);
        this.name = 'ViewNotFoundError';
    }
}

export class InvalidURLError extends BrowserError {
    constructor(url: string, viewId?: string) {
        super(`Invalid URL: ${url}`, 'INVALID_URL', viewId);
        this.name = 'InvalidURLError';
    }
}

export class NavigationError extends BrowserError {
    constructor(message: string, viewId: string, public readonly failedUrl: string) {
        super(message, 'NAVIGATION_ERROR', viewId);
        this.name = 'NavigationError';
    }
}

export class ServiceNotInitializedError extends BrowserError {
    constructor() {
        super('BrowserService not initialized', 'SERVICE_NOT_INITIALIZED');
        this.name = 'ServiceNotInitializedError';
    }
}
