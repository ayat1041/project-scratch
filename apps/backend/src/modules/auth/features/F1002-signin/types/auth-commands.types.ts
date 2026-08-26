// Backend-only auth types.
// All API boundary types (response shapes, link types) live in
// @repo/schemas-types/payload-schemas/auth/Response.type — import from there directly.

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}
