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
    CONTENT: {
        READ_SITE_SEO_SETTINGS: "content:read_site_seo_settings",
        UPDATE_SITE_SEO_SETTINGS: "content:update_site_seo_settings",
        PUBLISH_SITE_SEO_SETTINGS: "content:publish_site_seo_settings",

        CREATE_SEO_PAGE: "content:create_seo_page",
        READ_SEO_PAGE: "content:read_seo_page",
        UPDATE_SEO_PAGE: "content:update_seo_page",
        PUBLISH_SEO_PAGE: "content:publish_seo_page",
        DELETE_SEO_PAGE: "content:delete_seo_page",
    },
};
