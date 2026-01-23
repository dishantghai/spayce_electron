export const SpayceTypography = {
    fontFamily: {
        sans: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        mono: 'JetBrains Mono, Menlo, Monaco, monospace',
    },
    fontSize: {
        xs: 11,
        sm: 12,
        base: 14,
        lg: 16,
        xl: 18,
        '2xl': 20,
        '3xl': 24,
    },
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },
} as const;

export type FontSizeKey = keyof typeof SpayceTypography.fontSize;
export type FontWeightKey = keyof typeof SpayceTypography.fontWeight;
