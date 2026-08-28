export interface RolePermissionSummaryType {
    id: number;
    name: string;
    description: string | null;
}

export interface RoleListItemResponseType {
    id: number;
    name: string;
    description: string | null;
    scope: string;
    isSystemRole: boolean;
    permissionCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface RoleDetailResponseType {
    id: number;
    name: string;
    description: string | null;
    scope: string;
    isSystemRole: boolean;
    permissions: RolePermissionSummaryType[];
    createdAt: string;
    updatedAt: string;
}
