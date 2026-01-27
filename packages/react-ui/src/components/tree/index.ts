// Tree component exports
// Default exports are legacy components for backwards compatibility
// Arborist components are exported under 'arborist' namespace

// Legacy exports (current implementation)
export { TreeView } from '../TreeView';
export type { TreeViewProps } from '../TreeView';
export { TreeItem } from '../TreeItem';
export { TreeItemIcon } from '../TreeItemIcon';

// Arborist exports (new implementation)
export * from './arborist';
