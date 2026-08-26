export const onRegisterVerificationEmail = ({
  verificationLink,
  name,
}: {
  email: string;
  verificationLink: string;
  name: string;
}) => {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify Your Email - Starter</title>
    <style type="text/css">
        /* Reset styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            font-family: BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background-color: #f6f6f6;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            width: 100% !important;
            min-width: 100%;
        }
        
        table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
            max-width: 100%;
        }
        
        /* Container styles */
        .email-container {
            width: 100% !important;
            max-width: 640px !important;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #CBD5E1;
        }
        
        .header {
            border-radius: 10px 10px 0 0;
            background-color: #1A33B2;
            padding: 12px 16px;
        }
        
        .header-text {
            color: #fff !important;
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            line-height: 150%;
            text-align: center;
        }
        
        .content {
            padding: 20px 16px;
        }
        
        .greeting {
            color: #323232;
            font-size: 16px;
            margin: 0 0 20px 0;
            line-height: 1.4;
        }
        
        .main-text {
            color: #323232;
            font-size: 16px;
            margin: 0 0 20px 0;
            line-height: 1.4;
        }
        
        .verification-section {
            text-align: left;
            margin: 24px 0;
        }
        
        .cta-button {
            background-color: #1A33B2 !important;
            border: 1px solid #2A43C2;
            color: #EDEFF3 !important;
            padding: 16px 20px;
            text-decoration: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 500;
            display: inline-block;
            width: auto;
            min-width: 120px;
            text-align: center;
        }
        
        .disclaimer {
            color: #323232;
            font-size: 14px;
            margin: 20px 0;
            line-height: 1.4;
        }
        
        .footer {
            padding-top: 24px;
            text-align: left;
        }
        
        .footer-text {
            color: #323232;
            font-size: 16px;
            margin: 0 0 8px 0;
            line-height: 1.4;
        }
        
        .footer-links {
            margin: 16px 0;
        }
        
        .footer-links a {
            color: #1A33B2;
            text-decoration: none;
            font-size: 16px;
        }
        
        .footer-links span {
            color: #323232;
            margin: 0 8px;
        }
        
        .divider {
            margin: 30px 0;
            border: none;
            height: 1px;
            background-color: #CBD5E1;
        }
        
        /* Mobile styles */
        @media screen and (max-width: 640px) {
            .email-container {
                width: 100% !important;
                margin: 0 !important;
            }
            
            .content {
                padding: 16px 12px !important;
            }
            
            .header-text {
                font-size: 16px !important;
            }
            
            .greeting,
            .main-text {
                font-size: 14px !important;
            }
            
            .cta-button {
                padding: 12px 16px !important;
                font-size: 15px !important;
            }
        }
    </style>
</head>
<body class="body">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f6f6; padding: 20px 0;">
        <tr>
            <td align="center" style="padding: 0;">
                <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 640px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <tr>
                        <td class="header">
                            <p class="header-text">🚀 Starter</p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td class="content">
                            <p class="greeting">Welcome, ${name}!</p>
                            
                            <p class="main-text">
                                Thank you for joining Starter! To complete your registration, please verify your email address by clicking the button below.
                            </p>
                            
                            <div class="verification-section">
                                <a href="${verificationLink}" class="cta-button">Verify Email Address</a>
                            </div>
                            
                            <p class="disclaimer" style="margin-top: 24px;">
                                This verification link will expire in 15 minutes. If you did not sign up for Starter, please ignore this email.
                            </p>
                            
                            <p class="footer-text">Best Regards,</p>
                            <p class="footer-text"><strong>Starter Team</strong></p>
                            
                            <hr class="divider" />
                            
                            <div class="footer">
                                <p class="footer-text">
                                    Need help? Contact us at <strong>support@example.com</strong>
                                </p>
                                <p class="footer-text">© 2025 Starter. All rights reserved.</p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

export const onResetPasswordVerificationEmail = ({
  email,
  verificationLink,
}: {
  email: string;
  verificationLink: string;
}) => {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset Your Password - Starter</title>
    <style type="text/css">
        /* Reset styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            font-family: BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background-color: #f6f6f6;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            width: 100% !important;
            min-width: 100%;
        }
        
        table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        .email-container {
            width: 100% !important;
            max-width: 640px !important;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #CBD5E1;
        }
        
        .header {
            border-radius: 10px 10px 0 0;
            background-color: #1A33B2;
            padding: 12px 16px;
        }
        
        .header-text {
            color: #fff !important;
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            line-height: 150%;
            text-align: center;
        }
        
        .content {
            padding: 20px 16px;
        }
        
        .greeting {
            color: #323232;
            font-size: 16px;
            margin: 0 0 20px 0;
            line-height: 1.4;
        }
        
        .main-text {
            color: #323232;
            font-size: 16px;
            margin: 0 0 20px 0;
            line-height: 1.4;
        }
        
        .code-section {
            background-color: #F0F4FF;
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
        }
        
        .code-text {
            color: #323232;
            font-size: 14px;
            margin: 0 0 12px 0;
        }
        
        .verification-code {
            color: #1A33B2;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 4px;
            margin: 12px 0;
        }
        
        .divider {
            margin: 30px 0;
            border: none;
            height: 1px;
            background-color: #CBD5E1;
        }
        
        .footer-text {
            color: #323232;
            font-size: 16px;
            margin: 0 0 8px 0;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f6f6; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td class="header">
                            <p class="header-text">🔐 Starter - Password Reset</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td class="content">
                            <p class="greeting">Hi ${email},</p>
                            
                            <p class="main-text">
                                We received a request to reset the password for your Starter account associated with <strong>${email}</strong>.
                            </p>
                            
                            <div class="code-section">
                                <p class="code-text">Your verification link is:</p>
                                <p class="verification-code">${verificationLink}</p>
                                <p class="code-text" style="font-size: 12px; margin-top: 12px;">This link will expire in 15 minutes.</p>
                            </div>
                            
                            <p class="main-text">
                                If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                            </p>
                            
                            <hr class="divider" />
                            
                            <p class="footer-text">Best Regards,</p>
                            <p class="footer-text"><strong>Starter Team</strong></p>
                            <p class="footer-text" style="font-size: 14px; margin-top: 20px;">© 2025 Starter. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

export const onRegisterWelcomeEmail = ({
  name,
}: {
  email: string;
  name: string;
}) => {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to Starter! 🎉</title>
    <style type="text/css">
        /* Reset styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            font-family: BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background-color: #f6f6f6;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            width: 100% !important;
            min-width: 100%;
        }
        
        table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        .email-container {
            width: 100% !important;
            max-width: 640px !important;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #CBD5E1;
        }
        
        .header {
            border-radius: 10px 10px 0 0;
            background-color: #1A33B2;
            padding: 24px 16px;
        }
        
        .header-text {
            color: #fff !important;
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            line-height: 150%;
            text-align: center;
        }
        
        .content {
            padding: 20px 16px;
        }
        
        .greeting {
            color: #323232;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 20px 0;
            line-height: 1.4;
        }
        
        .main-text {
            color: #323232;
            font-size: 16px;
            margin: 0 0 20px 0;
            line-height: 1.4;
        }
        
        .welcome-section {
            margin: 24px 0;
            padding: 20px;
            background-color: #F0F4FF;
            border-radius: 12px;
            border-left: 4px solid #1A33B2;
        }
        
        .welcome-title {
            color: #1A33B2;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 12px 0;
        }
        
        .feature-item {
            color: #323232;
            font-size: 16px;
            margin: 0 0 12px 0;
            line-height: 1.6;
            padding-left: 24px;
            position: relative;
        }
        
        .feature-item::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #1A33B2;
            font-weight: 700;
        }
        
        .cta-button {
            background-color: #1A33B2 !important;
            border: 1px solid #2A43C2;
            color: #EDEFF3 !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 500;
            display: inline-block;
            width: auto;
            min-width: 160px;
            text-align: center;
        }
        
        .divider {
            margin: 30px 0;
            border: none;
            height: 1px;
            background-color: #CBD5E1;
        }
        
        .footer-text {
            color: #323232;
            font-size: 16px;
            margin: 0 0 8px 0;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f6f6; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td class="header">
                            <p class="header-text">🎉 Welcome to Starter!</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td class="content">
                            <p class="greeting">Welcome, ${name}!</p>
                            
                            <p class="main-text">
                                You've successfully joined Starter! We're thrilled to have you on board.
                            </p>
                            
                            <div class="welcome-section">
                                <p class="welcome-title">What's Next?</p>
                                <p class="feature-item">Complete your profile</p>
                                <p class="feature-item">Explore your dashboard</p>
                                <p class="feature-item" style="margin-bottom: 0;">Reach out to support any time you have a question</p>
                            </div>
                            
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="http://localhost:3000" class="cta-button">Go to Dashboard</a>
                            </div>
                            
                            <p class="main-text">
                                Ready to get started? Head over to your dashboard whenever you're ready.
                            </p>
                            
                            <hr class="divider" />
                            
                            <p class="footer-text">Best Regards,</p>
                            <p class="footer-text"><strong>Starter Team</strong></p>
                            <p class="footer-text" style="font-size: 14px; margin-top: 20px;">© 2025 Starter. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

