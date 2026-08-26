/**
 * @swagger
 * /api/auth/v1/oauth/linkedin:
 *   get:
 *     x-order: 14
 *     summary: Initiate LinkedIn OAuth sign-in
 *     description: |
 *       Redirect to LinkedIn OAuth authorization URL.
 *
 *       **OAuth Flow:**
 *       1. User clicks "Sign in with LinkedIn"
 *       2. Frontend redirects to this endpoint
 *       3. Server redirects to LinkedIn's OAuth consent screen
 *       4. User grants permission
 *       5. LinkedIn redirects back to callback endpoint
 *     tags:
 *       - Authentication
 *       - OAuth
 *     parameters:
 *       - in: query
 *         name: redirect
 *         schema:
 *           type: string
 *         description: URL to redirect after successful authentication
 *         example: "/dashboard"
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user]
 *         description: Role for new user registration (optional)
 *     responses:
 *       302:
 *         description: Redirect to LinkedIn OAuth
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             description: LinkedIn OAuth authorization URL
 *             example: "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=xxx&redirect_uri=xxx&scope=openid%20profile%20email&state=xxx"
 *       400:
 *         description: OAuth configuration error
 *         content:
 *           application/json:
 *             examples:
 *               missingConfig:
 *                 summary: Missing OAuth configuration
 *                 description: LinkedIn OAuth is not properly configured
 *                 value:
 *                   success: false
 *                   message: "OAuth configuration error"
 *                   rawErrorMessage: "OAuth configuration error"
 *                   details:
 *                     error: "LinkedIn OAuth is not configured"
 *                     hint: "Please contact support."
 *                   type: "bad_request"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             examples:
 *               serverError:
 *                 summary: Failed to initiate OAuth
 *                 value:
 *                   success: false
 *                   message: "Failed to initiate LinkedIn OAuth"
 *                   rawErrorMessage: "Failed to initiate LinkedIn OAuth"
 *                   details:
 *                     error: "Internal server error"
 *                     hint: "Please try again later."
 *                   type: "server_error"
 *
 * /api/auth/v1/oauth/linkedin/callback:
 *   get:
 *     x-order: 15
 *     summary: LinkedIn OAuth callback
 *     description: |
 *       Handle LinkedIn OAuth callback and complete authentication.
 *
 *       **Behavior:**
 *       - If user exists: Signs them in
 *       - If user doesn't exist: Creates new account and signs them in
 *       - Sets session cookie on successful authentication
 *     tags:
 *       - Authentication
 *       - OAuth
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth authorization code from LinkedIn
 *         example: "AQR7..."
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: OAuth state parameter (contains redirect URL and role)
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Error code if user denied access
 *       - in: query
 *         name: error_description
 *         schema:
 *           type: string
 *         description: Human-readable error description
 *     responses:
 *       200:
 *         description: OAuth authentication successful
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
 *                       $ref: '#/components/schemas/User'
 *                     allowedRoutes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     isNewUser:
 *                       type: boolean
 *                       description: Whether this is a new user registration
 *                 _links:
 *                   type: object
 *                   properties:
 *                     redirectUrl:
 *                       type: string
 *             examples:
 *               existingUser:
 *                 summary: Existing user sign in
 *                 description: User already has an account
 *                 value:
 *                   success: true
 *                   message: "LinkedIn authentication successful"
 *                   data:
 *                     userInfo:
 *                       id: "550e8400-e29b-41d4-a716-446655440000"
 *                       email: "user@company.com"
 *                       userName: "john-doe"
 *                       profileImage: "https://media.licdn.com/..."
 *                       roles: ["user"]
 *                       permissions: ["user:read_own_profile", "user:update_own_profile"]
 *                       isVerified: true
 *                     allowedRoutes:
 *                       - "/dashboard"
 *                       - "/profile"
 *                     isNewUser: false
 *                   _links:
 *                     redirectUrl: "/dashboard"
 *               newUser:
 *                 summary: New user registration
 *                 description: User created via LinkedIn OAuth
 *                 value:
 *                   success: true
 *                   message: "Account created successfully via LinkedIn"
 *                   data:
 *                     userInfo:
 *                       id: "660e8400-e29b-41d4-a716-446655440001"
 *                       email: "newuser@company.com"
 *                       userName: "jane-smith"
 *                       profileImage: "https://media.licdn.com/..."
 *                       roles: ["user"]
 *                       permissions: ["user:read_own_profile", "user:update_own_profile"]
 *                       isVerified: true
 *                     allowedRoutes:
 *                       - "/onboarding"
 *                       - "/profile"
 *                     isNewUser: true
 *                   _links:
 *                     redirectUrl: "/onboarding"
 *       400:
 *         description: OAuth error or invalid code
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
 *               accessDenied:
 *                 summary: User denied access
 *                 description: User refused to grant OAuth permissions
 *                 value:
 *                   success: false
 *                   message: "LinkedIn authentication cancelled"
 *                   rawErrorMessage: "user_cancelled_authorize"
 *                   details:
 *                     error: "OAuth access was denied by user"
 *                     hint: "Please grant required permissions to sign in with LinkedIn."
 *                   type: "bad_request"
 *               invalidCode:
 *                 summary: Invalid authorization code
 *                 description: The OAuth code is invalid or expired
 *                 value:
 *                   success: false
 *                   message: "Invalid OAuth code"
 *                   rawErrorMessage: "Invalid OAuth code"
 *                   details:
 *                     error: "The authorization code is invalid or has expired"
 *                     hint: "Please try signing in again."
 *                   type: "bad_request"
 *               missingCode:
 *                 summary: Missing authorization code
 *                 description: No code parameter in callback
 *                 value:
 *                   success: false
 *                   message: "Missing authorization code"
 *                   rawErrorMessage: "Missing authorization code"
 *                   details:
 *                     error: "OAuth callback missing required code parameter"
 *                     hint: "Please try signing in again."
 *                   type: "bad_request"
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             examples:
 *               tokenExchangeFailed:
 *                 summary: Token exchange failed
 *                 description: Failed to exchange code for token
 *                 value:
 *                   success: false
 *                   message: "LinkedIn authentication failed"
 *                   rawErrorMessage: "Token exchange failed"
 *                   details:
 *                     error: "Failed to authenticate with LinkedIn"
 *                     hint: "Please try again or use a different sign-in method."
 *                   type: "unauthorized"
 *               unverifiedEmail:
 *                 summary: Unverified LinkedIn email
 *                 description: LinkedIn account email is not verified
 *                 value:
 *                   success: false
 *                   message: "LinkedIn email not verified"
 *                   rawErrorMessage: "LinkedIn email not verified"
 *                   details:
 *                     error: "Your LinkedIn account email is not verified"
 *                     hint: "Please verify your LinkedIn account email first."
 *                   type: "unauthorized"
 *       409:
 *         description: Email already registered with different method
 *         content:
 *           application/json:
 *             examples:
 *               emailExists:
 *                 summary: Email registered with password
 *                 description: User already exists with email/password authentication
 *                 value:
 *                   success: false
 *                   message: "Email already registered"
 *                   rawErrorMessage: "Email already registered"
 *                   details:
 *                     error: "An account with this email already exists using email/password sign-in"
 *                     hint: "Please sign in with your email and password instead."
 *                   type: "conflict"
 *               linkedInEmailConflict:
 *                 summary: Email registered with Google
 *                 description: User already exists with Google authentication
 *                 value:
 *                   success: false
 *                   message: "Email already registered with another provider"
 *                   rawErrorMessage: "Email already registered with another provider"
 *                   details:
 *                     error: "An account with this email already exists using Google sign-in"
 *                     hint: "Please sign in with Google instead."
 *                   type: "conflict"
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
 *                   rawErrorMessage: "Failed to complete LinkedIn authentication"
 *                   details:
 *                     error: "Internal server error"
 *                     hint: "Please try again later."
 *                   type: "server_error"
 */
