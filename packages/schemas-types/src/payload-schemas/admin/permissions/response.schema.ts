export interface PermissionListItemResponseType {
    id: number;
    name: string;
    description: string | null;
    roleCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface PermissionDetailResponseType {
    id: number;
    name: string;
    description: string | null;
    roles: { id: number; name: string }[];
    createdAt: string;
    updatedAt: string;
}
