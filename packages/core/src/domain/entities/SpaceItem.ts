export enum SpaceItemType {
    Link = 'link',
    File = 'file',
    Folder = 'folder',
    LocalFolder = 'localFolder',
    LocalFile = 'localFile',
}

export interface SpaceItemEntity {
    readonly id: string;
    readonly spaceId: string;
    readonly parentId: string | null;
    readonly name: string;
    readonly path: string;
    readonly type: SpaceItemType;
    readonly isExpanded: boolean;
    readonly sortOrder: number;
    readonly createdAt: Date;

    readonly faviconUrl: string | null;
    readonly description: string | null;
    readonly visitCount: number;
    readonly lastVisited: Date | null;

    readonly isPinned: boolean;
    readonly pinPosition: number | null;

    readonly localPath: string | null;
    readonly securityBookmark: string | null;
    readonly lastSyncedAt: Date | null;
    readonly isWatching: boolean;
}
