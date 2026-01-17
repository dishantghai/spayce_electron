import { describe, it, expect } from 'vitest';
import {
    SpayceColors,
    SpaceThemes,
    SpayceSpacing,
    SpayceRadius,
    SpayceAnimations,
    SpayceShadows,
    SpayceTypography,
} from '../src/theme';

describe('SpayceColors', () => {
    it('should have primary color as #6D5AE6', () => {
        expect(SpayceColors.primary).toBe('#6D5AE6');
    });

    it('should have all core colors defined', () => {
        expect(SpayceColors.backgroundDark).toBe('#0F0B1A');
        expect(SpayceColors.surfaceDark).toBe('#1A1628');
        expect(SpayceColors.sidebarDark).toBe('#131020');
        expect(SpayceColors.accentDark).toBe('#2D2645');
        expect(SpayceColors.textPrimary).toBe('#E5E7EB');
        expect(SpayceColors.textSecondary).toBe('#9CA3AF');
        expect(SpayceColors.textMuted).toBe('#6B7280');
    });

    it('should have status colors', () => {
        expect(SpayceColors.success).toBe('#10B981');
        expect(SpayceColors.warning).toBe('#F59E0B');
        expect(SpayceColors.error).toBe('#EF4444');
        expect(SpayceColors.info).toBe('#3B82F6');
    });
});

describe('SpaceThemes', () => {
    it('should have exactly 24 theme colors', () => {
        expect(SpaceThemes).toHaveLength(24);
    });

    it('should start with violet as first color', () => {
        expect(SpaceThemes[0]).toBe('#6D5AE6');
    });

    it('should have all colors as valid hex strings', () => {
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        SpaceThemes.forEach((color) => {
            expect(color).toMatch(hexRegex);
        });
    });
});

describe('SpayceSpacing', () => {
    it('should have correct spacing scale', () => {
        expect(SpayceSpacing.xs).toBe(4);
        expect(SpayceSpacing.sm).toBe(8);
        expect(SpayceSpacing.md).toBe(16);
        expect(SpayceSpacing.lg).toBe(24);
        expect(SpayceSpacing.xl).toBe(32);
        expect(SpayceSpacing.xxl).toBe(48);
    });

    it('should have critical layout constants', () => {
        expect(SpayceSpacing.sidebarWidth).toBe(320);
        expect(SpayceSpacing.treeIndent).toBe(16);
        expect(SpayceSpacing.cardWidth).toBe(288);
        expect(SpayceSpacing.spaceIconSize).toBe(32);
        expect(SpayceSpacing.navDotSize).toBe(4);
        expect(SpayceSpacing.bottomTabBarHeight).toBe(60);
        expect(SpayceSpacing.topBarHeight).toBe(56);
    });
});

describe('SpayceRadius', () => {
    it('should have correct radius scale', () => {
        expect(SpayceRadius.xs).toBe(4);
        expect(SpayceRadius.sm).toBe(6);
        expect(SpayceRadius.md).toBe(8);
        expect(SpayceRadius.lg).toBe(12);
        expect(SpayceRadius.xl).toBe(16);
        expect(SpayceRadius.xxl).toBe(24);
        expect(SpayceRadius.full).toBe(999);
    });

    it('should have component-specific radii', () => {
        expect(SpayceRadius.button).toBe(8);
        expect(SpayceRadius.input).toBe(8);
        expect(SpayceRadius.card).toBe(12);
        expect(SpayceRadius.sidebar).toBe(16);
        expect(SpayceRadius.avatar).toBe(999);
        expect(SpayceRadius.tab).toBe(8);
    });
});

describe('SpayceAnimations', () => {
    it('should have correct durations in ms', () => {
        expect(SpayceAnimations.quick).toBe(100);
        expect(SpayceAnimations.hover).toBe(150);
        expect(SpayceAnimations.expand).toBe(200);
        expect(SpayceAnimations.sidebarSlide).toBe(250);
        expect(SpayceAnimations.pageTransition).toBe(300);
        expect(SpayceAnimations.fade).toBe(200);
    });

    it('should have easing curves', () => {
        expect(SpayceAnimations.standardCurve).toBe('ease-in-out');
        expect(SpayceAnimations.decelerateCurve).toBe('ease-out');
        expect(SpayceAnimations.accelerateCurve).toBe('ease-in');
    });
});

describe('SpayceShadows', () => {
    it('should have sidebar embossed shadow', () => {
        expect(SpayceShadows.sidebarEmbossed).toBe('10px 0 30px -5px rgba(0, 0, 0, 0.5)');
    });

    it('should have card shadows', () => {
        expect(SpayceShadows.cardSubtle).toBe('0 2px 8px rgba(0, 0, 0, 0.2)');
        expect(SpayceShadows.cardHover).toBe('0 4px 16px rgba(0, 0, 0, 0.3)');
    });

    it('should have dropdown shadow', () => {
        expect(SpayceShadows.dropdown).toBe('0 4px 12px rgba(0, 0, 0, 0.4)');
    });
});

describe('SpayceTypography', () => {
    it('should have font families', () => {
        expect(SpayceTypography.fontFamily.sans).toContain('Inter');
        expect(SpayceTypography.fontFamily.mono).toContain('JetBrains Mono');
    });

    it('should have font sizes', () => {
        expect(SpayceTypography.fontSize.xs).toBe(11);
        expect(SpayceTypography.fontSize.sm).toBe(12);
        expect(SpayceTypography.fontSize.base).toBe(14);
        expect(SpayceTypography.fontSize.lg).toBe(16);
        expect(SpayceTypography.fontSize.xl).toBe(18);
        expect(SpayceTypography.fontSize['2xl']).toBe(20);
        expect(SpayceTypography.fontSize['3xl']).toBe(24);
    });

    it('should have font weights', () => {
        expect(SpayceTypography.fontWeight.normal).toBe('400');
        expect(SpayceTypography.fontWeight.medium).toBe('500');
        expect(SpayceTypography.fontWeight.semibold).toBe('600');
        expect(SpayceTypography.fontWeight.bold).toBe('700');
    });
});
