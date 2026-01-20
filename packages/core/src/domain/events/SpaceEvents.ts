import type { DomainEvent } from './DomainEvent';

export class SpaceCreatedEvent implements DomainEvent {
    readonly type = 'space.created' as const;
    readonly timestamp = new Date();
    constructor(readonly payload: { spaceId: string; profileId: string }) { }
}

export class SpaceDeletedEvent implements DomainEvent {
    readonly type = 'space.deleted' as const;
    readonly timestamp = new Date();
    constructor(readonly payload: { spaceId: string; profileId: string }) { }
}

export class SpaceRenamedEvent implements DomainEvent {
    readonly type = 'space.renamed' as const;
    readonly timestamp = new Date();
    constructor(readonly payload: { spaceId: string; oldName: string; newName: string }) { }
}
