import type { DomainEvent } from './DomainEvent';

export class SpaceItemCreatedEvent implements DomainEvent {
    readonly type = 'space-item.created' as const;
    readonly timestamp = new Date();
    constructor(readonly payload: { itemId: string; spaceId: string }) { }
}

export class SpaceItemMovedEvent implements DomainEvent {
    readonly type = 'space-item.moved' as const;
    readonly timestamp = new Date();
    constructor(
        readonly payload: {
            itemId: string;
            fromSpaceId: string;
            toSpaceId: string;
            fromParentId: string | null;
            toParentId: string | null;
        }
    ) { }
}

export class SpaceItemPinnedEvent implements DomainEvent {
    readonly type = 'space-item.pinned' as const;
    readonly timestamp = new Date();
    constructor(readonly payload: { itemId: string; spaceId: string; position: number }) { }
}

export class SpaceItemRenamedEvent implements DomainEvent {
    readonly type = 'space-item.renamed' as const;
    readonly timestamp = new Date();
    constructor(readonly payload: { itemId: string; spaceId: string; oldName: string; newName: string }) { }
}
