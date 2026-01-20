export interface SpaceEntity {
    readonly id: string;
    readonly profileId: string;
    readonly userId: string;
    readonly name: string;
    readonly accentColor: string;
    readonly iconName: string;
    readonly order: number;
    readonly isExpanded: boolean;
    readonly createdAt: Date;
}
