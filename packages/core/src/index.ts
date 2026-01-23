// Domain Layer - Entities, Value Objects, Validators, Events
export * from './domain/entities';
export * from './domain/value-objects';
export * from './domain/errors';
export * from './domain/validators';
export * from './domain/events';
export * from './domain/services';
export * from './domain/repositories';

// Application Layer - Use Cases, Queries, Facades
export * from './application/common';
export * from './application/use-cases';
export * from './application/queries';
export * from './application/facades';

// Explicit re-exports for verification (avoid ambiguity)
export type { SpaceEntity } from './domain/entities/Space';
export type { SpaceItemEntity } from './domain/entities/SpaceItem';
export { SpaceItemType } from './domain/entities/SpaceItem';
