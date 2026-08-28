export interface UserListItemResponseType {
    id: string;
    email: string;
    userName: string;
    roles: string[];
    isVerified: boolean;
    isDeleted: boolean;
    registeredAt: string;
}

export interface UserRoleSummaryType {
    id: number;
    name: string;
}

export interface UserDetailResponseType {
    id: string;
    email: string;
    userName: string;
    profileImage: string | null;
    providerName: string;
    userOrigin: string;
    invitedBy: string | null;
    isVerified: boolean;
    isDeleted: boolean;
    registeredAt: string;
    roles: UserRoleSummaryType[];
    permissions: string[];
}
