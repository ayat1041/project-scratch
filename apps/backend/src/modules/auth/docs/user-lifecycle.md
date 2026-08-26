## self-registers via signup

- record created as user in `app_users` (`userOrigin: self_registered`)
- role: `user` — the only role in `SELF_REGISTRABLE_ROLES`
- email must be verified (via `F1001-signup`) before the account can sign in

## created by an admin

- record created as user in `app_users` (`userOrigin: admin_created`)
- role: `admin` or `super_admin`, assigned directly — these roles cannot self-register

## register routes

- there is a single, generic signup route (`POST /api/auth/v1/sign-up`) for all self-registrable roles

## login routes

- login route is the same for all users; the routes available to them afterward differ based on their assigned role's permissions (`getAllowedRoutes`)
- on successful login, the session token carries the userId, email, jti, and familyId

## authorization

- resource-level authorization is role/permission-based (`hasPermission`) plus a per-resource policy check (`authorize` + `PolicyContext`)
- `PolicyContext.resourceOwnerId` lets a policy allow a caller to act on their own resource (see `basePolicy.canAccessOwnResource`)
