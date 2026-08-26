/**
 * @swagger
 * /api/auth/v1/verify-email:
 *   post:
 *     x-order: 2
 *     summary: Verify user email
 *     description: Verify user email using token from verification email
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
 *                 description: Verification token from email
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Email verification successful
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     userInfo:
 *                       $ref: '#/components/schemas/User'
 *                     allowedRoutes:
 *                       type: array
 *                       items:
 *                         type: string
 *                 _links:
 *                   type: object
 *                   properties:
 *                     redirectUrl:
 *                       type: string
 *             examples:
 *               verified:
 *                 summary: Email verified
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                 value:
 *                   success: true
 *                   message: "Email verified successfully"
 *                   data:
 *                     userInfo:
 *                       id: "550e8400-e29b-41d4-a716-446655440000"
 *                       email: "user@example.com"
 *                       userName: "John Doe"
 *                       roles: ["user"]
 *                       permissions: ["user:read_own_profile"]
 *                     allowedRoutes: ["/dashboard"]
 *                   _links:
 *                     redirectUrl: "/auth/welcome"
 *       400:
 *         description: Token validation errors (mismatch, role issues, etc.)
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
 *                 description: The verification token does not match the provided email
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Something went wrong"
 *                   rawErrorMessage: "Something went wrong"
 *                   details:
 *                     error: "The verification token does not match the provided email"
 *                     hint: "Please use the correct verification link from your email."
 *                   type: "validation_error"
 *               roleMismatch:
 *                 summary: Token role mismatch
 *                 description: The verification token role does not match the user's role
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Something went wrong"
 *                   rawErrorMessage: "Something went wrong"
 *                   details:
 *                     error: "The verification token role does not match user's role"
 *                     hint: "Please contact support for assistance."
 *                   type: "validation_error"
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
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Email is not found in our system."
 *                   rawErrorMessage: "Email is not found in our system."
 *                   details:
 *                     error: "No user found with the provided email address"
 *                     hint: "Please register first or check the email address."
 *                   type: "not_found"
 *       409:
 *         description: Email already verified
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
 *               alreadyVerified:
 *                 summary: Email already verified
 *                 description: The email address has already been verified
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Email is already verified. Please login."
 *                   rawErrorMessage: "Email is already verified. Please login."
 *                   details:
 *                     error: "The email address has already been verified"
 *                     hint: "Please proceed to login instead of requesting verification again."
 *                   type: "conflict"
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
 *               missingFields:
 *                 summary: Missing required fields
 *                 description: Token or email field is missing
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   rawErrorMessage: "Required fields are missing"
 *                   details:
 *                     error: "Required field validation failed"
 *                     hint: "Please provide both token and email"
 *                     validationErrors:
 *                       - field: "token"
 *                         message: "Token is required"
 *                         code: "required"
 *                       - field: "email"
 *                         message: "Email is required"
 *                         code: "required"
 *                   type: "validation_error"
 *               invalidEmailFormat:
 *                 summary: Invalid email format
 *                 description: Email format is not valid
 *                 x-requestExample:
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
 *                 value:
 *                   success: false
 *                   message: "An internal server error occurred."
 *                   rawErrorMessage: "Database connection failed."
 *                   details:
 *                     error: "Internal server error"
 *                     hint: "Please try again later or contact support if the problem persists."
 *                   type: "server_error"
 */
