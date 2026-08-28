import { z } from 'zod';
import { AdminCreateUserPayloadValidationSchema } from '@repo/schemas-types/payload-schemas/admin/users/payload.schema';

// UI-only shape: a single role select (the "one role by default" UX decision).
// Composed off the shared payload schema's own field validators rather than
// redefining them, then mapped back to `roleIds: [Number(roleId)]` on submit.
// `roleId` is a string here (not a number) because the shared `SelectField`
// component wires Radix's string-only value/onValueChange straight to the
// form field — converting to a number happens at the payload boundary.
export const CreateUserFormSchema = z.object({
  email: AdminCreateUserPayloadValidationSchema.shape.email,
  name: AdminCreateUserPayloadValidationSchema.shape.name,
  password: AdminCreateUserPayloadValidationSchema.shape.password,
  roleId: z.string().min(1, { message: 'Please select a role' }),
});
export type CreateUserFormValues = z.infer<typeof CreateUserFormSchema>;
