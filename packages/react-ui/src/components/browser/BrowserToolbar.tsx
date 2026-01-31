/**
 * BrowserToolbar Component
 * Spec 019: Single Tab Browser MVP
 *
 * Navigation controls and URL bar for the browser.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, X, Plus, Lock, Globe } from 'lucide-react';
import styles from './BrowserToolbar.module.css';

export interface BrowserToolbarProps {
    /** Current URL being displayed */
    url: string;
    /** Whether the page is currently loading */
    isLoading: boolean;
    /** Whether we can navigate back */
    canGoBack: boolean;
    /** Whether we can navigate forward */
    canGoForward: boolean;
    /** Whether the current page is secure (HTTPS) */
    isSecure: boolean;
    /** Callback when back button is clicked */
    onBack: () => void;
    /** Callback when forward button is clicked */
    onForward: () => void;
    /** Callback when reload/stop button is clicked */
    onReload: () => void;
    /** Callback when stop button is clicked */
    onStop: () => void;
    /** Callback when URL is submitted */
    onNavigate: (url: string) => void;
    /** Callback when new tab button is clicked */
    onNewTab?: () => void;
    /** Optional className for styling */
    className?: string;
}

/**
 * Normalize URL for display (remove protocol for cleaner look)
 */
function getDisplayUrl(url: string): string {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        // For local files, show full path
        if (urlObj.protocol === 'file:') {
            return urlObj.pathname;
        }
        // For web URLs, show without protocol
        return url.replace(/^https?:\/\//, '');
    } catch {
        return url;
    }
}

/**
 * Normalize user input to a valid URL
 */
function normalizeUrl(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return '';

    // If it looks like a URL with protocol, use as-is
    if (/^[a-z]+:\/\//i.test(trimmed)) {
        return trimmed;
    }

    // If it looks like a domain (has a dot and no spaces)
    if (/^[^\s]+\.[^\s]+$/.test(trimmed)) {
        return `https://${trimmed}`;
    }

    // Otherwise, treat as a search query
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export const BrowserToolbar: React.FC<BrowserToolbarProps> = ({
    url,
    isLoading,
    canGoBack,
    canGoForward,
    isSecure,
    onBack,
    onForward,
    onReload,
    onStop,
    onNavigate,
    onNewTab,
    className,
}) => {
    const [inputValue, setInputValue] = useState(getDisplayUrl(url));
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update input when URL changes externally
    useEffect(() => {
        if (!isEditing) {
            setInputValue(getDisplayUrl(url));
        }
    }, [url, isEditing]);

    const handleInputFocus = useCallback(() => {
        setIsEditing(true);
        setInputValue(url); // Show full URL when editing
        // Select all text after a tick to ensure it's rendered
        setTimeout(() => {
            inputRef.current?.select();
        }, 0);
    }, [url]);

    const handleInputBlur = useCallback(() => {
        setIsEditing(false);
        setInputValue(getDisplayUrl(url)); // Reset to display format
    }, [url]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const normalizedUrl = normalizeUrl(inputValue);
            if (normalizedUrl) {
                onNavigate(normalizedUrl);
                inputRef.current?.blur();
            }
        } else if (e.key === 'Escape') {
            setInputValue(getDisplayUrl(url));
            inputRef.current?.blur();
        }
    }, [inputValue, url, onNavigate]);

    const handleReloadOrStop = useCallback(() => {
        if (isLoading) {
            onStop();
        } else {
            onReload();
        }
    }, [isLoading, onStop, onReload]);

    return (
        <div className={`${styles.toolbar} ${className || ''}`}>
            {/* Navigation buttons */}
            <div className={styles.navButtons}>
                <button
                    className={styles.navButton}
                    onClick={onBack}
                    disabled={!canGoBack}
                    aria-label="Go back"
                    title="Go back"
                >
                    <ChevronLeft size={18} />
                </button>
                <button
                    className={styles.navButton}
                    onClick={onForward}
                    disabled={!canGoForward}
                    aria-label="Go forward"
                    title="Go forward"
                >
                    <ChevronRight size={18} />
                </button>
                <button
                    className={styles.navButton}
                    onClick={handleReloadOrStop}
                    aria-label={isLoading ? 'Stop loading' : 'Reload page'}
                    title={isLoading ? 'Stop' : 'Reload'}
                >
                    {isLoading ? <X size={16} /> : <RotateCw size={16} />}
                </button>
            </div>

            {/* URL bar */}
            <div className={styles.urlBarContainer}>
                <div className={styles.urlBar}>
                    <span className={styles.securityIcon}>
                        {isSecure ? (
                            <Lock size={14} className={styles.secureIcon} />
                        ) : (
                            <Globe size={14} className={styles.insecureIcon} />
                        )}
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.urlInput}
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyDown}
                        placeholder="Search or enter URL"
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                    />
                </div>
            </div>

            {/* New tab button */}
            {onNewTab && (
                <button
                    className={styles.newTabButton}
                    onClick={onNewTab}
                    aria-label="Open new tab"
                    title="New tab"
                >
                    <Plus size={18} />
                </button>
            )}
        </div>
    );
};
