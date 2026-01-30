/**
 * Tab Domain Entity
 *
 * Browser tab entity following Clean Architecture principles.
 * All properties are readonly for immutability.
 *
 * @see Spec 018 - Browser Domain Layer
 */

/**
 * Tab content types - extensible for future content formats
 * Matches Flutter TabType enum
 */
export enum TabType {
    /** WebView-based browser tab */
    Web = 'web',
    /** Rich text/Markdown note (future) */
    Note = 'note',
    /** Local file viewer (future) */
    LocalFile = 'localFile',
}

/**
 * Browser tab entity - immutable
 *
 * Design Decisions:
 * - All properties readonly for immutability
 * - Date fields use Date type (not strings)
 * - Origin tracking for Spaces integration
 * - Position for tab ordering
 */
export interface TabEntity {
    // Identity
    readonly id: string;
    readonly tabType: TabType;

    // Content
    readonly url: string;
    readonly title: string;
    readonly faviconUrl: string | null;

    // Origin tracking for Spaces integration
    /** The Space this tab was opened from (if any) */
    readonly originSpaceId: string | null;
    /** The Space item this tab was opened from (if any) */
    readonly originSpaceItemId: string | null;
    /**
     * False if navigated away from origin URL.
     * Used for sidebar highlighting - only tracked tabs highlight their origin.
     */
    readonly isTracked: boolean;
    /** The original URL when opened from Space (for tracking comparison) */
    readonly originUrl: string | null;

    // State
    readonly isActive: boolean;
    readonly isLoading: boolean;
    readonly loadingProgress: number;
    readonly canGoBack: boolean;
    readonly canGoForward: boolean;

    // Security
    readonly isSecure: boolean;

    // Error state
    readonly errorCode: number | null;
    readonly errorDescription: string | null;

    // Position
    readonly position: number;

    // Timestamps
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly lastAccessedAt: Date | null;
}

/**
 * Input for creating a new tab
 *
 * Most fields are optional with sensible defaults:
 * - url defaults to google.com
 * - title defaults to "New Tab"
 * - tabType defaults to Web
 */
export interface CreateTabInput {
    /** URL to load (default: https://www.google.com) */
    readonly url?: string;
    /** Tab title (default: "New Tab") */
    readonly title?: string;
    /** Tab type (default: Web) */
    readonly tabType?: TabType;
    /** Favicon URL if known */
    readonly faviconUrl?: string | null;
    /** Space ID if opened from a Space */
    readonly originSpaceId?: string | null;
    /** Space item ID if opened from a Space item */
    readonly originSpaceItemId?: string | null;
    /** Whether to make this the active tab (default: true) */
    readonly activate?: boolean;
}

/**
 * Default values for tab creation
 */
export const CREATE_TAB_DEFAULTS: Required<Omit<CreateTabInput, 'originSpaceId' | 'originSpaceItemId' | 'faviconUrl'>> & {
    originSpaceId: null;
    originSpaceItemId: null;
    faviconUrl: null;
} = {
    url: 'https://www.google.com',
    title: 'New Tab',
    tabType: TabType.Web,
    faviconUrl: null,
    originSpaceId: null,
    originSpaceItemId: null,
    activate: true,
};

/**
 * Input for updating a tab
 *
 * Only specified fields are updated.
 * The id field is required to identify the tab.
 */
export interface UpdateTabInput {
    /** Tab ID (required) */
    readonly id: string;
    /** New URL */
    readonly url?: string;
    /** New title */
    readonly title?: string;
    /** New favicon URL */
    readonly faviconUrl?: string | null;
    /** Update tracking status */
    readonly isTracked?: boolean;
    /** Update active status */
    readonly isActive?: boolean;
    /** Update loading status */
    readonly isLoading?: boolean;
    /** Update loading progress (0-1) */
    readonly loadingProgress?: number;
    /** Update back navigation capability */
    readonly canGoBack?: boolean;
    /** Update forward navigation capability */
    readonly canGoForward?: boolean;
    /** Update security status */
    readonly isSecure?: boolean;
    /** Update error code */
    readonly errorCode?: number | null;
    /** Update error description */
    readonly errorDescription?: string | null;
    /** Update position */
    readonly position?: number;
    /** Update last accessed time */
    readonly lastAccessedAt?: Date | null;
}

/**
 * Check if a tab has a Space origin
 */
export function hasOrigin(tab: TabEntity): boolean {
    return tab.originSpaceId !== null && tab.originSpaceItemId !== null;
}

/**
 * Check if a tab is currently tracking its origin
 */
export function isTrackingOrigin(tab: TabEntity): boolean {
    return hasOrigin(tab) && tab.isTracked;
}
