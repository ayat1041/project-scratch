import { z } from "zod";
import { appRolesSchema } from "../../../tables/user-management/app_roles";

const nameField = appRolesSchema.shape.name;

const descriptionField = appRolesSchema.shape.description.unwrap();

export const AdminCreateRolePayloadValidationSchema = z.object({
    name: nameField,
    description: descriptionField,
    permissions: z.array(z.number().int()),
}).strict();
export type AdminCreateRolePayloadValidationSchemaType = z.infer<typeof AdminCreateRolePayloadValidationSchema>;
