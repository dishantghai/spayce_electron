export class DataSanitizer {
    static sanitizeString(input: string, maxLength = 1000): string {
        if (!input || typeof input !== 'string') {
            return '';
        }

        return input
            .trim()
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/data:/gi, '')
            .slice(0, maxLength);
    }

    static sanitizeUrl(input: string): string {
        if (!input || typeof input !== 'string') {
            return '';
        }

        const trimmed = input.trim();

        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            return `https://${trimmed}`.slice(0, 2048);
        }

        return trimmed.slice(0, 2048);
    }

    static sanitizeFileName(input: string): string {
        if (!input || typeof input !== 'string') {
            return '';
        }

        return input
            .trim()
            .replace(/[<>:"|?*]/g, '')
            .replace(/\.\./g, '')
            .slice(0, 255);
    }
}
