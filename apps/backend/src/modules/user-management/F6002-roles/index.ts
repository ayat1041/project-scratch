import {
  listAllRolesController,
  createRolesController,
  updateSingleRoleController,
  deleteSingleRoleController,
  getSingleRoleController,
} from "@/modules/user-management/F6002-roles/controllers/roles.controller";
import rolesRoutes from "@/modules/user-management/F6002-roles/roles.routes";
import { AdminCreateRolePayloadValidationSchema as createRoleSchema } from "@repo/schemas-types/payload-schemas/admin/roles/payload.schema";

export {
  listAllRolesController,
  createRolesController,
  updateSingleRoleController,
  deleteSingleRoleController,
  getSingleRoleController,
  rolesRoutes,
  createRoleSchema,
};
