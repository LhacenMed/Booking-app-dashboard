import React, { useState } from "react";
import { Link } from "@heroui/react";
import { auth } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  applyActionCode,
} from "firebase/auth";
import { createTransport } from "nodemailer";

// ActionCodeSettings for Firebase Email Verification
const actionCodeSettings = {
  url: window.location.origin + "/verify-email",
  handleCodeInApp: true,
};

// SignUpTest component with modern design
export default function SignUpTest() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [tempUser, setTempUser] = useState<any>(null);

  // Function to verify email with Reoon API
  const verifyEmail = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const apiUrl = `https://emailverifier.reoon.com/api/v1/verify?email=${encodeURIComponent(email)}&key=HLxt5vq4ZXmBAjTdnTsx50OChXNgN4NU&mode=power`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to verify email");
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (data.status === "safe") {
        // Email is valid, proceed with Firebase verification
        await sendVerificationEmail();
        setStep("code");
        setMessage("Verification code sent to your email!");
      } else {
        setError("This email cannot be used. Please try a different one.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to verify email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to send verification email
  const sendVerificationEmail = async () => {
    try {
      // Create a temporary account to send verification email
      const tempUserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        Math.random().toString(36)
      );
      if (tempUserCredential.user) {
        await sendEmailVerification(
          tempUserCredential.user,
          actionCodeSettings
        );
        setTempUser(tempUserCredential.user);
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    }
  };

  // Function to verify the code
  const verifyCode = async () => {
    setLoading(true);
    setError("");

    try {
      await applyActionCode(auth, verificationCode);
      setStep("password");
      setMessage("Email verified successfully!");
    } catch (error) {
      console.error("Error verifying code:", error);
      setError("Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to complete signup
  const completeSignup = async () => {
    setLoading(true);
    setError("");

    try {
      if (tempUser) {
        // Delete the temporary user first
        await tempUser.delete();
      }

      // Create the final user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setMessage("Account created successfully!");
      // Redirect or handle successful signup
    } catch (error) {
      console.error("Error completing signup:", error);
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div
              className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative"
              role="alert"
            >
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded relative">
              {message}
            </div>
          )}

          {step === "email" && (
            <div>
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <button
                onClick={verifyEmail}
                disabled={loading || !email}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? "Verifying Email..." : "Verify Email"}
              </button>
            </div>
          )}

          {step === "code" && (
            <div>
              <div className="mb-4">
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700"
                >
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <button
                onClick={verifyCode}
                disabled={loading || !verificationCode}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? "Verifying Code..." : "Verify Code"}
              </button>
            </div>
          )}

          {step === "password" && (
            <div>
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Create Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <button
                onClick={completeSignup}
                disabled={loading || !password}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? "Creating Account..." : "Complete Signup"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
