export const SpayceColors = {
    primary: '#6D5AE6',
    backgroundDark: '#0F0B1A',
    surfaceDark: '#1A1628',
    sidebarDark: '#131020',
    accentDark: '#2D2645',
    textPrimary: '#E5E7EB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    borderDark: '#374151',
    borderSubtle: '#1F2937',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
} as const;

export const SpaceThemes = [
    '#6D5AE6', // violet
    '#F59E0B', // amber
    '#10B981', // emerald
    '#EC4899', // pink
    '#3B82F6', // blue
    '#EF4444', // red
    '#6366F1', // indigo
    '#14B8A6', // teal
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#A855F7', // purple
    '#F43F5E', // rose
    '#0EA5E9', // sky
    '#D946EF', // fuchsia
    '#EAB308', // yellow
    '#22C55E', // green
    '#64748B', // slate
    '#DC2626', // crimson
    '#5EEAD4', // mint
    '#FF6B6B', // coral
    '#B794F6', // lavender
    '#FFB088', // peach
    '#4FD1C5', // aqua
] as const;

export type SpayceColorKey = keyof typeof SpayceColors;
export type SpaceThemeColor = (typeof SpaceThemes)[number];
