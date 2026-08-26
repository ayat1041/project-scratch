/**
 * @swagger
 * /api/auth/v1/forgot-password:
 *   post:
 *     x-order: 7
 *     summary: Request password reset
 *     description: Send password reset link to user email
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
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Generic reset request response. The response is the same whether the account exists, is unverified, or is missing.
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
 *               genericResponse:
 *                 summary: Reset request accepted
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                 value:
 *                   success: true
 *                   message: "If an account exists for that email, a password reset link will be sent."
 *                   _links:
 *                     redirectUrl: "/auth/forgot-password"
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
