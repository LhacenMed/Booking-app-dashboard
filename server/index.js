// server/index.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const SibApiV3Sdk = require("@getbrevo/brevo");
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");

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
                    <p>This code will expire in 10 minutes.</p>
                </body>
            </html>`;

        sendSmtpEmail.sender = {
            name: process.env.SENDER_NAME || "SupNum",
            email: process.env.SENDER_EMAIL,
        };

        sendSmtpEmail.to = [{
            email: email,
            name: email.split("@")[0],
        }, ];

        sendSmtpEmail.replyTo = {
            email: process.env.SENDER_EMAIL,
            name: process.env.SENDER_NAME || "SupNum Support",
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

        // Verify email matches
        if (tokenData.email !== email) {
            return res.status(403).json({
                success: false,
                error: "Email mismatch",
                type: "validation_error",
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
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Delete the verification token
        await tokenRef.delete();

        return res.status(200).json({
            success: true,
            message: "Account created successfully",
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                emailVerified: userRecord.emailVerified,
                // Include password for immediate sign-in (will be used client-side only)
                password: password,
            },
        });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});