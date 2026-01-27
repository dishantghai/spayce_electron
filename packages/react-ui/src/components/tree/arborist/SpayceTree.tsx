import React, { useRef, useCallback, useMemo } from 'react';
import { Tree, TreeApi } from 'react-arborist';
import type { NodeRendererProps } from 'react-arborist';
import type { SpaceItem, InlineInputState } from '../../../types';
import { SpayceColors, SpayceSpacing } from '../../../theme';
import { SpayceTreeNode, SpayceTreeNodeExtraProps } from './SpayceTreeNode';
import { InlineInput } from '../../InlineInput';
import styles from './SpayceTree.module.css';

export interface SpayceTreeProps {
    /** Array of root-level items to display */
    items: SpaceItem[];
    /** Space ID for context */
    spaceId: string;
    /** Currently selected item ID */
    selectedId?: string | null;
    /** Currently active item ID (shows accent border) */
    activeId?: string | null;
    /** Space accent color */
    accentColor?: string;
    /** Inline input state for creating folders/links */
    inlineInput?: InlineInputState | null;
    /** Item ID being renamed */
    renameItemId?: string | null;
    /** Width of the tree container */
    width?: number;
    /** Height of the tree container */
    height?: number;
    /** Called when an item is clicked */
    onItemClick?: (item: SpaceItem) => void;
    /** Called when right-clicking an item */
    onItemContextMenu?: (item: SpaceItem, event: React.MouseEvent) => void;
    /** Called when an item is moved via drag-drop */
    onItemMove?: (draggedItemId: string, newParentId: string | null, newIndex: number) => Promise<boolean>;
    /** Called when add subfolder button is clicked */
    onAddSubfolder?: (parentItem: SpaceItem) => void;
    /** Called when add link button is clicked */
    onAddLink?: (parentItem: SpaceItem) => void;
    /** Called when inline input is submitted */
    onInlineInputSubmit?: (value: string, type: 'folder' | 'link', parentId: string | null) => void;
    /** Called when inline input is cancelled */
    onInlineInputCancel?: () => void;
    /** Called when rename is submitted */
    onRenameSubmit?: (itemId: string, newName: string) => void;
    /** Called when rename is cancelled */
    onRenameCancel?: () => void;
}

/**
 * SpayceTree - React Arborist wrapper for Spayce tree views
 * 
 * Features:
 * - Built-in drag-and-drop with proper position calculation
 * - Virtualized rendering for performance
 * - Custom node rendering matching Spayce design system
 * - Inline folder/link creation
 * - Inline rename support
 * - Context menu integration
 * 
 * Used in:
 * - Sidebar (full tree of current space)
 * - Space Cards (tree of single space's items)
 */
export function SpayceTree({
    items,
    spaceId,
    selectedId = null,
    activeId = null,
    accentColor = SpayceColors.primary,
    inlineInput,
    renameItemId,
    width,
    height = 600,
    onItemClick,
    onItemContextMenu,
    onItemMove,
    onAddSubfolder,
    onAddLink,
    onInlineInputSubmit,
    onInlineInputCancel,
    onRenameSubmit,
    onRenameCancel,
}: SpayceTreeProps): React.ReactElement {
    const treeRef = useRef<TreeApi<SpaceItem>>(null);

    // Handle move from Arborist - UI already updated, we persist to backend
    const handleMove = useCallback(async ({
        dragIds,
        parentId,
        index
    }: {
        dragIds: string[];
        parentId: string | null;
        index: number;
    }) => {
        console.log('[SpayceTree] onMove triggered:', { dragIds, parentId, index });

        if (!onItemMove) {
            console.warn('[SpayceTree] No onItemMove handler provided');
            return;
        }

        // Arborist handles multi-select, but we process one at a time for now
        const draggedItemId = dragIds[0];

        try {
            const success = await onItemMove(draggedItemId, parentId, index);
            if (success) {
                console.log('[SpayceTree] Move successful');
            } else {
                console.error('[SpayceTree] Move failed, UI will refresh');
            }
        } catch (error) {
            console.error('[SpayceTree] Move error:', error);
            // Parent component should handle refresh/rollback
        }
    }, [onItemMove]);

    // Check if inline input should appear at root level
    const showRootInlineInput = inlineInput && inlineInput.parentId === null;

    // Props to pass to each node renderer
    const nodeExtraProps: SpayceTreeNodeExtraProps = useMemo(() => ({
        spaceId,
        accentColor,
        renameItemId,
        activeId,
        onItemClick,
        onItemContextMenu,
        onAddSubfolder,
        onAddLink,
        onRenameSubmit,
        onRenameCancel,
    }), [
        spaceId,
        accentColor,
        renameItemId,
        activeId,
        onItemClick,
        onItemContextMenu,
        onAddSubfolder,
        onAddLink,
        onRenameSubmit,
        onRenameCancel,
    ]);

    // Custom node renderer that passes extra props
    const renderNode = useCallback((props: NodeRendererProps<SpaceItem>) => (
        <SpayceTreeNode {...props} {...nodeExtraProps} />
    ), [nodeExtraProps]);

    // Empty state
    if (!items || items.length === 0) {
        return (
            <div className={styles.treeContainer} role="tree" aria-label="Empty tree">
                {showRootInlineInput && (
                    <div className={styles.inlineInputContainer}>
                        <InlineInput
                            type={inlineInput!.type}
                            spaceId={spaceId}
                            parentId={null}
                            level={0}
                            accentColor={accentColor}
                            onSubmit={(value) => onInlineInputSubmit?.(value, inlineInput!.type, null)}
                            onCancel={() => onInlineInputCancel?.()}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={styles.treeContainer}>
            {/* Root level inline input */}
            {showRootInlineInput && (
                <div className={styles.inlineInputContainer}>
                    <InlineInput
                        type={inlineInput!.type}
                        spaceId={spaceId}
                        parentId={null}
                        level={0}
                        accentColor={accentColor}
                        onSubmit={(value) => onInlineInputSubmit?.(value, inlineInput!.type, null)}
                        onCancel={() => onInlineInputCancel?.()}
                    />
                </div>
            )}

            <Tree<SpaceItem>
                ref={treeRef}
                data={items}
                idAccessor="id"
                childrenAccessor="children"
                width={width}
                height={height}
                indent={SpayceSpacing.treeIndent}
                rowHeight={32}
                overscanCount={5}
                selection={selectedId || undefined}
                onMove={handleMove}
                disableEdit={true}  // We handle rename ourselves
                disableDrag={false}
                disableDrop={false}
                openByDefault={false}
            >
                {renderNode}
            </Tree>
        </div>
    );
}

export default SpayceTree;
