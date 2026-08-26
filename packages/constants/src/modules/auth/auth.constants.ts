//------------Fixed Roles Constants------------//

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  USER: "user",
};

export const USER_ORIGIN_TYPES = {
  SELF_REGISTERED: "self_registered",
  ADMIN_CREATED: "admin_created",
};

export const ROLE_SCOPE_TYPES = {
  PLATFORM: "platform",
  ADMIN: "admin",
};

export const SELF_REGISTRABLE_ROLES = [ROLES.USER];
export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN];
