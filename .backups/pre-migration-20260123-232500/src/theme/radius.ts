export const SpayceRadius = {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 999,

    // Component-specific
    button: 8,
    input: 8,
    card: 12,
    sidebar: 16,
    avatar: 999,
    tab: 8,
} as const;

export type SpayceRadiusKey = keyof typeof SpayceRadius;
