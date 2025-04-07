// server/index.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const SibApiV3Sdk = require("@getbrevo/brevo");
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const { query, where, getDocs } = require("firebase-admin/firestore");

// Initialize Firebase Admin
console.log("Initializing Firebase Admin...");
try {
    const serviceAccount = require("./firebase-admin-key.json"); // You'll need to place your key file here
    console.log("Service account loaded successfully");

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully");
} catch (error) {
    console.error("Firebase Admin initialization error:", error);
    process.exit(1);
}

// Rate limiters
const emailVerificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        success: false,
        error: "Too many verification attempts. Please try again after 15 minutes.",
        type: "rate_limit_error",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const accountCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
        success: false,
        error: "Too many account creation attempts. Please try again after an hour.",
        type: "rate_limit_error",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const emailSendLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 emails per hour
    message: {
        success: false,
        error: "Too many email requests. Please try again after an hour.",
        type: "rate_limit_error",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Debug environment variables
console.log("Environment check:", {
    BREVO_API_KEY: process.env.BREVO_API_KEY ?
        `${process.env.BREVO_API_KEY.substring(0, 10)}...` : "Missing",
    BREVO_API_KEY_LENGTH: process.env.BREVO_API_KEY ?
        process.env.BREVO_API_KEY.length : 0,
    SENDER_EMAIL: process.env.SENDER_EMAIL || "Missing",
    SENDER_NAME: process.env.SENDER_NAME || "Missing",
});

// Validate environment variables before starting server
function validateEnvironmentVariables() {
    const required = {
        BREVO_API_KEY: process.env.BREVO_API_KEY ?
            `${process.env.BREVO_API_KEY.substring(0, 10)}...` : "Missing",
        SENDER_EMAIL: process.env.SENDER_EMAIL,
        SENDER_NAME: process.env.SENDER_NAME,
    };

    const missing = Object.entries(required)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        console.error(
            `Missing required environment variables: ${missing.join(", ")}`
        );
        process.exit(1);
    }

    // Validate API key format
    if (!process.env.BREVO_API_KEY.startsWith("xkeysib-")) {
        console.error('Invalid API key format. Must start with "xkeysib-"');
        process.exit(1);
    }
}

validateEnvironmentVariables();

// Debug what we get from Brevo
// console.log("Brevo object:", Object.keys(SibApiV3Sdk));

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Test endpoint to verify server is running
app.get("/api/test", (req, res) => {
    res.json({ message: "Server is running!" });
});

// Function to generate secure verification code
const generateSecureVerificationCode = () => {
    // Generate 6 random bytes and convert to a 6-digit number
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0);
    return String(num % 1000000).padStart(6, "0");
};

// Function to generate secure company ID
const generateSecureCompanyId = (email) => {
    // Get first 5 letters of email (before @), convert to uppercase
    const prefix = email.split("@")[0].slice(0, 5).toUpperCase();

    // Generate 8 random bytes for the numeric part
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0);
    const numbers = String(num % 100000000).padStart(8, "0");

    return `${prefix}-${numbers}`;
};

app.post("/api/send-email", emailSendLimiter, async(req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: "Email and verification code are required",
            });
        }

        let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        let apiKey = apiInstance.authentications["apiKey"];
        apiKey.apiKey = process.env.BREVO_API_KEY;

        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        // Set up verification code email
        sendSmtpEmail.subject = "Your Verification Code";
        sendSmtpEmail.htmlContent = `
            <html>
                <body>
                    <h1>Your Verification Code</h1>
                    <p>Here is your verification code: <strong>${code}</strong></p>
                    <p>This code will expire in 5 minutes.</p>
                </body>
            </html>`;

        sendSmtpEmail.sender = {
            name: process.env.SENDER_NAME || "Bookly",
            email: process.env.SENDER_EMAIL,
        };

        sendSmtpEmail.to = [{
            email: email,
            name: email.split("@")[0],
        }, ];

        sendSmtpEmail.replyTo = {
            email: process.env.SENDER_EMAIL,
            name: process.env.SENDER_NAME || "Bookly Support",
        };

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("Verification code sent successfully");

        return res.status(200).json({
            success: true,
            message: "Verification code sent successfully!",
        });
    } catch (error) {
        console.error("Email sending error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send verification code",
            error: error.message,
        });
    }
});

// Add new endpoint to list all users
app.get("/api/list-users", async(req, res) => {
    try {
        console.log("Attempting to list users...");

        // Set a longer timeout for the Firebase request
        const timeout = 120000; // 120 seconds

        // Create a promise that rejects after timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Request timeout")), timeout);
        });

        // Create the actual Firebase request promise with pagination
        const firebasePromise = (async() => {
            try {
                // Get users in smaller batches to avoid timeout
                const batchSize = 100;
                let lastUser = null;
                const allUsers = [];

                while (true) {
                    let query = admin.auth().listUsers(batchSize);
                    if (lastUser) {
                        query = admin.auth().listUsers(batchSize, lastUser.uid);
                    }

                    const result = await query;
                    allUsers.push(...result.users);

                    if (!result.pageToken) {
                        break; // No more users
                    }

                    lastUser = result.users[result.users.length - 1];

                    // Add a small delay between batches to prevent rate limiting
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }

                return { users: allUsers };
            } catch (error) {
                console.error("Firebase listUsers error:", error);
                throw error;
            }
        })();

        // Race between the timeout and the actual request
        const listUsersResult = await Promise.race([
            firebasePromise,
            timeoutPromise,
        ]);

        console.log(`Successfully retrieved ${listUsersResult.users.length} users`);

        const users = listUsersResult.users.map((userRecord) => ({
            email: userRecord.email,
            emailVerified: userRecord.emailVerified,
            disabled: userRecord.disabled,
            creationTime: userRecord.metadata.creationTime,
        }));

        console.log("👥 All registered users in Firebase Auth:");
        users.forEach((user) => {
            console.log(`- Email: ${user.email}`);
            console.log(`  Created: ${user.creationTime}`);
            console.log(`  Verified: ${user.emailVerified ? "✅" : "❌"}`);
            console.log("  ---");
        });

        return res.status(200).json({
            success: true,
            users: users,
        });
    } catch (error) {
        console.error("Detailed error listing users:", error);

        // Check if it's a timeout error
        if (
            error.message === "Request timeout" ||
            error.code === "DEADLINE_EXCEEDED"
        ) {
            return res.status(504).json({
                success: false,
                error: "Request timed out. Please try again.",
                type: "timeout",
            });
        }

        // Check if it's a Firebase Auth error
        if (error.code === "auth/invalid-credential") {
            return res.status(401).json({
                success: false,
                error: "Invalid Firebase credentials. Please check your service account.",
                type: "auth_error",
            });
        }

        // Handle rate limiting errors
        if (
            error.code === "auth/quota-exceeded" ||
            error.code === "auth/too-many-requests"
        ) {
            return res.status(429).json({
                success: false,
                error: "Too many requests. Please try again later.",
                type: "rate_limit",
            });
        }

        return res.status(500).json({
            success: false,
            error: error.message || "Internal server error",
            type: "server_error",
        });
    }
});

// Add new endpoint to verify token
app.post("/api/verify-token", emailVerificationLimiter, async(req, res) => {
    try {
        const { email, tokenId, uid } = req.body;

        if (!email || !tokenId || !uid) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields",
                type: "validation_error",
            });
        }

        // Get the verification token document
        const tokenRef = admin
            .firestore()
            .collection("agencies")
            .doc(uid)
            .collection("email_verification_token")
            .doc(tokenId);

        const tokenDoc = await tokenRef.get();

        if (!tokenDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Verification token not found",
                type: "token_error",
            });
        }

        const tokenData = tokenDoc.data();
        const now = new Date();
        const expiresAt = tokenData.expiresAt.toDate();

        // Check if token is expired
        if (now > expiresAt) {
            // Delete expired token
            await tokenRef.delete();
            return res.status(401).json({
                success: false,
                error: "Verification token has expired",
                type: "token_error",
            });
        }

        // Check if token has already been used
        if (tokenData.status === "used") {
            return res.status(403).json({
                success: false,
                error: "This verification code has already been used",
                type: "token_error",
            });
        }

        // Verify email matches
        if (tokenData.email !== email) {
            return res.status(403).json({
                success: false,
                error: "Email mismatch",
                type: "validation_error",
            });
        }

        // Check if token has already been used
        if (tokenData.status === "verified" || tokenData.status === "used") {
            return res.status(403).json({
                success: false,
                error: "This verification code has already been used",
                type: "token_error",
            });
        }

        // Mark token as verified
        await tokenRef.update({
            status: "verified",
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(200).json({
            success: true,
            message: "Token verified successfully",
        });
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to verify token",
            type: "server_error",
        });
    }
});

// Add new endpoint to create account
app.post("/api/create-account", accountCreationLimiter, async(req, res) => {
    try {
        const { email, password, uid, tokenId } = req.body;

        if (!email || !password || !uid || !tokenId) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields",
                type: "validation_error",
            });
        }

        // Get the verification token document
        const tokenRef = admin
            .firestore()
            .collection("agencies")
            .doc(uid)
            .collection("email_verification_token")
            .doc(tokenId);

        const tokenDoc = await tokenRef.get();

        if (!tokenDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Verification token not found",
                type: "token_error",
            });
        }

        const tokenData = tokenDoc.data();

        // Check if token is verified
        if (tokenData.status !== "verified") {
            return res.status(403).json({
                success: false,
                error: "Email not verified",
                type: "verification_error",
            });
        }

        // Check if token is expired
        const now = new Date();
        const expiresAt = tokenData.expiresAt.toDate();
        if (now > expiresAt) {
            await tokenRef.delete();
            return res.status(401).json({
                success: false,
                error: "Verification token has expired",
                type: "token_error",
            });
        }

        // Verify email matches
        if (tokenData.email !== email) {
            return res.status(403).json({
                success: false,
                error: "Email mismatch",
                type: "validation_error",
            });
        }

        // Create Firebase Auth user
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            uid: uid, // Use the same UID from Firestore
        });

        // Update Firestore document
        await admin.firestore().collection("agencies").doc(uid).update({
            authUID: uid,
            email: email,
            emailVerified: true,
            onboarded: false,
            // createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Delete the verification token
        await tokenRef.delete();

        // Sign out any existing sessions for this user
        try {
            await admin.auth().revokeRefreshTokens(uid);
            console.log("Successfully revoked tokens for user:", uid);
        } catch (signOutError) {
            console.error("Error revoking tokens:", signOutError);
            // Don't throw error as account creation was successful
        }

        // Create a custom token for the new user
        try {
            const customToken = await admin.auth().createCustomToken(uid);
            console.log("Successfully created custom token for user:", uid);

            return res.status(200).json({
                success: true,
                message: "Account created successfully",
                user: {
                    uid: userRecord.uid,
                    email: userRecord.email,
                    emailVerified: userRecord.emailVerified,
                    customToken: customToken, // Send custom token instead of password
                },
            });
        } catch (tokenError) {
            console.error("Error creating custom token:", tokenError);
            // Still return success but without token
            return res.status(200).json({
                success: true,
                message: "Account created successfully, but session creation failed",
                user: {
                    uid: userRecord.uid,
                    email: userRecord.email,
                    emailVerified: userRecord.emailVerified,
                },
            });
        }
    } catch (error) {
        console.error("Account creation error:", error);

        // Handle specific Firebase errors
        if (error.code === "auth/email-already-exists") {
            return res.status(409).json({
                success: false,
                error: "Email already registered",
                type: "auth_error",
            });
        }
        if (error.code === "auth/invalid-password") {
            return res.status(400).json({
                success: false,
                error: "Invalid password format",
                type: "validation_error",
            });
        }

        return res.status(500).json({
            success: false,
            error: "Failed to create account",
            type: "server_error",
        });
    }
});

// Add new endpoint for requesting verification code
app.post("/api/request-verification", emailSendLimiter, async(req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Email is required",
                type: "validation_error",
            });
        }

        // First, check if there's an existing document with this email
        const agenciesRef = admin.firestore().collection("agencies");
        const emailQuery = await agenciesRef.where("email", "==", email).get();
        let companyId;

        if (!emailQuery.empty) {
            // Use the existing document's ID
            companyId = emailQuery.docs[0].id;
            console.log("Found existing company document:", companyId);

            // Update the existing document's timestamp
            await agenciesRef.doc(companyId).update({
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        } else {
            // Generate new company ID and create new document
            companyId = generateSecureCompanyId(email);
            console.log("Generated new company ID:", companyId);

            // Store in Firestore
            const companyDocData = {
                email,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            // Create the company document
            await agenciesRef.doc(companyId).set(companyDocData);
        }

        // Generate secure verification code
        const code = generateSecureVerificationCode();

        // Generate a secure token ID
        const tokenId = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;

        // Create verification token
        const tokenData = {
            email,
            verificationCode: code,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            status: "pending_verification",
            tokenId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Delete any existing tokens
        const existingTokens = await admin
            .firestore()
            .collection("agencies")
            .doc(companyId)
            .collection("email_verification_token")
            .get();

        // Delete all existing tokens in parallel
        await Promise.all(existingTokens.docs.map((doc) => doc.ref.delete()));

        // Add new verification token
        await admin
            .firestore()
            .collection("agencies")
            .doc(companyId)
            .collection("email_verification_token")
            .doc(tokenId)
            .set(tokenData);

        // Send verification email
        let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        let apiKey = apiInstance.authentications["apiKey"];
        apiKey.apiKey = process.env.BREVO_API_KEY;

        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = "Verify your email";
        sendSmtpEmail.htmlContent = `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
            <head>
            <title></title>
            <meta charset="UTF-8" />
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <!--[if !mso]>-->
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <!--<![endif]-->
            <meta name="x-apple-disable-message-reformatting" content="" />
            <meta content="target-densitydpi=device-dpi" name="viewport" />
            <meta content="true" name="HandheldFriendly" />
            <meta content="width=device-width" name="viewport" />
            <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
            <style type="text/css">
            table {
            border-collapse: separate;
            table-layout: fixed;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt
            }
            table td {
            border-collapse: collapse
            }
            .ExternalClass {
            width: 100%
            }
            .ExternalClass,
            .ExternalClass p,
            .ExternalClass span,
            .ExternalClass font,
            .ExternalClass td,
            .ExternalClass div {
            line-height: 100%
            }
            body, a, li, p, h1, h2, h3 {
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
            }
            html {
            -webkit-text-size-adjust: none !important
            }
            body, #innerTable {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale
            }
            #innerTable img+div {
            display: none;
            display: none !important
            }
            img {
            Margin: 0;
            padding: 0;
            -ms-interpolation-mode: bicubic
            }
            h1, h2, h3, p, a {
            line-height: inherit;
            overflow-wrap: normal;
            white-space: normal;
            word-break: break-word
            }
            a {
            text-decoration: none
            }
            h1, h2, h3, p {
            min-width: 100%!important;
            width: 100%!important;
            max-width: 100%!important;
            display: inline-block!important;
            border: 0;
            padding: 0;
            margin: 0
            }
            a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important
            }
            u + #body a {
            color: inherit;
            text-decoration: none;
            font-size: inherit;
            font-family: inherit;
            font-weight: inherit;
            line-height: inherit;
            }
            a[href^="mailto"],
            a[href^="tel"],
            a[href^="sms"] {
            color: inherit;
            text-decoration: none
            }
            </style>
            <style type="text/css">
            @media (min-width: 481px) {
            .hd { display: none!important }
            }
            </style>
            <style type="text/css">
            @media (max-width: 480px) {
            .hm { display: none!important }
            }
            </style>
            <style type="text/css">
            @media (max-width: 480px) {
            .t12,.t18,.t23,.t6{font-family:Outfit,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif!important}.t36,.t41{mso-line-height-alt:20px!important;line-height:20px!important}.t37{padding:20px!important}.t39{width:343px!important}.t17{mso-line-height-alt:18px!important;line-height:18px!important}.t12{font-size:16px!important}.t27{text-align:left!important}.t26{vertical-align:top!important;width:600px!important}.t23{line-height:15px!important;font-size:12px!important;color:#858585!important;mso-text-raise:1px!important}
            }
            </style>
            <!--[if !mso]>-->
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&amp;family=Outfit:wght@400;700&amp;family=Open+Sans:wght@400&amp;family=Roboto:wght@400&amp;family=Lato:wght@400&amp;display=swap" rel="stylesheet" type="text/css" />
            <!--<![endif]-->
            <!--[if mso]>
            <xml>
            <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
            </xml>
            <![endif]-->
            </head>
            <body id="body" class="t44" style="min-width:100%;Margin:0px;padding:0px;background-color:#FFFFFF;"><div class="t43" style="background-color:#FFFFFF;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td class="t42" style="font-size:0;line-height:0;mso-line-height-rule:exactly;background-color:#FFFFFF;" valign="top" align="center">
            <!--[if mso]>
            <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false">
            <v:fill color="#FFFFFF"/>
            </v:background>
            <![endif]-->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" id="innerTable"><tr><td><div class="t36" style="mso-line-height-rule:exactly;mso-line-height-alt:30px;line-height:30px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
            <table class="t40" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="439" class="t39" style="background-color:#FFFFFF;border:2px solid #DFE1E4;overflow:hidden;width:439px;border-radius:10px 10px 10px 10px;">
            <table class="t38" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t37" style="padding:44px 42px 32px 42px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100% !important;"><tr><td align="left">
            <table class="t4" role="presentation" cellpadding="0" cellspacing="0" style="Margin-right:auto;"><tr><td width="42" class="t3" style="background-color:#FFFFFF;overflow:hidden;width:42px;border-radius:5px 5px 5px 5px;">
            <!-- TODO: Add logo -->
            <table class="t2" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t1"><div style="font-size:0px;"><img class="t0" style="display:block;border:0;height:auto;width:100%;Margin:0;max-width:100%;" width="42" height="42" alt="Logo" src="https://b5a58eb5-3c2d-482c-b8de-b433ef4dd5a8.b-cdn.net/e/d409689b-90f5-4949-8c54-ab34af5ead84/1aaa3b40-17a2-485f-90f6-f1ee26f001bd.png"/></div></td></tr></table>
            </td></tr></table>
            </td></tr><tr><td><div class="t5" style="mso-line-height-rule:exactly;mso-line-height-alt:30px;line-height:30px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
            <table class="t10" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="351" class="t9" style="border-bottom:2px solid #DFE1E4;width:600px;">
            <table class="t8" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t7" style="padding:0 0 30px 0;"><h1 class="t6" style="margin:0;Margin:0;font-family:Outfit, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, sans-serif;line-height:28px;font-weight:700;font-style:normal;font-size:24px;text-decoration:none;text-transform:none;letter-spacing:-1px;direction:ltr;color:#141414;text-align:left;mso-line-height-rule:exactly;mso-text-raise:1px;">Verify your email</h1></td></tr></table>
            </td></tr></table>
            </td></tr><tr><td><div class="t11" style="mso-line-height-rule:exactly;mso-line-height-alt:30px;line-height:30px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
            <table class="t16" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="351" class="t15" style="width:600px;">
            <table class="t14" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t13"><p class="t12" style="margin:0;Margin:0;font-family:Outfit, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, sans-serif;line-height:25px;font-weight:400;font-style:normal;font-size:15px;text-decoration:none;text-transform:none;letter-spacing:-0.1px;direction:ltr;color:#141414;text-align:left;mso-line-height-rule:exactly;mso-text-raise:3px;">We need to verify your email address <span style="color: #0000EE; text-decoration: underline;">${email}</span> before you can access your account. Enter the code below in your open browser window.</p></td></tr></table>
            </td></tr></table>
            </td></tr><tr><td><div class="t17" style="mso-line-height-rule:exactly;mso-line-height-alt:20px;line-height:20px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="left">
            <table class="t22" role="presentation" cellpadding="0" cellspacing="0" style="Margin-right:auto;"><tr><td width="351" class="t21" style="width:600px;">
            <table class="t20" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t19"><h1 class="t18" style="margin:0;Margin:0;font-family:Outfit, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, sans-serif;line-height:34px;font-weight:400;font-style:normal;font-size:28px;text-decoration:none;text-transform:none;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;letter-spacing: 10px;">${code}</h1></td></tr></table>
            </td></tr></table>
            </td></tr><tr><td><div class="t31" style="mso-line-height-rule:exactly;mso-line-height-alt:30px;line-height:30px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
            <table class="t35" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="351" class="t34" style="border-top:2px solid #DFE1E4;width:600px;">
            <table class="t33" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t32" style="padding:30px 0 0 0;"><div class="t30" style="width:100%;text-align:left;"><div class="t29" style="display:inline-block;"><table class="t28" role="presentation" cellpadding="0" cellspacing="0" align="left" valign="top">
            <tr class="t27"><td></td><td class="t26" width="351" valign="top">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t25" style="width:100%;"><tr><td class="t24"><p class="t23" style="margin:0;Margin:0;font-family:Outfit, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, sans-serif;line-height:22px;font-weight:400;font-style:normal;font-size:16px;text-decoration:none;text-transform:none;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">This code expires in 5 minutes.<br/><br/>If you didn't sign up for Bookly, you can safely ignore this email. Someone else might have typed your email address by mistake.</p></td></tr></table>
            </td>
            <td></td></tr>
            </table></div></div></td></tr></table>
            </td></tr></table>
            </td></tr></table></td></tr></table>
            </td></tr></table>
            </td></tr><tr><td><div class="t41" style="mso-line-height-rule:exactly;mso-line-height-alt:30px;line-height:30px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr></table></td></tr></table></div><div class="gmail-fix" style="display: none; white-space: nowrap; font: 15px courier; line-height: 0;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</div></body>
            </html>`;

        sendSmtpEmail.sender = {
            name: process.env.SENDER_NAME || "Bookly",
            email: process.env.SENDER_EMAIL,
        };

        sendSmtpEmail.to = [{
            email: email,
            name: email.split("@")[0],
        }, ];

        sendSmtpEmail.replyTo = {
            email: process.env.SENDER_EMAIL,
            name: process.env.SENDER_NAME || "Bookly Support",
        };

        await apiInstance.sendTransacEmail(sendSmtpEmail);

        return res.status(200).json({
            success: true,
            message: "Verification code sent successfully",
            uid: companyId,
            tokenId: tokenId,
        });
    } catch (error) {
        console.error("Verification request error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to process verification request",
            type: "server_error",
        });
    }
});

// Add new endpoint for resending verification code
app.post("/api/resend-verification", emailSendLimiter, async(req, res) => {
    try {
        const { email, uid, tokenId } = req.body;

        if (!email || !uid || !tokenId) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields",
                type: "validation_error",
            });
        }

        // Generate new secure verification code
        const newCode = generateSecureVerificationCode();

        // Update the verification token document
        const tokenRef = admin
            .firestore()
            .collection("agencies")
            .doc(uid)
            .collection("email_verification_token")
            .doc(tokenId);

        const tokenDoc = await tokenRef.get();
        if (!tokenDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Verification token not found",
                type: "token_error",
            });
        }

        // Update token with new code and reset expiration
        await tokenRef.update({
            verificationCode: newCode,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Reset to 5 minutes
            status: "pending_verification",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Send new verification email
        let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        let apiKey = apiInstance.authentications["apiKey"];
        apiKey.apiKey = process.env.BREVO_API_KEY;

        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = "Verify your email";
        sendSmtpEmail.htmlContent = `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
            <head>
            <title></title>
            <meta charset="UTF-8" />
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <!--[if !mso]>-->
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <!--<![endif]-->
            <meta name="x-apple-disable-message-reformatting" content="" />
            <meta content="target-densitydpi=device-dpi" name="viewport" />
            <meta content="true" name="HandheldFriendly" />
            <meta content="width=device-width" name="viewport" />
            <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
            <style type="text/css">
            table {
            border-collapse: separate;
            table-layout: fixed;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt
            }
            table td {
            border-collapse: collapse
            }
            .ExternalClass {
            width: 100%
            }
            .ExternalClass,
            .ExternalClass p,
            .ExternalClass span,
            .ExternalClass font,
            .ExternalClass td,
            .ExternalClass div {
            line-height: 100%
            }
            body, a, li, p, h1, h2, h3 {
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
            }
            html {
            -webkit-text-size-adjust: none !important
            }
            body, #innerTable {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale
            }
            #innerTable img+div {
            display: none;
            display: none !important
            }
            img {
            Margin: 0;
            padding: 0;
            -ms-interpolation-mode: bicubic
            }
            h1, h2, h3, p, a {
            line-height: inherit;
            overflow-wrap: normal;
            white-space: normal;
            word-break: break-word
            }
            a {
            text-decoration: none
            }
            h1, h2, h3, p {
            min-width: 100%!important;
            width: 100%!important;
            max-width: 100%!important;
            display: inline-block!important;
            border: 0;
            padding: 0;
            margin: 0
            }
            a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important
            }
            u + #body a {
            color: inherit;
            text-decoration: none;
            font-size: inherit;
            font-family: inherit;
            font-weight: inherit;
            line-height: inherit;
            }
            a[href^="mailto"],
            a[href^="tel"],
            a[href^="sms"] {
            color: inherit;
            text-decoration: none
            }
            </style>
            <style type="text/css">
            @media (min-width: 481px) {
            .hd { display: none!important }
            }
            </style>
            <style type="text/css">
            @media (max-width: 480px) {
            .hm { display: none!important }
            }
            </style>
            <style type="text/css">
            @media (max-width: 480px) {
            .t12,.t18,.t23,.t6{font-family:Outfit,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif!important}.t36,.t41{mso-line-height-alt:20px!important;line-height:20px!important}.t37{padding:20px!important}.t39{width:343px!important}.t17{mso-line-height-alt:18px!important;line-height:18px!important}.t12{font-size:16px!important}.t27{text-align:left!important}.t26{vertical-align:top!important;width:600px!important}.t23{line-height:15px!important;font-size:12px!important;color:#858585!important;mso-text-raise:1px!important}
            }
            </style>
            <!--[if !mso]>-->
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&amp;family=Outfit:wght@400;700&amp;family=Open+Sans:wght@400&amp;family=Roboto:wght@400&amp;family=Lato:wght@400&amp;display=swap" rel="stylesheet" type="text/css" />
            <!--<![endif]-->
            <!--[if mso]>
            <xml>
            <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
            </xml>
            <![endif]-->
            </head>
            <body id="body" class="t44" style="min-width:100%;Margin:0px;padding:0px;background-color:#FFFFFF;"><div class="t43" style="background-color:#FFFFFF;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td class="t42" style="font-size:0;line-height:0;mso-line-height-rule:exactly;background-color:#FFFFFF;" valign="top" align="center">
            <!--[if mso]>
            <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false">
            <v:fill color="#FFFFFF"/>
            </v:background>
            <![endif]-->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" id="innerTable"><tr><td><div class="t36" style="mso-line-height-rule:exactly;mso-line-height-alt:30px;line-height:30px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
            <table class="t40" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="439" class="t39" style="background-color:#FFFFFF;border:2px solid #DFE1E4;overflow:hidden;width:439px;border-radius:10px 10px 10px 10px;">
            <table class="t38" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t37" style="padding:44px 42px 32px 42px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100% !important;"><tr><td align="left">
            <table class="t4" role="presentation" cellpadding="0" cellspacing="0" style="Margin-right:auto;"><tr><td width="42" class="t3" style="background-color:#FFFFFF;overflow:hidden;width:42px;border-radius:5px 5px 5px 5px;">
            <!-- TODO: Add logo -->
            <table class="t2" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t1"><div style="font-size:0px;"><img class="t0" style="display:block;border:0;height:auto;width:100%;Margin:0;max-width:100%;" width="42" height="42" alt="Logo" src="https://b5a58eb5-3c2d-482c-b8de-b433ef4dd5a8.b-cdn.net/e/d409689b-90f5-4949-8c54-ab34af5ead84/1aaa3b40-17a2-485f-90f6-f1ee26f001bd.png"/></div></td></tr></table>
            </td></tr></table>
            </td></tr><tr><td><div class="t5" style="mso-line-height-rule:exactly;mso-line-height-alt:30px;line-height:30px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
            <table class="t10" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="351" class="t9" style="border-bottom:2px solid #DFE1E4;width:600px;">
            <table class="t8" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t7" style="padding:0 0 30px 0;"><h1 class="t6" style="margin:0;Margin:0;font-family:Outfit, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, sans-serif;line-height:28px;font-weight:700;font-style:normal;font-size:24px;text-decoration:none;text-transform:none;letter-spacing:-1px;direction:ltr;color:#141414;text-align:left;mso-line-height-rule:exactly;mso-text-raise:1px;">Verify your email</h1></td></tr></table>
            </td></tr></table>
            </td></tr><tr><td><div class="t11" style="mso-line-height-rule:exactly;mso-line-height-alt:30px;line-height:30px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
            <table class="t16" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="351" class="t15" style="width:600px;">
            <table class="t14" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t13"><p class="t12" style="margin:0;Margin:0;font-family:Outfit, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, sans-serif;line-height:25px;font-weight:400;font-style:normal;font-size:15px;text-decoration:none;text-transform:none;letter-spacing:-0.1px;direction:ltr;color:#141414;text-align:left;mso-line-height-rule:exactly;mso-text-raise:3px;">We need to verify your email address <span style="color: #0000EE; text-decoration: underline;">${email}</span> before you can access your account. Enter the code below in your open browser window.</p></td></tr></table>
            </td></tr></table>
            </td></tr><tr><td><div class="t17" style="mso-line-height-rule:exactly;mso-line-height-alt:20px;line-height:20px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="left">
            <table class="t22" role="presentation" cellpadding="0" cellspacing="0" style="Margin-right:auto;"><tr><td width="351" class="t21" style="width:600px;">
            <table class="t20" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t19"><h1 class="t18" style="margin:0;Margin:0;font-family:Outfit, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, sans-serif;line-height:34px;font-weight:400;font-style:normal;font-size:28px;text-decoration:none;text-transform:none;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;letter-spacing: 10px;">${newCode}</h1></td></tr></table>
            </td></tr></table>
            </td></tr><tr><td><div class="t31" style="mso-line-height-rule:exactly;mso-line-height-alt:30px;line-height:30px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
            <table class="t35" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="351" class="t34" style="border-top:2px solid #DFE1E4;width:600px;">
            <table class="t33" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t32" style="padding:30px 0 0 0;"><div class="t30" style="width:100%;text-align:left;"><div class="t29" style="display:inline-block;"><table class="t28" role="presentation" cellpadding="0" cellspacing="0" align="left" valign="top">
            <tr class="t27"><td></td><td class="t26" width="351" valign="top">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t25" style="width:100%;"><tr><td class="t24"><p class="t23" style="margin:0;Margin:0;font-family:Outfit, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, sans-serif;line-height:22px;font-weight:400;font-style:normal;font-size:16px;text-decoration:none;text-transform:none;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">This code expires in 5 minutes.<br/><br/>If you didn't sign up for Bookly, you can safely ignore this email. Someone else might have typed your email address by mistake.</p></td></tr></table>
            </td>
            <td></td></tr>
            </table></div></div></td></tr></table>
            </td></tr></table>
            </td></tr></table></td></tr></table>
            </td></tr></table>
            </td></tr><tr><td><div class="t41" style="mso-line-height-rule:exactly;mso-line-height-alt:30px;line-height:30px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr></table></td></tr></table></div><div class="gmail-fix" style="display: none; white-space: nowrap; font: 15px courier; line-height: 0;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</div></body>
            </html>`;

        sendSmtpEmail.sender = {
            name: process.env.SENDER_NAME || "Bookly",
            email: process.env.SENDER_EMAIL,
        };

        sendSmtpEmail.to = [{
            email: email,
            name: email.split("@")[0],
        }, ];

        sendSmtpEmail.replyTo = {
            email: process.env.SENDER_EMAIL,
            name: process.env.SENDER_NAME || "Bookly Support",
        };

        await apiInstance.sendTransacEmail(sendSmtpEmail);

        return res.status(200).json({
            success: true,
            message: "New verification code sent successfully",
        });
    } catch (error) {
        console.error("Resend verification error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to resend verification code",
            type: "server_error",
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});