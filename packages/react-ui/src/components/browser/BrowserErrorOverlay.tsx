import { AlertCircle } from 'lucide-react';
import { useBrowserUiStore } from '../../stores/browserUiStore';
import styles from './BrowserErrorOverlay.module.css';

export interface BrowserErrorOverlayProps {
    errorCode: number;
    errorDescription: string;
    url: string;
    /** Callback when retry button is clicked (optional - falls back to store) */
    onRetry?: () => void;
    /** Callback when "Go to Google" button is clicked (optional - falls back to store) */
    onGoToGoogle?: () => void;
}

/**
 * Get user-friendly error message from Chromium error code
 */
function getUserMessage(errorCode: number, errorDescription: string): string {
    // Common Chromium error codes
    switch (errorCode) {
        case -2: // ERR_FAILED
            return 'The page failed to load.';
        case -3: // ERR_ABORTED
            return 'The page load was cancelled.';
        case -6: // ERR_FILE_NOT_FOUND
            return 'The file could not be found.';
        case -7: // ERR_TIMED_OUT
            return 'The page took too long to load.';
        case -21: // ERR_NETWORK_CHANGED
            return 'Your network connection changed.';
        case -100: // ERR_CONNECTION_CLOSED
            return 'The connection was closed.';
        case -101: // ERR_CONNECTION_RESET
            return 'The connection was reset.';
        case -102: // ERR_CONNECTION_REFUSED
            return 'The connection was refused.';
        case -103: // ERR_CONNECTION_ABORTED
            return 'The connection was aborted.';
        case -104: // ERR_CONNECTION_FAILED
            return 'Could not connect to the server.';
        case -105: // ERR_NAME_NOT_RESOLVED
            return 'The server could not be found.';
        case -106: // ERR_INTERNET_DISCONNECTED
            return 'You are not connected to the internet.';
        case -107: // ERR_SSL_PROTOCOL_ERROR
            return 'There was an SSL protocol error.';
        case -109: // ERR_ADDRESS_UNREACHABLE
            return 'The server address is unreachable.';
        case -118: // ERR_CONNECTION_TIMED_OUT
            return 'The connection timed out.';
        case -200: // ERR_CERT_COMMON_NAME_INVALID
        case -201: // ERR_CERT_DATE_INVALID
        case -202: // ERR_CERT_AUTHORITY_INVALID
            return 'There was a security certificate error.';
        case -324: // ERR_EMPTY_RESPONSE
            return 'The server sent an empty response.';
        default:
            return errorDescription || 'An unexpected error occurred.';
    }
}

/**
 * Error overlay shown when page fails to load
 * Spec 019: Single Tab Browser MVP
 */
export function BrowserErrorOverlay({
    errorCode,
    errorDescription,
    url,
    onRetry,
    onGoToGoogle,
}: BrowserErrorOverlayProps) {
    const { reload, loadURL } = useBrowserUiStore();

    const userMessage = getUserMessage(errorCode, errorDescription);

    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        } else {
            reload();
        }
    };

    const handleGoHome = () => {
        if (onGoToGoogle) {
            onGoToGoogle();
        } else {
            loadURL('https://www.google.com');
        }
    };

    return (
        <div
            className={styles.overlay}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
        >
            <div className={styles.content}>
                <AlertCircle className={styles.icon} size={48} />
                <h2 id="error-title" className={styles.title}>This page isn&apos;t working</h2>
                <p className={styles.message} aria-describedby="error-title">{userMessage}</p>
                <p className={styles.url}>{url}</p>
                {errorCode && (
                    <p className={styles.errorCode}>Error code: {errorCode}</p>
                )}
                <div className={styles.actions}>
                    <button
                        className={styles.primaryButton}
                        onClick={handleRetry}
                        aria-label="Retry loading the page"
                    >
                        Try again
                    </button>
                    <button
                        className={styles.secondaryButton}
                        onClick={handleGoHome}
                        aria-label="Navigate to Google homepage"
                    >
                        Go to Google
                    </button>
                </div>
            </div>
        </div>
    );
}
