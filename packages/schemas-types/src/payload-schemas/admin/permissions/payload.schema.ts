import { z } from "zod";
import { appPermissionsSchema } from "../../../tables/user-management/app_permissions";

const nameField = appPermissionsSchema.shape.name;

const descriptionField = appPermissionsSchema.shape.description.unwrap();

export const AdminCreatePermissionPayloadValidationSchema = z.object({
    name: nameField,
    description: descriptionField,
}).strict();
export type AdminCreatePermissionPayloadValidationSchemaType = z.infer<typeof AdminCreatePermissionPayloadValidationSchema>;
