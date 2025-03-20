import React, { useState } from "react";
import { Link } from "@heroui/react";

// Type for verification modes
type VerificationMode = "quick" | "power";

// SignUpTest component with modern design
const SignUpTest = () => {
  // State management for email and verification
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [mode, setMode] = useState<VerificationMode>("quick");
  const [verificationResult, setVerificationResult] = useState<{
    isReachable?: boolean;
    message?: string;
    details?: string;
  }>({});

  // Function to verify email using Reoon API
  const verifyEmail = async (email: string) => {
    setIsVerifying(true);
    try {
      // Direct API call to Reoon (no proxy needed)
      const apiUrl = `https://emailverifier.reoon.com/api/v1/verify?email=${encodeURIComponent(email)}&key=wVePmWpyOj86YD5qIFbbUu58gAcHBFi1&mode=${mode}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Failed to verify email: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (mode === "quick") {
        // Handle QUICK mode response
        const isValid = data.status === "valid";
        let message = "";

        switch (data.status) {
          case "valid":
            message = "Email is valid and can be used";
            break;
          case "disposable":
            message =
              "Please use a permanent email address, not a temporary one";
            break;
          case "spamtrap":
            message = "This email cannot be used";
            break;
          case "invalid":
            message = "This email address is invalid";
            break;
          default:
            message = "This email address cannot be verified";
        }

        setVerificationResult({
          isReachable: isValid,
          message: message,
          details: data.is_disposable
            ? "Disposable email detected"
            : data.is_role_account
              ? "Role account detected"
              : data.is_spamtrap
                ? "Spam trap detected"
                : undefined,
        });
      } else {
        // Handle POWER mode response
        const isValid = data.status === "safe";
        let message = "";

        switch (data.status) {
          case "safe":
            message = `Email is valid and safe to use (Score: ${data.overall_score}/100)`;
            break;
          case "disabled":
            message = "This email address is disabled";
            break;
          case "disposable":
            message =
              "Please use a permanent email address, not a temporary one";
            break;
          case "inbox_full":
            message = "This email inbox is full";
            break;
          case "catch_all":
            message = "This domain accepts all emails";
            break;
          case "role_account":
            message = "This is a role account (e.g., admin@, info@)";
            break;
          case "spamtrap":
            message = "This email cannot be used";
            break;
          case "invalid":
            message = "This email address is invalid";
            break;
          case "unknown":
            message = "Could not verify this email address";
            break;
          default:
            message = "This email address cannot be verified";
        }

        setVerificationResult({
          isReachable: isValid,
          message: message,
          details: data.is_deliverable
            ? undefined
            : `Not deliverable: ${[
                data.has_inbox_full && "Inbox full",
                data.is_disabled && "Account disabled",
                data.is_catch_all && "Catch-all domain",
                !data.can_connect_smtp && "SMTP connection failed",
              ]
                .filter(Boolean)
                .join(", ")}`,
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        isReachable: false,
        message: "Error verifying email. Please try again later.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setVerificationResult({}); // Reset verification on new input
  };

  // Handle continue button click
  const handleContinue = () => {
    if (email) {
      verifyEmail(email);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 p-8 flex flex-col">
        {/* Logo */}
        <div className="mb-12">
          <img
            src="/images/logo.svg"
            alt="Himalayas Logo"
            className="w-[150px] h-[40px] dark:invert"
          />
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-4xl font-semibold text-gray-800 mb-4">Sign up</h1>
          <p className="text-gray-600 mb-8">
            Create an account to start posting jobs and build your remote team
            with himalayas
          </p>

          {/* Verification Mode Toggle */}
          <div className="flex items-center justify-between mb-6 bg-gray-100 rounded-lg p-2">
            <button
              onClick={() => setMode("quick")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                mode === "quick"
                  ? "bg-white shadow text-purple-600"
                  : "text-gray-600 hover:text-purple-600"
              }`}
            >
              Quick Mode
            </button>
            <button
              onClick={() => setMode("power")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                mode === "power"
                  ? "bg-white shadow text-purple-600"
                  : "text-gray-600 hover:text-purple-600"
              }`}
            >
              Power Mode
            </button>
          </div>

          {/* Google Sign Up Button */}
          <button className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg p-3 mb-6 hover:bg-gray-50 transition-colors">
            <img src="/images/google.svg" alt="Google" className="w-5 h-5" />
            <span>Sign up with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-gray-500 text-sm">
              or sign up using email
            </span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          {/* Email Input */}
          <div className="mb-6">
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="alicia.vikander@linear.app"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                verificationResult.isReachable !== undefined
                  ? verificationResult.isReachable
                    ? "border-green-500"
                    : "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {/* Verification Status Message */}
            {verificationResult.message && (
              <div className="mt-2">
                <p
                  className={`text-sm ${
                    verificationResult.isReachable
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {verificationResult.message}
                </p>
                {verificationResult.details && (
                  <p className="text-sm text-gray-500 mt-1">
                    {verificationResult.details}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={isVerifying}
            className={`w-full bg-purple-600 text-white rounded-lg p-3 hover:bg-purple-700 transition-colors ${
              isVerifying ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isVerifying
              ? `${mode === "power" ? "Deep Verification..." : "Quick Verification..."}`
              : "Continue"}
          </button>

          {/* Sign In Link */}
          <p className="text-center mt-6 text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-purple-600 hover:text-purple-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Purple Gradient */}
      <div className="hidden lg:block w-1/2 bg-gradient-to-br from-purple-600 to-purple-800 relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Decorative circles */}
          <div className="absolute w-96 h-96 rounded-full bg-purple-500 opacity-20 -top-20 -right-20" />
          <div className="absolute w-96 h-96 rounded-full bg-purple-500 opacity-20 bottom-20 -left-20" />
          <div className="absolute w-64 h-64 rounded-full bg-purple-400 opacity-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    </div>
  );
};

export default SignUpTest;
