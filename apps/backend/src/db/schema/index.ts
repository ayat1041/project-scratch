// user-management
import "module-alias/register";

export { default as appPermissionsTable } from "@/db/schema/user-management/app_permissions";
export { default as appRolesTable } from "@/db/schema/user-management/app_roles";
export { default as appPermissionToRolesTable } from "@/db/schema/user-management/app_permissions_roles";
export { default as appUsersTable } from "@/db/schema/user-management/app_users";
export { default as appUserRolesTable } from "@/db/schema/user-management/app_user_roles";
export { default as appUserRefreshTokensTable } from "@/db/schema/user-management/app_user_refresh_tokens";
export { default as appEmailVerificationTokensTable } from "@/db/schema/user-management/app_email_verification_tokens";

// common-tables
export { default as appActivityLogsTable } from "@/db/schema/common-tables/app_activity_logs";
export { default as appLanguagesTable } from "@/db/schema/common-tables/app_languages";
export { default as appCountriesTable } from "@/db/schema/common-tables/app_countries";
export { default as appStatesTable } from "@/db/schema/common-tables/app_states";
export { default as appCitiesTable } from "@/db/schema/common-tables/app_cities";
export { default as appTimezonesTable } from "@/db/schema/common-tables/app_timezones";

export * from "@/db/schema/relations";
