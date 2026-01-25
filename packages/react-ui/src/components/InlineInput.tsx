import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Folder, Link, X } from 'lucide-react';
import type { InlineInputType } from '../types';
import { SpayceColors } from '../theme';
import { isLikelyUrl } from '../utils/url';
import styles from './InlineInput.module.css';

export interface InlineInputProps {
    type: InlineInputType;
    spaceId: string;
    parentId: string | null;
    level: number;
    accentColor: string;
    initialValue?: string;
    onSubmit: (value: string) => void;
    onCancel: () => void;
}

/**
 * InlineInput - Inline input for creating folders and links in the tree.
 * 
 * Features:
 * - Auto-focus on mount
 * - Auto-paste URL from clipboard for link type
 * - Enter to submit, Escape to cancel
 * - Blur with content submits, blur without content cancels
 * - Icon based on type (folder/link)
 * - Accent color border from space theme
 */
export function InlineInput({
    type,
    spaceId,
    parentId,
    level,
    accentColor,
    initialValue = '',
    onSubmit,
    onCancel,
}: InlineInputProps): React.ReactElement {
    const [value, setValue] = useState(initialValue);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-paste URL from clipboard for link type
    useEffect(() => {
        if (type !== 'link' || initialValue) return;

        const loadClipboard = async () => {
            try {
                if (window.electronAPI?.clipboard) {
                    const text = await window.electronAPI.clipboard.readText();
                    if (text && isLikelyUrl(text)) {
                        setValue(text);
                        // Select all so user can see the domain
                        setTimeout(() => inputRef.current?.select(), 0);
                    }
                }
            } catch (e) {
                // Ignore clipboard errors
                console.debug('Clipboard read failed:', e);
            }
        };

        loadClipboard();
    }, [type, initialValue]);

    // Auto-focus on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
            if (initialValue) {
                inputRef.current?.select();
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [initialValue]);

    const handleSubmit = useCallback(() => {
        const trimmedValue = value.trim();
        if (trimmedValue && !isSubmitting) {
            setIsSubmitting(true);
            onSubmit(trimmedValue);
        }
    }, [value, isSubmitting, onSubmit]);

    const handleCancel = useCallback(() => {
        if (!isSubmitting) {
            onCancel();
        }
    }, [isSubmitting, onCancel]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    }, [handleSubmit, handleCancel]);

    const handleBlur = useCallback(() => {
        const trimmedValue = value.trim();
        if (trimmedValue) {
            handleSubmit();
        } else {
            handleCancel();
        }
    }, [value, handleSubmit, handleCancel]);

    // Calculate indentation: match TreeItem indentation logic
    // Uses same formula as TreeItem: 8 + (depth * 24)
    // level 0: 8px, level 1: 32px, level 2: 56px, etc.
    const indentPx = 8 + (level * 24);

    const isFolder = type === 'folder';
    const placeholder = isFolder ? 'Folder name' : 'Paste link';
    const Icon = isFolder ? Folder : Link;
    const iconSize = isFolder ? 16 : 14;

    return (
        <div
            className={styles.inlineInputRow}
            style={{ paddingLeft: `${indentPx}px` }}
        >
            <span className={styles.icon}>
                <Icon size={iconSize} color={accentColor} />
            </span>
            <input
                ref={inputRef}
                type="text"
                className={styles.input}
                style={{
                    '--accent-color': accentColor,
                } as React.CSSProperties}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={isSubmitting}
            />
            <button
                className={styles.cancelButton}
                onClick={handleCancel}
                type="button"
                title="Cancel"
            >
                <X size={16} color={SpayceColors.textMuted} />
            </button>
        </div>
    );
}
