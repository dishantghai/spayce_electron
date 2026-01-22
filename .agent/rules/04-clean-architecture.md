# Clean Architecture Development Workflow

## Overview
This project follows Clean Architecture principles. When implementing new features, follow this workflow.

## Layer Structure

### 1. Domain Layer (@spayce/core)
- **Entity**: Immutable data structures representing business objects
- **Value Objects**: Small immutable objects (IDs, validated strings)
- **Domain Events**: Events that occur in the domain
- **Repository Interfaces**: Contracts for data access

### 2. Application Layer (@spayce/core)
- **Use Case**: Single business operation (CreateSpace, DeleteItem)
- **Facade**: Simplified API combining multiple use cases
- **Queries**: Read-only data retrieval

### 3. Infrastructure Layer (@spayce/infrastructure)
- **Repository Implementation**: SQLite repositories
- **Service Bootstrap**: Dependency injection setup
- **Event Bus**: Domain event publishing

### 4. UI Layer (@spayce/react-ui)
- **Hooks**: Data fetching (useSpaces, useSpaceItems)
- **Mutations**: State changes (useCreateSpace, useDeleteItem)
- **Components**: Reusable UI components

## New Feature Development Workflow

1. **Define Entity** in `packages/core/src/domain/entities/`
2. **Define Repository Interface** in `packages/core/src/domain/repositories/`
3. **Create Use Case** in `packages/core/src/application/use-cases/`
4. **Implement Repository** in `packages/infrastructure/src/persistence/sqlite/`
5. **Create Hook** in `packages/react-ui/src/hooks/`
6. **Build Component** in `packages/react-ui/src/components/`

## Key Patterns

- Entities are **readonly interfaces** (immutable)
- Use **Date** types for timestamps (not numbers)
- Repository methods return **Promise<Entity>**
- Use Cases return **Result<T, Error>** pattern
- Hooks use **invalidation pattern** for cache refresh
