/**
 * @swagger
 * /api/auth/v1/check-email-uniqueness:
 *   post:
 *     x-order: 10
 *     summary: Check email availability before signup
 *     description: |
 *       Validates email format and returns whether the email can continue through
 *       signup. The response intentionally exposes only a boolean availability
 *       result; account state details are not returned.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Email availability check completed
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
 *                     isUnique:
 *                       type: boolean
 *                       example: true
 *             examples:
 *               available:
 *                 summary: Email can continue through signup
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                 value:
 *                   success: true
 *                   message: "Available"
 *                   data:
 *                     isUnique: true
 *               unavailable:
 *                 summary: Email is already used by a verified account
 *                 x-requestExample:
 *                   email: "used@example.com"
 *                 value:
 *                   success: true
 *                   message: "Not available"
 *                   data:
 *                     isUnique: false
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
 *               missingEmail:
 *                 summary: Missing email field
 *                 description: Email field is required but not provided
 *                 x-requestExample:
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
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   rawErrorMessage: "Invalid email format"
 *                   details:
 *                     error: "Email format validation failed"
 *                     hint: "Please provide a valid email address (e.g., user@example.com)"
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
