// Infrastructure - Persistence & External Adapters Layer
// Implements repository interfaces and external service adapters

export * from './bootstrap';
export * from './di';
export * from './errors';
export * from './persistence';
export * from './services';

// Explicit re-exports for verification
export { ServiceBootstrap, type BootstrapConfig } from './bootstrap';
export { serviceRegistry, SERVICE_KEYS } from './di';
export { MetadataExtractionService, type PageMetadata } from './services/MetadataExtractionService';
// Note: LocalFileSystemService is in @spayce/desktop package (requires Electron)
