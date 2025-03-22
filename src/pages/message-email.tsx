import { Button } from "@heroui/react";
import React, { useState, useEffect } from "react";
import { db } from "../../FirebaseConfig";
import { auth } from "../../FirebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

// Simple function to generate 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Step indicator component
const StepIndicator = ({ currentStep }: { currentStep: 1 | 2 | 3 }) => (
  <div className="flex items-center justify-center mb-6">
    <div className="flex items-center">
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentStep === 1 ? "bg-black text-white" : "bg-gray-200"
        }`}
      >
        1
      </div>
      <div className="w-12 h-1 mx-2 bg-gray-200"></div>
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentStep === 2 ? "bg-black text-white" : "bg-gray-200"
        }`}
      >
        2
      </div>
      <div className="w-12 h-1 mx-2 bg-gray-200"></div>
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentStep === 3 ? "bg-black text-white" : "bg-gray-200"
        }`}
      >
        3
      </div>
    </div>
  </div>
);

export default function MessageEmail() {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [serverStatus, setServerStatus] = useState<
    "checking" | "running" | "error"
  >("checking");

  // Check if server is running
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch("/api/test");
        const data = await response.json();
        setServerStatus(
          data.message === "Server is running!" ? "running" : "error"
        );
        console.log(data);
      } catch (error) {
        console.error("Server check failed:", error);
        setServerStatus("error");
      }
    };
    checkServer();
  }, []);

  // Function to verify email with Reoon API
  const verifyEmail = async (emailToVerify: string) => {
    try {
      const apiUrl = `https://emailverifier.reoon.com/api/v1/verify?email=${encodeURIComponent(emailToVerify)}&key=wVePmWpyOj86YD5qIFbbUu58gAcHBFi1&mode=power`;

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
      console.log("Reoon API Response:", data);

      return data.status === "safe";
    } catch (error) {
      console.error("Email verification error:", error);
      throw new Error("Failed to verify email address");
    }
  };

  // Store email and verification code in Firestore
  const storeEmailInFirestore = async (email: string, code: string) => {
    try {
      const companiesRef = collection(db, "companies");
      const docRef = await addDoc(companiesRef, {
        email,
        verificationCode: code,
        createdAt: serverTimestamp(),
        status: "pending_verification",
      });
      return docRef.id;
    } catch (error) {
      console.error("Firestore error:", error);
      throw new Error("Failed to store email in database");
    }
  };

  // Verify the code against Firestore
  const verifyCode = async (inputCode: string) => {
    try {
      setIsLoading(true);
      const companiesRef = collection(db, "companies");
      const q = query(
        companiesRef,
        where("email", "==", email),
        where("status", "==", "pending_verification"),
        where("verificationCode", "==", inputCode)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Invalid verification code");
      }

      // Update the document status to verified
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        status: "verified",
        verifiedAt: serverTimestamp(),
      });

      setMessage("Email verified successfully! Please create your password.");
      setCurrentStep(3);
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Verification failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update Firestore document with user ID
      const companiesRef = collection(db, "companies");
      const q = query(
        companiesRef,
        where("email", "==", email),
        where("status", "==", "verified")
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        await updateDoc(querySnapshot.docs[0].ref, {
          userId: userCredential.user.uid,
          status: "active",
        });
      }

      setMessage("Account created successfully!");
      // Reset all states
      setEmail("");
      setVerificationCode("");
      setPassword("");
      setCurrentStep(1);
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Failed to create account"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    if (serverStatus !== "running") {
      setMessage("Server is not running. Please try again later.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      // First verify the email
      const isEmailValid = await verifyEmail(email);
      if (!isEmailValid) {
        throw new Error("This email address appears to be invalid or risky");
      }

      // Generate verification code
      const verificationCode = generateVerificationCode();

      // Store email and code in Firestore
      await storeEmailInFirestore(email, verificationCode);

      // Send verification code email
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          subject: "Your Verification Code",
          code: verificationCode,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setMessage("Verification code sent to your email!");
      setCurrentStep(2);
    } catch (error) {
      console.error("Error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while processing your request."
      );
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    verifyCode(verificationCode);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <StepIndicator currentStep={currentStep} />

        <h2 className="text-2xl font-bold text-center mb-6">
          {currentStep === 1
            ? "Send Email"
            : currentStep === 2
              ? "Enter Verification Code"
              : "Create Password"}
        </h2>

        {serverStatus === "checking" && (
          <div className="text-center text-gray-600 mb-4">
            Checking server status...
          </div>
        )}

        {serverStatus === "error" && (
          <div className="text-center text-red-600 mb-4">
            Server is not responding. Please try again later.
          </div>
        )}

        {currentStep === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                disabled={isLoading || serverStatus !== "running"}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || serverStatus !== "running"}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                isLoading || serverStatus !== "running"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isLoading ? "Processing..." : "Send Code"}
            </Button>
          </form>
        ) : currentStep === 2 ? (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700"
              >
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                maxLength={6}
                pattern="\d{6}"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter 6-digit code"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Create Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password (min. 6 characters)"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        )}

        {message && (
          <div
            className={`mt-4 p-3 rounded-md ${
              isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
