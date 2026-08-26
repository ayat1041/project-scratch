/**
 * @swagger
 * /api/auth/v1/sign-out:
 *   post:
 *     x-order: 6
 *     summary: Sign out user
 *     description: |
 *       End user session and clear authentication cookies.
 *
 *       **Features:**
 *       - Single device sign out (default)
 *       - All devices sign out using `allDevices=true` query parameter
 *       - Clears session token cookies
 *     tags:
 *       - Authentication
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: allDevices
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Sign out from all devices (invalidates all active sessions)
 *         example: false
 *     responses:
 *       200:
 *         description: Sign out successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 _links:
 *                   type: object
 *                   properties:
 *                     redirectUrl:
 *                       type: string
 *             examples:
 *               singleDeviceSignOut:
 *                 summary: Single device sign out
 *                 description: User signed out from current device only
 *                 value:
 *                   success: true
 *                   message: "signed out successfully"
 *                   _links:
 *                     redirectUrl: "/"
 *               allDevicesSignOut:
 *                 summary: All devices sign out
 *                 description: User signed out from all devices
 *                 value:
 *                   success: true
 *                   message: "signed out from all devices successfully"
 *                   _links:
 *                     redirectUrl: "/"
 *       400:
 *         description: Already logged out or invalid session
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
 *               alreadyLoggedOut:
 *                 summary: Already logged out
 *                 description: User is not currently logged in
 *                 value:
 *                   success: false
 *                   message: "No active session found"
 *                   rawErrorMessage: "No active session found"
 *                   details:
 *                     error: "User is not logged in"
 *                     hint: "You are already signed out."
 *                   type: "bad_request"
 *               invalidSession:
 *                 summary: Invalid session
 *                 description: Session token is invalid or corrupted
 *                 value:
 *                   success: false
 *                   message: "Invalid session"
 *                   rawErrorMessage: "Invalid session"
 *                   details:
 *                     error: "Session validation failed"
 *                     hint: "Please sign in again."
 *                   type: "bad_request"
 *       401:
 *         description: Unauthorized - No valid session token
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
 *               noSessionToken:
 *                 summary: No session token
 *                 description: No session token provided in cookies
 *                 value:
 *                   success: false
 *                   message: "Authentication required"
 *                   rawErrorMessage: "Authentication required"
 *                   details:
 *                     error: "No authentication token found"
 *                     hint: "Please sign in first."
 *                   type: "unauthorized"
 *               expiredSession:
 *                 summary: Expired session
 *                 description: Session has expired
 *                 value:
 *                   success: false
 *                   message: "Session expired"
 *                   rawErrorMessage: "Session expired"
 *                   details:
 *                     error: "Your session has expired"
 *                     hint: "Please sign in again to continue."
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
 *                   rawErrorMessage: "Failed to invalidate session"
 *                   details:
 *                     error: "Internal server error"
 *                     hint: "Please try again later."
 *                   type: "server_error"
 */
