/**
 * Tab Constants
 *
 * Constants used for tab management.
 *
 * @see Spec 018 - Browser Domain Layer
 */

/**
 * Tab-related constants
 */
export const TAB_CONSTANTS = {
    /** Maximum number of web tabs */
    MAX_WEB_TABS: 20,

    /** Maximum number of total tabs (all types) */
    MAX_TOTAL_TABS: 50,

    /** Default URL for new tabs */
    DEFAULT_URL: 'https://www.google.com',

    /** Default title for new tabs */
    DEFAULT_TITLE: 'New Tab',

    /** Maximum URL length */
    MAX_URL_LENGTH: 2048,

    /** Maximum title length */
    MAX_TITLE_LENGTH: 500,

    /** Inactive tab timeout (days) */
    INACTIVE_TAB_TIMEOUT_DAYS: 30,
} as const;
