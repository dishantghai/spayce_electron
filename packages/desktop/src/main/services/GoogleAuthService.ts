import { shell } from 'electron';
import http from 'http';
import url from 'url';

/**
 * Google OAuth Service for Desktop Apps
 * 
 * Uses the loopback IP address flow (127.0.0.1) which is Google's recommended
 * approach for desktop applications. This opens the auth flow in the user's
 * system browser (which Google trusts) and captures the redirect via a local server.
 * 
 * @see https://developers.google.com/identity/protocols/oauth2/native-app
 */

interface AuthResult {
    success: boolean;
    code?: string;
    error?: string;
}

export class GoogleAuthService {
    private server: http.Server | null = null;
    private authPromise: Promise<AuthResult> | null = null;

    /**
     * Start Google OAuth flow
     * Opens system browser for authentication and captures the redirect
     * 
     * @param targetUrl - The Google auth URL the user was trying to access
     * @returns Promise with auth result
     */
    async startAuthFlow(targetUrl: string): Promise<AuthResult> {
        // If auth is already in progress, return existing promise
        if (this.authPromise) {
            return this.authPromise;
        }

        this.authPromise = this.performAuth(targetUrl);
        const result = await this.authPromise;
        this.authPromise = null;
        return result;
    }

    private async performAuth(targetUrl: string): Promise<AuthResult> {
        return new Promise((resolve) => {
            // Find an available port
            const server = http.createServer((req, res) => {
                const parsedUrl = url.parse(req.url || '', true);

                // Handle the OAuth callback
                if (parsedUrl.pathname === '/oauth/callback' || parsedUrl.pathname === '/') {
                    const code = parsedUrl.query.code as string;
                    const error = parsedUrl.query.error as string;

                    // Send a nice response to the browser
                    res.writeHead(200, { 'Content-Type': 'text/html' });

                    if (code) {
                        res.end(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>Authentication Successful</title>
                                <style>
                                    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
                                           display: flex; justify-content: center; align-items: center;
                                           height: 100vh; margin: 0; background: #1a1a2e; color: white; }
                                    .container { text-align: center; }
                                    h1 { color: #6d5ae6; }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <h1>✓ Authentication Successful</h1>
                                    <p>You can close this window and return to Spayce.</p>
                                    <script>setTimeout(() => window.close(), 2000);</script>
                                </div>
                            </body>
                            </html>
                        `);

                        this.cleanup();
                        resolve({ success: true, code });
                    } else if (error) {
                        res.end(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>Authentication Failed</title>
                                <style>
                                    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                                           display: flex; justify-content: center; align-items: center;
                                           height: 100vh; margin: 0; background: #1a1a2e; color: white; }
                                    .container { text-align: center; }
                                    h1 { color: #e74c3c; }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <h1>✗ Authentication Failed</h1>
                                    <p>${error}</p>
                                    <p>Please try again in Spayce.</p>
                                </div>
                            </body>
                            </html>
                        `);

                        this.cleanup();
                        resolve({ success: false, error });
                    } else {
                        // No code or error - might be initial redirect, just acknowledge
                        res.end('Waiting for authentication...');
                    }
                } else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            });

            // Listen on a random available port
            server.listen(0, '127.0.0.1', () => {
                const address = server.address();
                if (!address || typeof address === 'string') {
                    resolve({ success: false, error: 'Failed to start local server' });
                    return;
                }

                const port = address.port;
                const redirectUri = `http://127.0.0.1:${port}`;

                console.log(`[GoogleAuthService] Started local server on ${redirectUri}`);

                this.server = server;

                // Open the target URL in system browser
                // The user will authenticate there and Google will redirect back to our local server
                shell.openExternal(targetUrl);

                // Timeout after 5 minutes
                setTimeout(() => {
                    if (this.server) {
                        console.log('[GoogleAuthService] Auth timeout');
                        this.cleanup();
                        resolve({ success: false, error: 'Authentication timeout' });
                    }
                }, 5 * 60 * 1000);
            });

            server.on('error', (err) => {
                console.error('[GoogleAuthService] Server error:', err);
                resolve({ success: false, error: err.message });
            });
        });
    }

    private cleanup(): void {
        if (this.server) {
            this.server.close();
            this.server = null;
            console.log('[GoogleAuthService] Cleaned up local server');
        }
    }

    /**
     * Check if this is a Google auth URL
     */
    static isGoogleAuthUrl(urlStr: string): boolean {
        const googleAuthPatterns = [
            'accounts.google.com/signin',
            'accounts.google.com/v3/signin',
            'accounts.google.com/o/oauth2',
            'accounts.google.com/ServiceLogin',
            'accounts.google.com/AccountChooser',
            'accounts.google.com/CheckCookie',
        ];

        const lowerUrl = urlStr.toLowerCase();
        return googleAuthPatterns.some(pattern => lowerUrl.includes(pattern.toLowerCase()));
    }
}

// Singleton instance
let googleAuthServiceInstance: GoogleAuthService | null = null;

export function getGoogleAuthService(): GoogleAuthService {
    if (!googleAuthServiceInstance) {
        googleAuthServiceInstance = new GoogleAuthService();
    }
    return googleAuthServiceInstance;
}
