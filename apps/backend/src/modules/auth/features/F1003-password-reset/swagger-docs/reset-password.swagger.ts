/**
 * @swagger
 * /api/auth/v1/reset-password:
 *   post:
 *     x-order: 9
 *     summary: Reset user password
 *     description: Set new password using token from password reset email
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: query
 *         name: siteContext
 *         schema:
 *           type: string
 *           enum: [main, admin]
 *         description: Site context for API testing (optional, for tools like Postman)
 *       - in: header
 *         name: X-Site-Context
 *         schema:
 *           type: string
 *           enum: [main, admin]
 *         description: Site context header for API testing (optional, for tools like Postman)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               token:
 *                 type: string
 *                 description: Reset token from email link
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *           examples:
 *             validReset:
 *               summary: Valid reset password request
 *               value:
 *                 email: "user@example.com"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 password: "NewSecurePass123!"
 *                 confirmPassword: "NewSecurePass123!"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *                 _links:
 *                   type: object
 *                   properties:
 *                     redirectUrl:
 *                       type: string
 *                       example: /auth/signin
 *             examples:
 *               passwordReset:
 *                 summary: Password reset successful
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   password: "NewSecurePass123!"
 *                   confirmPassword: "NewSecurePass123!"
 *                 value:
 *                   success: true
 *                   message: "Password reset successfully"
 *                   _links:
 *                     redirectUrl: "/auth/signin"
 *       400:
 *         description: Token validation errors
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
 *               tokenEmailMismatch:
 *                 summary: Token and email mismatch
 *                 description: The reset token does not match the provided email
 *                 x-requestExample:
 *                   email: "different.user@example.com"
 *                   token: "token-for-another-user"
 *                   password: "NewSecurePass123!"
 *                   confirmPassword: "NewSecurePass123!"
 *                 value:
 *                   success: false
 *                   message: "Token and email mismatch"
 *                   rawErrorMessage: "Token and email mismatch"
 *                   details:
 *                     error: "The verification token does not match the provided email"
 *                     hint: "Please use the correct verification link from your email."
 *                   type: "validation_error"
 *       403:
 *         description: Site context validation errors
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
 *               wrongPortal:
 *                 summary: Wrong portal access
 *                 description: User trying to reset password through incorrect portal
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                   token: "valid-token"
 *                   password: "NewSecurePass123!"
 *                   confirmPassword: "NewSecurePass123!"
 *                 value:
 *                   success: false
 *                   message: "Access denied"
 *                   rawErrorMessage: "Access denied"
 *                   details:
 *                     error: "Portal access validation failed"
 *                     hint: "Please use the correct portal for your account type."
 *                   type: "forbidden"
 *       404:
 *         description: User not found
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
 *               userNotFound:
 *                 summary: User not found
 *                 description: No user found with the provided email address
 *                 x-requestExample:
 *                   email: "unknown.user@example.com"
 *                   token: "some-token"
 *                   password: "NewSecurePass123!"
 *                   confirmPassword: "NewSecurePass123!"
 *                 value:
 *                   success: false
 *                   message: "Email is not found in our system."
 *                   rawErrorMessage: "Email is not found in our system."
 *                   details:
 *                     error: "No user found with the provided email address"
 *                     hint: "Please register first or check the email address."
 *                   type: "not_found"
 *       422:
 *         description: Validation error (invalid request format)
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
 *                     validationErrors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                           message:
 *                             type: string
 *                           code:
 *                             type: string
 *                 type:
 *                   type: string
 *             examples:
 *               passwordMismatch:
 *                 summary: Password confirmation mismatch
 *                 description: Password and confirm password do not match
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                   token: "valid-token"
 *                   password: "NewSecurePass123!"
 *                   confirmPassword: "MismatchPass123!"
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   rawErrorMessage: "Passwords do not match"
 *                   details:
 *                     error: "Password confirmation failed"
 *                     hint: "Please ensure both password fields match"
 *                     validationErrors:
 *                       - field: "confirmPassword"
 *                         message: "Passwords do not match"
 *                         code: "password_mismatch"
 *                   type: "validation_error"
 *               weakPassword:
 *                 summary: Password too weak
 *                 description: Password does not meet minimum security requirements
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                   token: "valid-token"
 *                   password: "short"
 *                   confirmPassword: "short"
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   rawErrorMessage: "Password too weak"
 *                   details:
 *                     error: "Password security requirements not met"
 *                     hint: "Password must be at least 8 characters long"
 *                     validationErrors:
 *                       - field: "password"
 *                         message: "Password must be at least 8 characters"
 *                         code: "min_length"
 *                   type: "validation_error"
 *       500:
 *         description: Internal server error
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
 *               serverError:
 *                 summary: Internal server error
 *                 description: An unexpected error occurred on the server
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                   token: "valid-token"
 *                   password: "NewSecurePass123!"
 *                   confirmPassword: "NewSecurePass123!"
 *                 value:
 *                   success: false
 *                   message: "An internal server error occurred."
 *                   rawErrorMessage: "Database connection failed."
 *                   details:
 *                     error: "Internal server error"
 *                     hint: "Please try again later or contact support if the problem persists."
 *                   type: "server_error"
 */
