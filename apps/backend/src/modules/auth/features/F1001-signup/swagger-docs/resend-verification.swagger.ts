/**
 * @swagger
 * /api/auth/v1/resend-email-verification:
 *   post:
 *     x-order: 3
 *     summary: Resend email verification
 *     description: |
 *       Resend verification email to user.
 *
 *       **Use Cases:**
 *       - User didn't receive the original verification email
 *       - Original verification link expired
 *       - User needs a new verification link
 *
 *       **Note:** The verification link is only included for local development requests.
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
 *                 description: Email address to resend verification to
 *           examples:
 *             validEmail:
 *               summary: Resend to valid email
 *               value:
 *                 email: "user@example.com"
 *     responses:
 *       200:
 *         description: Verification email resent
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
 *                   description: Verification link (only returned for local development requests)
 *                 _links:
 *                   type: object
 *                   properties:
 *                     redirectUrl:
 *                       type: string
 *             examples:
 *               success:
 *                 summary: Verification email sent
 *                 description: Email sent successfully to unverified user
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                 value:
 *                   success: true
 *                   message: "Verification email resent successfully"
 *                   verificationLink: "http://localhost:3000/auth/verify-email?token=abc123&email=user@example.com"
 *                   _links:
 *                     redirectUrl: "/auth/check-email"
 *       400:
 *         description: User not found or already verified
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
 *                 description: User's email is already verified
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Email is already verified"
 *                   rawErrorMessage: "Email is already verified"
 *                   details:
 *                     error: "This email address has already been verified"
 *                     hint: "You can proceed to sign in."
 *                   type: "bad_request"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             examples:
 *               userNotFound:
 *                 summary: User not found
 *                 description: No user found with the provided email
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Email is not found in our system"
 *                   rawErrorMessage: "Email is not found in our system"
 *                   details:
 *                     error: "No user found with this email address"
 *                     hint: "Please check the email address or register first."
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
 *                 description: Email format is invalid
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
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             examples:
 *               rateLimited:
 *                 summary: Rate limit exceeded
 *                 description: Too many verification emails requested
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "Too many requests"
 *                   rawErrorMessage: "Rate limit exceeded"
 *                   details:
 *                     error: "Too many verification email requests"
 *                     hint: "Please wait a few minutes before requesting another verification email."
 *                   type: "rate_limit"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             examples:
 *               serverError:
 *                 summary: Internal server error
 *                 x-requestExample:
 *                   email: "user@example.com"
 *                 value:
 *                   success: false
 *                   message: "An internal server error occurred"
 *                   rawErrorMessage: "Failed to send verification email"
 *                   details:
 *                     error: "Internal server error"
 *                     hint: "Please try again later."
 *                   type: "server_error"
 */
