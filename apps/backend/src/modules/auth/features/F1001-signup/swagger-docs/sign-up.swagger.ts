/**
 * @swagger
 * /api/auth/v1/sign-up:
 *   post:
 *     x-order: 1
 *     summary: Register new user
 *     description: Create a new user account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 12
 *                 example: "P@ssw0rd1234"
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 12
 *                 example: "P@ssw0rd1234"
 *               role:
 *                 type: string
 *                 enum: [user]
 *           examples:
 *             signup:
 *               summary: Self-service signup payload
 *               value:
 *                 name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 password: "P@ssw0rd1234"
 *                 confirmPassword: "P@ssw0rd1234"
 *                 role: "user"
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 verificationLink:
 *                   type: string
 *                   description: Verification link (only in non-production environments)
 *                 _links:
 *                   type: object
 *                   properties:
 *                     redirectUrl:
 *                       type: string
 *             examples:
 *               registered:
 *                 summary: Registration successful
 *                 x-requestExample:
 *                   name: "John Doe"
 *                   email: "john.doe@example.com"
 *                   password: "P@ssw0rd1234"
 *                   confirmPassword: "P@ssw0rd1234"
 *                   role: "user"
 *                 value:
 *                   success: true
 *                   message: "Signup successful"
 *                   verificationLink: "https://app.example.com/auth/verify-email?token=abc&email=john.doe@example.com"
 *                   _links:
 *                     redirectUrl: ""
 *       409:
 *         description: Conflict (email already exists)
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
 *               emailAlreadyExists:
 *                 summary: Email already exists
 *                 description: A verified user with this email already exists
 *                 x-requestExample:
 *                   name: "John Doe"
 *                   email: "existing.user@example.com"
 *                   password: "P@ssw0rd1234"
 *                   confirmPassword: "P@ssw0rd1234"
 *                   role: "user"
 *                 value:
 *                   success: false
 *                   message: "This email is already in use. Want to log in?"
 *                   rawErrorMessage: "This email is already in use. Want to log in?"
 *                   details:
 *                     error: "A verified user with this email already exists"
 *                     hint: "Please use a different email or try signing in."
 *                   type: "conflict"
 *       422:
 *         description: Validation error (invalid data format or unsupported role)
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
 *               unsupportedRole:
 *                 summary: Unsupported role
 *                 description: Only self-registrable roles are accepted at signup
 *                 x-requestExample:
 *                   name: "Some User"
 *                   email: "some.user@example.com"
 *                   password: "P@ssw0rd1234"
 *                   confirmPassword: "P@ssw0rd1234"
 *                   role: "admin"
 *                 value:
 *                   success: false
 *                   message: "Something went wrong"
 *                   rawErrorMessage: "Something went wrong"
 *                   details:
 *                     error: "User attempting to sign up with role: admin. Allowed roles: user"
 *                     hint: "Please select a self-registrable role for registration."
 *                   type: "validation_error"
 *               passwordMismatch:
 *                 summary: Password confirmation mismatch
 *                 description: Password and confirm password do not match
 *                 x-requestExample:
 *                   name: "John Doe"
 *                   email: "john.doe@example.com"
 *                   password: "P@ssw0rd1234"
 *                   confirmPassword: "DifferentPass1234"
 *                   role: "user"
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
 *                   name: "John Doe"
 *                   email: "john.doe@example.com"
 *                   password: "P@ssw0rd1234"
 *                   confirmPassword: "P@ssw0rd1234"
 *                   role: "user"
 *                 value:
 *                   success: false
 *                   message: "An internal server error occurred."
 *                   rawErrorMessage: "Database connection failed."
 *                   details:
 *                     error: "Internal server error"
 *                     hint: "Please try again later or contact support if the problem persists."
 *                   type: "server_error"
 */
