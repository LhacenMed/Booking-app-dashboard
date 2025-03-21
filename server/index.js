const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const SibApiV3Sdk = require("@getbrevo/brevo");

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
        apiKey.apiKey =
            process.env.BREVO_API_KEY ||
            "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";

        // Create a new email object
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        // Set up email data
        sendSmtpEmail.subject = "Welcome to SupNum!";
        sendSmtpEmail.htmlContent =
            "<html><body><h1>Welcome to SupNum!</h1><p>Thank you for subscribing to our service.</p></body></html>";

        // TODO: Replace with your verified sender email from Brevo dashboard
        sendSmtpEmail.sender = {
            name: "elhassen .inc",
            email: "2l7acenmed653@gmail.com", // Replace this with your verified sender email
        };

        sendSmtpEmail.to = [{
            email: email,
            name: email.split("@")[0],
        }, ];

        sendSmtpEmail.replyTo = {
            email: "2l7acenmed653@gmail.com", // Replace this with your verified sender email
            name: "elhassen .inc",
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
        console.error(
            "Failed to send email:",
            error.response ? error.response.text : error.message
        );
        return res.status(500).json({
            success: false,
            message: "Failed to send email",
            error: error.response ? error.response.text : error.message,
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});