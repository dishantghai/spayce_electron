import React from 'react';
import {
    Folder,
    FolderOpen,
    Link,
    File,
    FileText,
    FileCode,
    Image,
    Video,
} from 'lucide-react';
import { SpaceItemType } from '../types';
import { SpayceColors } from '../theme';
import { useFavicon } from '../hooks/useFavicon';
import { extractDomain, getGoogleFaviconUrl } from '../services/FaviconCache';

interface TreeItemIconProps {
    type: SpaceItemType;
    isExpanded?: boolean;
    /** File extension for file type items (e.g., '.md', '.js') */
    extension?: string;
    size?: number;
    /** Accent color from space theme - used for open folders */
    accentColor?: string;
    /** Favicon URL stored in DB for link items */
    faviconUrl?: string | null;
    /** URL of the link item (for lazy favicon loading) */
    itemUrl?: string;
    /** Callback when favicon is resolved (for async DB update) */
    onFaviconResolved?: (faviconUrl: string) => void;
}

// Icon colors from design tokens
const ICON_COLORS = {
    folder: SpayceColors.textMuted, // #6B7280
    link: SpayceColors.info, // #3B82F6
    localFolder: SpayceColors.success, // #10B981
    file: SpayceColors.textSecondary, // #9CA3AF
} as const;

/**
 * Resolves the appropriate icon for a tree item based on its type.
 * Uses lucide-react icons matching the Spayce Flutter design.
 */
export function TreeItemIcon({
    type,
    isExpanded = false,
    extension,
    size = 16,
    accentColor,
    faviconUrl,
    itemUrl,
    onFaviconResolved,
}: TreeItemIconProps): React.ReactElement {
    const iconProps = { size, strokeWidth: 2 };

    switch (type) {
        case SpaceItemType.folder:
            return isExpanded ? (
                <FolderOpen {...iconProps} color={accentColor || ICON_COLORS.folder} />
            ) : (
                <Folder {...iconProps} color={ICON_COLORS.folder} />
            );

        case SpaceItemType.localFolder:
            return isExpanded ? (
                <FolderOpen {...iconProps} color={accentColor || ICON_COLORS.localFolder} />
            ) : (
                <Folder {...iconProps} color={ICON_COLORS.localFolder} />
            );

        case SpaceItemType.link:
            return (
                <LinkIconWithFavicon
                    storedFaviconUrl={faviconUrl}
                    itemUrl={itemUrl}
                    size={size}
                    onFaviconResolved={onFaviconResolved}
                />
            );

        case SpaceItemType.file:
        case SpaceItemType.localFile:
            return getFileIcon(extension, iconProps);

        default:
            return <File {...iconProps} color={ICON_COLORS.file} />;
    }
}

interface LinkIconProps {
    storedFaviconUrl?: string | null;
    itemUrl?: string;
    size: number;
    onFaviconResolved?: (url: string) => void;
}

type FaviconState = 'primary' | 'google' | 'fallback';

/**
 * Link icon with lazy favicon loading and fallback chain:
 * 1. Try DuckDuckGo (primary from useFavicon)
 * 2. On error, try Google Favicon Service
 * 3. On error, show default Link icon
 */
function LinkIconWithFavicon({
    storedFaviconUrl,
    itemUrl,
    size,
    onFaviconResolved,
}: LinkIconProps): React.ReactElement {
    const [faviconState, setFaviconState] = React.useState<FaviconState>('primary');

    const { faviconUrl, isLoading } = useFavicon(
        itemUrl || '',
        storedFaviconUrl || null,
        onFaviconResolved
    );

    const domain = extractDomain(itemUrl || '');
    const googleFaviconUrl = domain ? getGoogleFaviconUrl(domain) : null;

    // Determine which URL to display based on current state
    const displayUrl = React.useMemo(() => {
        if (faviconState === 'primary') return faviconUrl;
        if (faviconState === 'google') return googleFaviconUrl;
        return null;
    }, [faviconState, faviconUrl, googleFaviconUrl]);

    if (isLoading || !displayUrl || faviconState === 'fallback') {
        return <Link size={size} strokeWidth={2} color={ICON_COLORS.link} />;
    }

    return (
        <img
            key={`${displayUrl}-${faviconState}`}
            src={displayUrl}
            alt=""
            style={{
                width: size,
                height: size,
                objectFit: 'contain',
                borderRadius: '2px',
            }}
            onError={() => {
                console.log('[TreeItemIcon] Favicon load error:', {
                    currentState: faviconState,
                    displayUrl,
                    googleFaviconUrl,
                    domain
                });
                // Fallback chain: primary -> google -> fallback icon
                if (faviconState === 'primary' && googleFaviconUrl) {
                    console.log('[TreeItemIcon] Falling back to Google');
                    setFaviconState('google');
                } else {
                    console.log('[TreeItemIcon] Falling back to Link icon');
                    setFaviconState('fallback');
                }
            }}
        />
    );
}

function getFileIcon(
    extension: string | undefined,
    iconProps: { size: number; strokeWidth: number }
): React.ReactElement {
    const color = ICON_COLORS.file;
    const ext = extension?.toLowerCase();

    // Text/document files
    if (ext === '.md' || ext === '.txt' || ext === '.pdf') {
        return <FileText {...iconProps} color={color} />;
    }

    // Code files
    if (
        ext === '.js' ||
        ext === '.ts' ||
        ext === '.jsx' ||
        ext === '.tsx' ||
        ext === '.py' ||
        ext === '.go' ||
        ext === '.rs'
    ) {
        return <FileCode {...iconProps} color={color} />;
    }

    // Image files
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif' || ext === '.webp') {
        return <Image {...iconProps} color={color} />;
    }

    // Video files
    if (ext === '.mp4' || ext === '.mov' || ext === '.webm' || ext === '.avi') {
        return <Video {...iconProps} color={color} />;
    }

    // Default file icon
    return <File {...iconProps} color={color} />;
}
