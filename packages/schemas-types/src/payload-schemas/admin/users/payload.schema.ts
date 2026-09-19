import { z } from "zod";
import { appUsersSchema } from "../../../tables/user-management/app_users";

const emailField = appUsersSchema.shape.email;

const nameField = z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(150, { message: "Name cannot exceed 150 characters" });

const passwordField = appUsersSchema.shape.password
    .min(12, { message: "Password must be at least 12 characters" })
    .regex(/^\S*$/, { message: "Password cannot contain spaces" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/, {
        message:
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    });

const roleIdsField = z
    .array(z.number().int())
    .min(1, { message: "At least one role is required" });

export const AdminCreateUserPayloadValidationSchema = z
    .object({
        email: emailField,
        name: nameField,
        password: passwordField,
        roleIds: roleIdsField,
    })
    .strict();
export type AdminCreateUserPayloadValidationSchemaType = z.infer<
    typeof AdminCreateUserPayloadValidationSchema
>;

export const AdminUpdateUserRolesPayloadValidationSchema = z
    .object({
        roleIds: roleIdsField,
    })
    .strict();
export type AdminUpdateUserRolesPayloadValidationSchemaType = z.infer<
    typeof AdminUpdateUserRolesPayloadValidationSchema
>;

export const AdminUpdateUserStatusPayloadValidationSchema = z
    .object({
        isDeleted: z.boolean(),
    })
    .strict();
export type AdminUpdateUserStatusPayloadValidationSchemaType = z.infer<
    typeof AdminUpdateUserStatusPayloadValidationSchema
>;

export const AdminBulkUpdateUserStatusPayloadValidationSchema = z
    .object({
        ids: z.array(z.uuid()).min(1, { message: "At least one user ID is required" }),
        isDeleted: z.boolean(),
    })
    .strict();
export type AdminBulkUpdateUserStatusPayloadValidationSchemaType = z.infer<
    typeof AdminBulkUpdateUserStatusPayloadValidationSchema
>;
