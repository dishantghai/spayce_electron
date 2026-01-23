export const SpayceShadows = {
    sidebarEmbossed: '10px 0 30px -5px rgba(0, 0, 0, 0.5)',
    cardSubtle: '0 2px 8px rgba(0, 0, 0, 0.2)',
    cardHover: '0 4px 16px rgba(0, 0, 0, 0.3)',
    dropdown: '0 4px 12px rgba(0, 0, 0, 0.4)',
} as const;

export type SpayceShadowKey = keyof typeof SpayceShadows;
