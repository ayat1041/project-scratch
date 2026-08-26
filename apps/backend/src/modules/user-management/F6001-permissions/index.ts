import {
  listAllPermissionsController,
  createPermissionsController,
  getSinglePermissionController,
  updateSinglePermissionController,
} from "@/modules/user-management/F6001-permissions/controllers/permissions.controller";
import permissionsRoutes from "@/modules/user-management/F6001-permissions/permissions.routes";
import { AdminCreatePermissionPayloadValidationSchema as createPermissionSchema } from "@repo/schemas-types/payload-schemas/admin/permissions/payload.schema";

export {
  listAllPermissionsController,
  createPermissionsController,
  getSinglePermissionController,
  permissionsRoutes,
  createPermissionSchema,
  updateSinglePermissionController,
};
