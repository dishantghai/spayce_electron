export const SpayceSpacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,

    // Layout Constants
    sidebarWidth: 320,
    treeIndent: 16,
    cardWidth: 288,
    spaceIconSize: 32,
    navDotSize: 4,
    bottomTabBarHeight: 60,
    topBarHeight: 56,
} as const;

export type SpayceSpacingKey = keyof typeof SpayceSpacing;
