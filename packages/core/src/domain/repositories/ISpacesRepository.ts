import type { SpaceEntity } from '../entities/Space';

export interface ISpacesRepository {
    getAllSpaces(profileId: string): Promise<SpaceEntity[]>;
    getSpaceById(id: string): Promise<SpaceEntity | null>;
    searchSpaces(profileId: string, query: string): Promise<SpaceEntity[]>;

    createSpace(space: Omit<SpaceEntity, 'createdAt'>): Promise<SpaceEntity>;
    updateSpace(space: SpaceEntity): Promise<void>;
    deleteSpace(id: string): Promise<void>;
    reorderSpaces(profileId: string, orderedIds: string[]): Promise<void>;
}
