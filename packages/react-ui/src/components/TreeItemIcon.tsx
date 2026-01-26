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

interface TreeItemIconProps {
    type: SpaceItemType;
    isExpanded?: boolean;
    /** File extension for file type items (e.g., '.md', '.js') */
    extension?: string;
    size?: number;
    /** Accent color from space theme - used for open folders */
    accentColor?: string;
    /** Favicon URL for link items */
    faviconUrl?: string | null;
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
            return <LinkIconWithFavicon faviconUrl={faviconUrl} size={size} />;

        case SpaceItemType.file:
        case SpaceItemType.localFile:
            return getFileIcon(extension, iconProps);

        default:
            return <File {...iconProps} color={ICON_COLORS.file} />;
    }
}

/**
 * Link icon with favicon fallback chain:
 * 1. Try provided faviconUrl
 * 2. On error, use Link icon (no more attempts)
 */
function LinkIconWithFavicon({ faviconUrl, size }: { faviconUrl?: string | null; size: number }): React.ReactElement {
    const [showIcon, setShowIcon] = React.useState(!faviconUrl);

    if (!faviconUrl || showIcon) {
        return <Link size={size} strokeWidth={2} color={ICON_COLORS.link} />;
    }

    return (
        <img
            src={faviconUrl}
            alt=""
            style={{
                width: size,
                height: size,
                objectFit: 'contain',
                borderRadius: '2px',
            }}
            onError={() => {
                setShowIcon(true);
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
