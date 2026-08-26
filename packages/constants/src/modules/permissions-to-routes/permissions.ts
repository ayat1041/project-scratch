// Central registry of permission strings, grouped by domain. Every permission
// referenced by PERMISSION_TO_ROLES and ROUTES must be defined here — this file is
// the single source of truth for the RBAC permission set.
export const PERMISSIONS = {
    ADMIN: {
        CREATE_PERMISSION: "admin:create_permission",
        READ_PERMISSION: "admin:read_permission",
        UPDATE_PERMISSION: "admin:update_permission",
        DELETE_PERMISSION: "admin:delete_permission",

        CREATE_ROLE: "admin:create_role",
        READ_ROLE: "admin:read_role",
        UPDATE_ROLE: "admin:update_role",
        DELETE_ROLE: "admin:delete_role",

        CREATE_USER: "admin:create_user",
        READ_USER: "admin:read_user",
        UPDATE_USER: "admin:update_user",
        DELETE_USER: "admin:delete_user",

        ADMINISTRATION_ACCESS: "admin:administration_access",
    },
    USER: {
        READ_OWN_PROFILE: "user:read_own_profile",
        UPDATE_OWN_PROFILE: "user:update_own_profile",
    },
    COMMON: {
        READ_LANGUAGE: "common:read_language",
        CREATE_LANGUAGE: "common:create_language",
        UPDATE_LANGUAGE: "common:update_language",
        DELETE_LANGUAGE: "common:delete_language",
    },
};
