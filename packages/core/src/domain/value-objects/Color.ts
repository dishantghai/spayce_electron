export class Color {
    private constructor(public readonly hex: string) { }

    static fromHex(hex: string): Color | null {
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
        return new Color(hex.toUpperCase());
    }

    static fromRGB(r: number, g: number, b: number): Color {
        const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
        const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
        return new Color(`#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase());
    }

    toRGB(): { r: number; g: number; b: number } {
        const hex = this.hex.slice(1);
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
        };
    }

    equals(other: Color): boolean {
        return this.hex === other.hex;
    }
}
