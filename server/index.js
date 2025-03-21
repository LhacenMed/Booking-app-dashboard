// server/index.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const SibApiV3Sdk = require("@getbrevo/brevo");

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
        BREVO_API_KEY: process.env.BREVO_API_KEY,
        SENDER_EMAIL: process.env.SENDER_EMAIL,
        SENDER_NAME: process.env.SENDER_NAME
    };

    const missing = Object.entries(required)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    // Validate API key format
    if (!process.env.BREVO_API_KEY.startsWith('xkeysib-')) {
        console.error('Invalid API key format. Must start with "xkeysib-"');
        process.exit(1);
    }
}

validateEnvironmentVariables();

// Debug what we get from Brevo
console.log("Brevo object:", Object.keys(SibApiV3Sdk));

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Test endpoint to verify server is running
app.get("/api/test", (req, res) => {
    res.json({ message: "Server is running!" });
});

app.post("/api/send-email", async(req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        // Initialize API instance
        let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

        // Configure API key authorization
        let apiKey = apiInstance.authentications["apiKey"];

        // Check if API key is available and properly formatted
        if (!process.env.BREVO_API_KEY) {
            throw new Error("Brevo API key is not configured");
        }

        if (!process.env.BREVO_API_KEY.startsWith("xkeysib-")) {
            throw new Error(
                "Invalid Brevo API key format - must start with 'xkeysib-'"
            );
        }

        apiKey.apiKey = process.env.BREVO_API_KEY;

        // Create a new email object
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        // Set up email data
        sendSmtpEmail.subject = "Welcome to SupNum!";
        sendSmtpEmail.htmlContent =
            "<html><body><h1>Welcome to SupNum!</h1><p>Thank you for subscribing to our service. Version 3</p></body></html>";

        // Use environment variables for sender information
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

        // Send the email
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("Email sent successfully. Response:", data);

        return res.status(200).json({
            success: true,
            message: "Email sent successfully!",
            data: data,
        });
    } catch (error) {
        // Detailed error logging
        console.error("Email sending error details:", {
            name: error.name,
            message: error.message,
            response: error.response,
            stack: error.stack,
        });

        let errorMessage = "Failed to send email";

        // Handle different types of errors
        if (error.response) {
            // Brevo API error response
            errorMessage =
                error.response.text || error.response.body || error.message;
        } else if (error instanceof SibApiV3Sdk.ApiException) {
            // Specific Brevo SDK error
            errorMessage = `API Error: ${error.message}`;
        } else {
            // Generic error
            errorMessage = error.message || "An unexpected error occurred";
        }

        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: {
                type: error.name,
                details: errorMessage,
            },
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});