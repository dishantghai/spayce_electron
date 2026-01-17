import React from 'react';
import { SpayceColors, SpayceSpacing } from '@spayce/shared/theme';

export function App(): React.ReactElement {
    return (
        <div
            style={{
                display: 'flex',
                width: '100vw',
                height: '100vh',
                backgroundColor: SpayceColors.backgroundDark,
            }}
        >
            {/* Sidebar */}
            <aside
                style={{
                    width: SpayceSpacing.sidebarWidth,
                    height: '100%',
                    backgroundColor: SpayceColors.sidebarDark,
                    borderTopRightRadius: 16,
                    borderBottomRightRadius: 16,
                    boxShadow: '10px 0 30px -5px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Top area */}
                <div
                    style={{
                        flex: 1,
                        padding: SpayceSpacing.md,
                    }}
                >
                    <h1
                        style={{
                            fontSize: 20,
                            fontWeight: 600,
                            color: SpayceColors.textPrimary,
                            marginTop: 40,
                        }}
                    >
                        Spayce
                    </h1>
                    <p
                        style={{
                            fontSize: 12,
                            color: SpayceColors.textMuted,
                            marginTop: 8,
                        }}
                    >
                        Personal Learning Management System
                    </p>
                </div>

                {/* Bottom tab bar placeholder */}
                <div
                    style={{
                        height: SpayceSpacing.bottomTabBarHeight,
                        borderTop: `1px solid ${SpayceColors.borderSubtle}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: `0 ${SpayceSpacing.md}px`,
                    }}
                >
                    <span style={{ color: SpayceColors.textMuted, fontSize: 12 }}>
                        Tab Bar
                    </span>
                </div>
            </aside>

            {/* Main content area */}
            <main
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: SpayceColors.backgroundDark,
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <h2
                        style={{
                            fontSize: 24,
                            fontWeight: 600,
                            color: SpayceColors.textPrimary,
                        }}
                    >
                        Welcome to Spayce
                    </h2>
                    <p
                        style={{
                            fontSize: 14,
                            color: SpayceColors.textSecondary,
                            marginTop: 8,
                        }}
                    >
                        Phase 1: Project Foundation Complete
                    </p>
                    <p
                        style={{
                            fontSize: 12,
                            color: SpayceColors.textMuted,
                            marginTop: 16,
                        }}
                    >
                        Design system tokens loaded • SurrealDB ready • IPC configured
                    </p>
                </div>
            </main>
        </div>
    );
}
