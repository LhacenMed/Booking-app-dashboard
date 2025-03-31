// server/index.js
// server/index.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const SibApiV3Sdk = require("@getbrevo/brevo");
const admin = require("firebase-admin");

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

// Debug environment variables
console.log("Environment check:", {
    BREVO_API_KEY: process.env.BREVO_API_KEY ?
        `${process.env.BREVO_API_KEY.substring(0, 10)}...` :
        "Missing",
    BREVO_API_KEY_LENGTH: process.env.BREVO_API_KEY ?
        process.env.BREVO_API_KEY.length :
        0,
    SENDER_EMAIL: process.env.SENDER_EMAIL || "Missing",
    SENDER_NAME: process.env.SENDER_NAME || "Missing",
});

// Validate environment variables before starting server
function validateEnvironmentVariables() {
    const required = {
        BREVO_API_KEY: process.env.BREVO_API_KEY ?
            `${process.env.BREVO_API_KEY.substring(0, 10)}...` :
            "Missing",
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

app.post("/api/send-email", async(req, res) => {
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
        const timeout = 60000; // 60 seconds

        // Create a promise that rejects after timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Request timeout")), timeout);
        });

        // Create the actual Firebase request promise
        const firebasePromise = admin.auth().listUsers(1000); // Limit to 1000 users

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
        if (error.message === "Request timeout") {
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

        return res.status(500).json({
            success: false,
            error: error.message,
            type: "server_error",
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});