/**
 * @swagger
 * /api/auth/v1/validate-reset-password-link:
 *   post:
 *     x-order: 8
 *     summary: Validate reset password link
 *     description: |
 *       Validate reset password token before showing password reset form.
 *
 *       **Use Cases:**
 *       - Validate token when user clicks reset password link
 *       - Check if token is expired before showing reset form
 *       - Verify token-email pair is valid
 *
 *       **Flow:**
 *       1. User receives password reset email with link containing token and email
 *       2. Frontend calls this endpoint to validate before showing reset form
 *       3. If valid, show password reset form
 *       4. If invalid/expired, show appropriate error message
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - email
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset password token from email link
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address from reset link
 *           examples:
 *             validToken:
 *               summary: Valid token validation
 *               value:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQifQ.xxxxx"
 *                 email: "user@example.com"
 *     responses:
 *       200:
 *         description: Token is valid
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
 *                     isValid:
 *                       type: boolean
 *                       description: Whether the token is valid
 *                     email:
 *                       type: string
 *                       description: Validated email address
 *             examples:
 *               validToken:
 *                 summary: Token validation successful
 *                 description: Token is valid and not expired
 *                 x-requestExample:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQifQ.xxxxx"
 *                   email: "user@example.com"
 *                 value:
 *                   success: true
 *                   message: "Token is valid"
 *                   data:
 *                     isValid: true
 *                     email: "user@example.com"
 *       400:
 *         description: Invalid or expired token
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
 *               expiredToken:
 *                 summary: Token expired
 *                 description: Reset password token has expired
 *                 x-requestExample:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQifQ.xxxxx"
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Reset link has expired"
 *                   rawErrorMessage: "Reset link has expired"
 *                   details:
 *                     error: "The password reset link has expired"
 *                     hint: "Please request a new password reset link."
 *                   type: "bad_request"
 *               invalidToken:
 *                 summary: Invalid token format
 *                 description: Token format is invalid or corrupted
 *                 x-requestExample:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQifQ.xxxxx"
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Invalid reset link"
 *                   rawErrorMessage: "Invalid reset link"
 *                   details:
 *                     error: "The reset token is invalid or malformed"
 *                     hint: "Please use the link from your email or request a new one."
 *                   type: "bad_request"
 *               tokenEmailMismatch:
 *                 summary: Token-email mismatch
 *                 description: Token does not match provided email
 *                 x-requestExample:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQifQ.xxxxx"
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Token and email mismatch"
 *                   rawErrorMessage: "Token and email mismatch"
 *                   details:
 *                     error: "The reset token does not match the provided email"
 *                     hint: "Please use the correct link from your email."
 *                   type: "bad_request"
 *               alreadyUsedToken:
 *                 summary: Token already used
 *                 description: Reset token has already been used
 *                 x-requestExample:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQifQ.xxxxx"
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Reset link already used"
 *                   rawErrorMessage: "Reset link already used"
 *                   details:
 *                     error: "This password reset link has already been used"
 *                     hint: "Request a new password reset if needed."
 *                   type: "bad_request"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             examples:
 *               userNotFound:
 *                 summary: User not found
 *                 description: No user exists with this email
 *                 x-requestExample:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQifQ.xxxxx"
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "User not found"
 *                   rawErrorMessage: "User not found"
 *                   details:
 *                     error: "No user found with this email address"
 *                     hint: "Please check the email address."
 *                   type: "not_found"
 *       422:
 *         description: Validation error
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
 *               missingToken:
 *                 summary: Missing token
 *                 description: Token field is required
 *                 x-requestExample:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQifQ.xxxxx"
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   rawErrorMessage: "Token is required"
 *                   details:
 *                     error: "Required field validation failed"
 *                     hint: "Please use the complete link from your email"
 *                     validationErrors:
 *                       - field: "token"
 *                         message: "Token is required"
 *                         code: "required"
 *                   type: "validation_error"
 *               missingEmail:
 *                 summary: Missing email
 *                 description: Email field is required
 *                 x-requestExample:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQifQ.xxxxx"
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   rawErrorMessage: "Email is required"
 *                   details:
 *                     error: "Required field validation failed"
 *                     hint: "Please provide an email address"
 *                     validationErrors:
 *                       - field: "email"
 *                         message: "Email is required"
 *                         code: "required"
 *                   type: "validation_error"
 *               invalidEmailFormat:
 *                 summary: Invalid email format
 *                 description: Email format is not valid
 *                 x-requestExample:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQifQ.xxxxx"
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   rawErrorMessage: "Invalid email format"
 *                   details:
 *                     error: "Email format validation failed"
 *                     hint: "Please provide a valid email address"
 *                     validationErrors:
 *                       - field: "email"
 *                         message: "Invalid email format"
 *                         code: "invalid_format"
 *                   type: "validation_error"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             examples:
 *               serverError:
 *                 summary: Internal server error
 *                 x-requestExample:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQifQ.xxxxx"
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "An internal server error occurred"
 *                   rawErrorMessage: "Failed to validate token"
 *                   details:
 *                     error: "Internal server error"
 *                     hint: "Please try again later."
 *                   type: "server_error"
 */
