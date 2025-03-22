import { Button } from "@heroui/react";
import React, { useState, useEffect } from "react";
import { db } from "../../FirebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function MessageEmail() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
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

  // Function to store email in Firestore
  const storeEmailInFirestore = async (email: string) => {
    try {
      const companiesRef = collection(db, "companies");
      const docRef = await addDoc(companiesRef, {
        email,
        createdAt: serverTimestamp(),
        status: "verified", // You can add more fields as needed
      });
      console.log("Email stored in Firestore with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Firestore error:", error);
      throw new Error("Failed to store email in database");
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

      // Store the verified email in Firestore
      await storeEmailInFirestore(email);

      // If email is valid and stored, proceed with sending
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      let data;
      try {
        data = await response.json();
      } catch (error) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to send email");
      }

      setMessage(
        "Email verified, stored, and welcome message sent successfully!"
      );
      setEmail(""); // Clear the input after successful send
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Send Email</h2>

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
            {isLoading ? "Processing..." : "Send Email"}
          </Button>
        </form>

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
