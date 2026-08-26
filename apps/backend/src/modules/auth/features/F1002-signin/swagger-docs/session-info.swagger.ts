/**
 * @swagger
 * /api/auth/v1/session-info:
 *   get:
 *     x-order: 5
 *     summary: Get current session information
 *     description: |
 *       Retrieve authenticated user's session details and allowed routes.
 *
 *       **Use Cases:**
 *       - Verify if user is still authenticated
 *       - Get user's current roles and permissions
 *       - Fetch allowed routes for frontend navigation
 *       - Get detailed user information with `includeDetails=true`
 *     tags:
 *       - Authentication
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include detailed user information (profile image, etc.)
 *     responses:
 *       200:
 *         description: Session info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userInfo:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                           format: email
 *                         userName:
 *                           type: string
 *                         profileImage:
 *                           type: string
 *                           format: uri
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     allowedRoutes:
 *                       type: array
 *                       items:
 *                         type: string
 *             examples:
 *               regularUser:
 *                 summary: Regular user session
 *                 description: Session info for a self-registered user
 *                 value:
 *                   success: true
 *                   message: "Session info retrieved successfully"
 *                   data:
 *                     userInfo:
 *                       id: "550e8400-e29b-41d4-a716-446655440000"
 *                       email: "user@example.com"
 *                       userName: "john-doe"
 *                       profileImage: "https://storage.example.com/profiles/john.jpg"
 *                     roles: ["user"]
 *                     permissions: ["user:read_own_profile", "user:update_own_profile"]
 *                     allowedRoutes:
 *                       - "/dashboard"
 *                       - "/profile"
 *                       - "/settings"
 *               adminUser:
 *                 summary: Admin user session
 *                 description: Session info for an admin user
 *                 value:
 *                   success: true
 *                   message: "Session info retrieved successfully"
 *                   data:
 *                     userInfo:
 *                       id: "770e8400-e29b-41d4-a716-446655440002"
 *                       email: "admin@example.com"
 *                       userName: "admin-user"
 *                     roles: ["admin", "super_admin"]
 *                     permissions: ["admin:administration_access", "admin:read_user"]
 *                     allowedRoutes:
 *                       - "/dashboard"
 *                       - "/dashboard/users"
 *                       - "/dashboard/roles-and-permissions"
 *                       - "/dashboard/settings"
 *               basicInfo:
 *                 summary: Basic session info (without details)
 *                 description: Minimal session info when includeDetails is false
 *                 value:
 *                   success: true
 *                   message: "Session info retrieved successfully"
 *                   data:
 *                     userInfo:
 *                       id: "550e8400-e29b-41d4-a716-446655440000"
 *                       email: "user@example.com"
 *                     roles: ["user"]
 *                     allowedRoutes:
 *                       - "/dashboard"
 *                       - "/profile"
 *       401:
 *         description: Unauthorized - No valid session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 rawErrorMessage:
 *                   type: string
 *                 details:
 *                   type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                     hint:
 *                       type: string
 *                 type:
 *                   type: string
 *             examples:
 *               noSession:
 *                 summary: No active session
 *                 description: User is not authenticated
 *                 value:
 *                   success: false
 *                   message: "Authentication required"
 *                   rawErrorMessage: "Authentication required"
 *                   details:
 *                     error: "No valid session found"
 *                     hint: "Please sign in to access this resource."
 *                   type: "unauthorized"
 *               expiredSession:
 *                 summary: Session expired
 *                 description: User session has expired
 *                 value:
 *                   success: false
 *                   message: "Session expired"
 *                   rawErrorMessage: "Session expired"
 *                   details:
 *                     error: "Your session has expired"
 *                     hint: "Please sign in again to continue."
 *                   type: "unauthorized"
 *               invalidToken:
 *                 summary: Invalid session token
 *                 description: Session token is invalid or tampered
 *                 value:
 *                   success: false
 *                   message: "Invalid session"
 *                   rawErrorMessage: "Invalid session"
 *                   details:
 *                     error: "Session token is invalid"
 *                     hint: "Please sign in again."
 *                   type: "unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             examples:
 *               serverError:
 *                 summary: Internal server error
 *                 value:
 *                   success: false
 *                   message: "An internal server error occurred"
 *                   rawErrorMessage: "Failed to retrieve session info"
 *                   details:
 *                     error: "Internal server error"
 *                     hint: "Please try again later or contact support."
 *                   type: "server_error"
 */
