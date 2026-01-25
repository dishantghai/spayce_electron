import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SpaceItem } from '../types';
import styles from './InlineRenameInput.module.css';

export interface InlineRenameInputProps {
    item: SpaceItem;
    onSave: (newName: string) => void;
    onCancel: () => void;
}

/**
 * InlineRenameInput - Inline input for renaming folders and links.
 * 
 * Features:
 * - Pre-fills with current item name
 * - Auto-focus and select all on mount
 * - Enter to save, Escape to cancel
 * - Blur with changes saves, blur without changes cancels
 * - Empty name validation (prevents save)
 */
export function InlineRenameInput({
    item,
    onSave,
    onCancel,
}: InlineRenameInputProps): React.ReactElement {
    const [value, setValue] = useState(item.name);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus and select all on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const handleSave = useCallback(() => {
        const trimmedValue = value.trim();

        // Validation: non-empty
        if (!trimmedValue) {
            onCancel();
            return;
        }

        // Only save if changed
        if (trimmedValue !== item.name && !isSaving) {
            setIsSaving(true);
            onSave(trimmedValue);
        } else {
            onCancel();
        }
    }, [value, item.name, isSaving, onSave, onCancel]);

    const handleCancel = useCallback(() => {
        if (!isSaving) {
            onCancel();
        }
    }, [isSaving, onCancel]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    }, [handleSave, handleCancel]);

    const handleBlur = useCallback(() => {
        const trimmedValue = value.trim();
        if (trimmedValue && trimmedValue !== item.name) {
            handleSave();
        } else {
            handleCancel();
        }
    }, [value, item.name, handleSave, handleCancel]);

    return (
        <input
            ref={inputRef}
            type="text"
            className={styles.renameInput}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={isSaving}
        />
    );
}
