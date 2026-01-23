export const SpayceAnimations = {
    // Durations (ms)
    quick: 100,
    hover: 150,
    expand: 200,
    sidebarSlide: 250,
    pageTransition: 300,
    fade: 200,

    // Curves
    standardCurve: 'ease-in-out',
    decelerateCurve: 'ease-out',
    accelerateCurve: 'ease-in',
} as const;

export type SpayceAnimationKey = keyof typeof SpayceAnimations;
