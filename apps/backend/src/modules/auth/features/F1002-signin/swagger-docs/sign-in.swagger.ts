/**
 * @swagger
 * /api/auth/v1/sign-in:
 *   post:
 *     x-order: 4
 *     summary: Sign in user
 *     description: Authenticate user with email and password
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
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Sign in successful
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
 *                   example: Signin successful
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
 *                         userName:
 *                           type: string
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
 *                 _links:
 *                   type: object
 *                   properties:
 *                     redirectUrl:
 *                       type: string
 *                       example: /dashboard
 *             examples:
 *               signedIn:
 *                 summary: Sign in successful
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                   password: "password123"
 *                 value:
 *                   success: true
 *                   message: "Signin successful"
 *                   data:
 *                     userInfo:
 *                       id: "550e8400-e29b-41d4-a716-446655440000"
 *                       email: "user@example.com"
 *                       userName: "john-doe"
 *                     roles: ["user"]
 *                     permissions: ["user:read_own_profile", "user:update_own_profile"]
 *                     allowedRoutes: ["/dashboard", "/profile", "/settings"]
 *                   _links:
 *                     redirectUrl: "/dashboard"
 *       400:
 *         description: Generic authentication error for missing users, unverified users, and invalid credentials
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
 *               invalidCredentials:
 *                 summary: Invalid sign-in
 *                 description: Same response for missing users, unverified users, and wrong passwords
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                   password: "password123"
 *                 value:
 *                   success: false
 *                   message: "Email or password is incorrect."
 *                   rawErrorMessage: "Email or password is incorrect."
 *                   type: "bad_request"
 *       403:
 *         description: Site context validation errors (wrong portal access)
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
 *               adminWrongPortal:
 *                 summary: Admin in wrong portal
 *                 description: Admin user trying to sign in through main portal instead of admin panel
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                   password: "password123"
 *                 value:
 *                   success: false
 *                   message: "Admin users must sign in through the admin panel"
 *                   rawErrorMessage: "Admin users must sign in through the admin panel"
 *                   details:
 *                     error: "Access denied: Admin portal required"
 *                     hint: "Please use the admin dashboard URL to sign in."
 *                   type: "forbidden"
 *               regularUserInAdmin:
 *                 summary: Regular user in admin portal
 *                 description: Regular user trying to sign in through admin panel
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                   password: "password123"
 *                 value:
 *                   success: false
 *                   message: "Only admin users can sign in through the admin panel"
 *                   rawErrorMessage: "Only admin users can sign in through the admin panel"
 *                   details:
 *                     error: "Access denied: Admin permissions required"
 *                     hint: "Please use the main application URL to sign in."
 *                   type: "forbidden"
 *       422:
 *         description: Validation error (invalid request data)
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
 *                 description: Email or password field is missing
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                   password: "password123"
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   rawErrorMessage: "Required fields are missing"
 *                   details:
 *                     error: "Required field validation failed"
 *                     hint: "Please provide both email and password"
 *                     validationErrors:
 *                       - field: "email"
 *                         message: "Email is required"
 *                         code: "required"
 *                       - field: "password"
 *                         message: "Password is required"
 *                         code: "required"
 *                   type: "validation_error"
 *               invalidEmailFormat:
 *                 summary: Invalid email format
 *                 description: Email format is not valid
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                   password: "password123"
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
 *               passwordTooShort:
 *                 summary: Password requirements not met
 *                 description: Password does not meet minimum requirements
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                   password: "password123"
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   rawErrorMessage: "Password does not meet requirements"
 *                   details:
 *                     error: "Password validation failed"
 *                     hint: "Password must meet the minimum requirements"
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
 *                   password: "password123"
 *                 value:
 *                   success: false
 *                   message: "An internal server error occurred."
 *                   rawErrorMessage: "Database connection failed."
 *                   details:
 *                     error: "Internal server error"
 *                     hint: "Please try again later or contact support if the problem persists."
 *                   type: "server_error"
 */
