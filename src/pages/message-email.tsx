import React, { useState, useEffect, useRef } from "react";
import { db } from "@/config/firebase";
// import { auth } from "@/config/firebase";
// import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  Timestamp,
  getDoc,
  deleteDoc,
  orderBy,
  limit,
} from "firebase/firestore";
// import { ImageUploadPreview } from "@/components/ImageUploadPreview";
import { addAccountToLocalStorage } from "@/utils/localAccounts";
// import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useNotification } from "@/components/ui/notification";
import { motion, AnimatePresence } from "framer-motion";
// import { SignupSidebar } from "@/components/Sidebar/SignupSidebar";
// import { FileUpload } from "@/components/ui/file-upload";
// import { ImageUploadPreview } from "@/components/ui/ImageUploadPreview";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
// import { Input } from "@heroui/react";
// import { LoadingSpinner } from "@/components/ui/loading-spinner";
// import { EyeIcon, EyeOffIcon } from "lucide-react";
import CustomInput from "@/components/ui/CustomInput";
import { Spinner } from "@heroui/react";
// import PasswordInput from "@/components/ui/PasswordInput";
import { useNavigate } from "react-router-dom";

// Simple function to generate 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Add this helper function at the top level, after the generateVerificationCode function
const generateCustomCompanyId = (email: string) => {
  // Get first 5 letters of email (before @), convert to uppercase
  const prefix = email.split("@")[0].slice(0, 5).toUpperCase();

  // Generate 8 random numbers (including possible leading zeros)
  const numbers = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");

  return `${prefix}-${numbers}`;
};

// Add these functions after the generateCustomCompanyId function
const EMAIL_HISTORY_KEY = "email_history";
const MAX_EMAIL_HISTORY = 5;

const getEmailHistory = (): string[] => {
  if (typeof window === "undefined") return [];
  const history = localStorage.getItem(EMAIL_HISTORY_KEY);
  return history ? JSON.parse(history) : [];
};

const addToEmailHistory = (email: string) => {
  if (typeof window === "undefined") return;
  const history = getEmailHistory();
  const newHistory = [email, ...history.filter((e) => e !== email)].slice(
    0,
    MAX_EMAIL_HISTORY
  );
  localStorage.setItem(EMAIL_HISTORY_KEY, JSON.stringify(newHistory));
};

interface FirebaseUser {
  email: string;
  creationTime: string;
  emailVerified: boolean;
}

interface LoadingState {
  emailSubmit: boolean;
  verification: boolean;
  passwordSubmit: boolean;
  locationFetch: boolean;
  logoUpload: boolean;
  licenseUpload: boolean;
  accountCreation: boolean;
  resendingCode: boolean;
}

// Add this interface before the SignupFlow component
interface EmailVerificationData {
  can_connect_smtp: boolean;
  domain: string;
  has_inbox_full: boolean;
  is_catch_all: boolean;
  is_deliverable: boolean;
  is_disabled: boolean;
  is_disposable: boolean;
  is_free_email: boolean;
  is_role_account: boolean;
  is_safe_to_send: boolean;
  is_spamtrap: boolean;
  is_valid_syntax: boolean;
  mx_accepts_mail: boolean;
  mx_records: string[];
  overall_score: number;
  status: string;
  username: string;
  verification_mode: string;
}

interface CheckedEmailDoc {
  email: string;
  isValid: boolean;
  checkedAt: Timestamp;
  verificationData: EmailVerificationData;
}

// Add notification interface
interface NotificationItem {
  message: string;
  type: "informative" | "success" | "warning" | "danger";
  duration?: number;
  id?: string;
}

// Update notification interface
interface LocalNotification {
  message: string;
  type: "informative" | "success" | "warning" | "danger";
  isVisible: boolean;
}

const SignupFlow = () => {
  // Form state
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const [isLoading, setIsLoading] = useState<LoadingState>({
    emailSubmit: false,
    verification: false,
    passwordSubmit: false,
    locationFetch: false,
    logoUpload: false,
    licenseUpload: false,
    accountCreation: false,
    resendingCode: false,
  });

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [serverStatus, setServerStatus] = useState<"running" | "error">(
    "running"
  );
  // const [showPassword, setShowPassword] = useState(false);
  // const [files, setFiles] = useState<File[]>([]);
  // const [message, setMessage] = useState("");
  // const [isError, setIsError] = useState(false);
  // const [notification, setNotification] = useState<{
  //   message: string;
  //   type: "informative" | "success" | "warning" | "danger";
  // } | null>(null);
  // const [isNotificationVisible, setIsNotificationVisible] = useState(false);

  // Add timer state
  const [resendTimer, setResendTimer] = useState<number>(0);

  // Add these state variables near the other state declarations
  const [passwordRules, setPasswordRules] = useState({
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
  });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  // Add these refs after the other state declarations
  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<React.ElementRef<typeof InputOTP>>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  // Add a new ref for the first password input
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Add this ref near other refs
  const abortControllerRef = useRef<AbortController | null>(null);

  const navigate = useNavigate();

  // Add useNotification hook
  const { addNotification } = useNotification();

  // Add error states for form validation
  // const [emailError, setEmailError] = useState<string | undefined>();
  // const [passwordError, setPasswordError] = useState<string | undefined>();

  // Add back notification state
  const [notification, setNotification] = useState<LocalNotification | null>(
    null
  );

  // Add useEffect after the other useEffect hooks
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (currentStep === 1) {
        emailInputRef.current?.focus();
      } else if (currentStep === 2) {
        // Focus the OTP input using the ref
        const otpInput = otpRef.current?.querySelector(
          "input"
        ) as HTMLInputElement;
        if (otpInput) {
          otpInput.focus();
        }
      }
    }, 100); // Reduced delay since we're using ref now

    return () => clearTimeout(focusTimer);
  }, [currentStep]);

  // Add useEffect for the timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Format time function
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

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
      // Check if API key is available
      const apiKey = import.meta.env.VITE_REOON_API_KEY;
      if (!apiKey) {
        console.error("API Key not found in environment variables");
        throw new Error("Reoon API key is not configured");
      }

      const apiUrl = `https://emailverifier.reoon.com/api/v1/verify?email=${encodeURIComponent(emailToVerify)}&key=${apiKey}&mode=power`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("API Response:", errorData);
        throw new Error("Failed to verify email");
      }

      const data = await response.json();
      console.log("Reoon API Response:", data);

      return data;
    } catch (error) {
      console.error("Email verification error:", error);
      throw new Error("Failed to verify email address");
    }
  };

  // Store email and verification code in Firestore
  const storeEmailInFirestore = async (email: string, code: string) => {
    try {
      console.log("Starting to store/update email in Firestore:", {
        email,
        code,
      });

      // First, check if the email already exists in agencies
      const transportationQuery = query(
        collection(db, "agencies"),
        where("email", "==", email)
      );

      const querySnapshot = await getDocs(transportationQuery);
      let companyId: string;

      if (!querySnapshot.empty) {
        // Email exists, use the existing document
        companyId = querySnapshot.docs[0].id;
        console.log("Found existing company document:", companyId);
      } else {
        // Email doesn't exist, create new document
        companyId = generateCustomCompanyId(email);
        console.log("Generated new company ID:", companyId);

        // Create the main company document with minimal data
        const companyDocData = {
          email,
          createdAt: serverTimestamp(),
        };

        // Create the main document with custom ID
        await setDoc(doc(db, "agencies", companyId), companyDocData);
        console.log("Created new company document:", companyId);
      }

      // Generate a unique ID for the verification token
      const tokenId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create verification token in subcollection
      const tokenData = {
        email,
        verificationCode: code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        status: "pending_verification",
        tokenId, // Store the token ID in the document for reference
      };

      // First, delete any existing verification tokens
      const existingTokensQuery = query(
        collection(db, "agencies", companyId, "email_verification_token")
      );
      const existingTokens = await getDocs(existingTokensQuery);

      // Delete all existing tokens in parallel
      await Promise.all(existingTokens.docs.map((doc) => deleteDoc(doc.ref)));
      console.log("Cleaned up existing verification tokens");

      // Add new verification token to email_verification_token subcollection
      await setDoc(
        doc(db, "agencies", companyId, "email_verification_token", tokenId),
        tokenData
      );
      console.log("Created new verification token:", tokenId);

      // Store both IDs in localStorage for later use
      localStorage.setItem("signupUID", companyId);
      localStorage.setItem("verificationTokenId", tokenId);

      return companyId;
    } catch (error) {
      console.error("Detailed Firestore error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        if ("code" in error) {
          console.error("Error code:", (error as any).code);
        }
      }
      throw new Error("Failed to store email in database");
    }
  };

  // Add this function after storeEmailInFirestore
  const resendVerificationCode = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, resendingCode: true }));

      // Get the stored IDs
      const uid = localStorage.getItem("signupUID");
      const tokenId = localStorage.getItem("verificationTokenId");

      if (!uid || !tokenId) {
        throw new Error("Session expired. Please start over.");
      }

      // Generate new verification code
      const newCode = generateVerificationCode();

      // Update the verification token document
      const tokenRef = doc(
        db,
        "agencies",
        uid,
        "email_verification_token",
        tokenId
      );
      await updateDoc(tokenRef, {
        verificationCode: newCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Reset to 5 minutes from now
        status: "pending_verification",
      });

      // Send new verification code email
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          subject: "Your New Verification Code",
          code: newCode,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send verification code");
      }

      // Reset timer to 5 minutes
      setResendTimer(300);

      showMessage("New verification code sent to your email!", false);
    } catch (error) {
      console.error("Error resending code:", error);
      showMessage(
        error instanceof Error
          ? error.message
          : "Failed to resend verification code",
        true
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, resendingCode: false }));
    }
  };

  // Verify the code against Firestore
  const verifyCode = async (inputCode: string) => {
    try {
      console.log("Verifying code:", { email, inputCode });
      setIsLoading((prev) => ({ ...prev, verification: true }));
      setOtpError(false);

      // Get the UIDs from localStorage
      const uid = localStorage.getItem("signupUID");
      const tokenId = localStorage.getItem("verificationTokenId");

      if (!uid || !tokenId) {
        throw new Error("Session expired. Please start over.");
      }

      // Get the verification token document
      const tokenDoc = await getDoc(
        doc(db, "agencies", uid, "email_verification_token", tokenId)
      );

      if (!tokenDoc.exists()) {
        throw new Error("Verification token not found");
      }

      const tokenData = tokenDoc.data();

      // Check if token is expired
      if (tokenData.expiresAt.toDate() < new Date()) {
        // Delete the verification token document first
        await deleteDoc(tokenDoc.ref);
        console.log("Deleted expired verification token");

        // Then delete the main company document
        const companyRef = doc(db, "agencies", uid);
        await deleteDoc(companyRef);
        console.log("Deleted company document due to expired token");

        // Clean up localStorage
        localStorage.removeItem("signupUID");
        localStorage.removeItem("verificationTokenId");

        throw new Error("Verification code has expired. Please start over.");
      }

      // Check if code matches
      if (
        tokenData.verificationCode !== inputCode ||
        tokenData.email !== email
      ) {
        setOtpError(true);
        throw new Error("Invalid verification code");
      }

      // Verify token with server
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/verify-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          tokenId,
          uid,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to verify token");
      }

      // Show success animation
      setShowSuccessAnimation(true);

      // Wait for animation to complete before proceeding
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showMessage(
        "Email verified successfully! Please create your password.",
        false
      );
      setCurrentStep(3);
      setResendTimer(0);
    } catch (error) {
      console.error("Verification error:", error);
      showMessage(
        error instanceof Error ? error.message : "Verification failed",
        true
      );

      // If the error was due to expiration, go back to step 1
      if (error instanceof Error && error.message.includes("expired")) {
        setCurrentStep(1);
        setVerificationCode("");
        setResendTimer(0);
        setOtpError(false);
      }
    } finally {
      setIsLoading((prev) => ({ ...prev, verification: false }));
      // Reset success animation after a delay
      setTimeout(() => {
        setShowSuccessAnimation(false);
      }, 1000);
    }
  };

  const handleVerifyCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading((prev) => ({ ...prev, verification: true }));
    verifyCode(verificationCode).finally(() => {
      setIsLoading((prev) => ({ ...prev, verification: false }));
    });
  };

  // Check if email exists in Firebase Auth
  const checkEmailExists = async (email: string) => {
    try {
      console.log("🔍 Checking if email exists:", email);

      // Use the correct API URL from environment variables or fallback to localhost:5000
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      // Create new AbortController for this request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(); // Abort any existing request
      }
      abortControllerRef.current = new AbortController();

      // Increase timeout to 2 minutes and add retry logic
      const maxRetries = 3; // Increased to 3 retries
      let currentTry = 0;
      let lastError: Error | null = null;

      while (currentTry < maxRetries) {
        let timeoutId: NodeJS.Timeout | undefined;
        try {
          console.log(
            `Making request attempt ${currentTry + 1}/${maxRetries}...`
          );

          // Create a promise that combines fetch with timeout
          const fetchWithTimeout = async () => {
            timeoutId = setTimeout(() => {
              const controller = abortControllerRef.current;
              if (controller) {
                controller.abort();
              }
            }, 30000); // 30 second timeout

            try {
              const controller = abortControllerRef.current;
              if (!controller) {
                throw new Error("Request was cancelled");
              }

              const response = await fetch(`${apiUrl}/api/list-users`, {
                signal: controller.signal,
                headers: {
                  Accept: "application/json",
                },
              });

              const data = await response.json();

              if (!response.ok) {
                console.error("API Error Response:", data);

                // Handle different types of errors
                switch (data.type) {
                  case "timeout":
                    throw new Error("Request timed out. Please try again.");
                  case "auth_error":
                    throw new Error(
                      "Server authentication error. Please contact support."
                    );
                  case "rate_limit":
                    // Wait longer between retries for rate limiting
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                    throw new Error("Too many requests. Retrying...");
                  case "server_error":
                    throw new Error(
                      data.error || "Server error. Please try again later."
                    );
                  default:
                    throw new Error(data.error || response.statusText);
                }
              }

              return data;
            } finally {
              if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = undefined;
              }
            }
          };

          const data = await fetchWithTimeout();

          if (!data.success || !Array.isArray(data.users)) {
            console.log("\n❌ Failed to fetch users");
            return false;
          }

          const users = data.users as FirebaseUser[];

          for (const user of users) {
            if (user.email === email) {
              console.log("\n✅ Found user with matching email:");
              console.log(`- Email: ${user.email}`);
              console.log(`- Created: ${user.creationTime}`);
              console.log(`- Verified: ${user.emailVerified ? "✅" : "❌"}`);
              return true;
            }
          }

          console.log("\n❌ No matching email found in Firebase Auth");
          return false;
        } catch (retryError) {
          lastError =
            retryError instanceof Error
              ? retryError
              : new Error(String(retryError));
          currentTry++;

          // Clean up timeout if it exists
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
          }

          // If it's the last try, break out of the loop
          if (currentTry === maxRetries) {
            break;
          }

          // Calculate exponential backoff delay with jitter
          const baseDelay = Math.min(1000 * Math.pow(2, currentTry), 10000);
          const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
          const backoffDelay = baseDelay + jitter;

          console.log(`Waiting ${Math.round(backoffDelay)}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          console.log(
            `Retrying request (attempt ${currentTry + 1}/${maxRetries})...`
          );
        }
      }

      // If we've exhausted all retries, throw the last error
      if (lastError) {
        throw lastError;
      }

      return false;
    } catch (error) {
      console.error("❌ Error checking email:", error);

      // Handle abort error (timeout)
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Request timed out. Please try again.");
        }
        throw new Error(error.message);
      }

      throw new Error("Failed to check email availability");
    } finally {
      // Clean up abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleCreateAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading((prev) => ({ ...prev, accountCreation: true }));

    try {
      console.log("Starting account creation process...");
      console.log("Form data:", {
        email,
        password,
      });

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // Get the UIDs we stored earlier
      const uid = localStorage.getItem("signupUID");
      const tokenId = localStorage.getItem("verificationTokenId");

      if (!uid || !tokenId) {
        throw new Error(
          "Session expired. Please start the signup process again."
        );
      }

      // Create account through secure endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/create-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          uid,
          tokenId,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create account");
      }

      // Store credentials for automatic sign-in
      sessionStorage.setItem(
        "newAccountData",
        JSON.stringify({
          email: data.user.email,
          password: data.user.password,
        })
      );

      // Save to local storage with required fields
      console.log("Saving to local storage...");
      addAccountToLocalStorage({
        id: uid,
        name: email.split("@")[0], // Use email username as name
        email: email,
        logo: {
          publicId: "",
          url: "",
          uploadedAt: new Date().toISOString(),
        },
      });

      // Clean up the signup UIDs from localStorage
      localStorage.removeItem("signupUID");
      localStorage.removeItem("verificationTokenId");

      showMessage("Account created successfully!", false);
      console.log("Account creation completed successfully!");

      // Redirect to onboarding welcome page
      navigate("/onboarding/welcome");
    } catch (error) {
      console.error("Account creation error:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        if ("code" in error) {
          console.error("Error code:", (error as any).code);
        }
      }
      showMessage(
        error instanceof Error ? error.message : "Failed to create account",
        true
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, accountCreation: false }));
    }
  };

  const handleSubmitEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading((prev) => ({ ...prev, emailSubmit: true }));

    if (!email || email.length === 0) {
      setIsLoading((prev) => ({ ...prev, emailSubmit: false }));
      showMessage("Please enter your email address", true);
      return;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setIsLoading((prev) => ({ ...prev, emailSubmit: false }));
      showMessage("Please enter a valid email address", true);
      return;
    }

    // Add email to history after successful submission
    addToEmailHistory(email);

    if (serverStatus !== "running") {
      showMessage("Server is not running. Please try again later.", true);
      setIsLoading((prev) => ({ ...prev, emailSubmit: false }));
      return;
    }

    try {
      // First, check if we have a recent verification in Firestore
      const checkedEmailsQuery = query(
        collection(db, "checked_emails"),
        where("email", "==", email),
        orderBy("checkedAt", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(checkedEmailsQuery);
      let emailVerificationData: EmailVerificationData | null = null;
      let existingDocId: string | null = null;

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data() as CheckedEmailDoc;
        const checkedAt = data.checkedAt?.toDate();
        existingDocId = doc.id;

        // Check if the verification is less than 7 days old
        const isRecent =
          checkedAt &&
          new Date().getTime() - checkedAt.getTime() < 7 * 24 * 60 * 60 * 1000;

        if (isRecent) {
          // Use the stored verification data
          emailVerificationData = data.verificationData;
          console.log(
            "Using cached email verification result:",
            emailVerificationData
          );
        }
      }

      // If we don't have recent verification data, verify with Reoon API and store results or update existing docs
      if (!emailVerificationData) {
        const verificationResult = await verifyEmail(email);
        if (!verificationResult) {
          throw new Error("Failed to verify email address");
        }

        // Store the verification result
        emailVerificationData = verificationResult;

        if (existingDocId) {
          // Update existing document
          const checkedEmailRef = doc(
            collection(db, "checked_emails"),
            existingDocId
          );
          await updateDoc(checkedEmailRef, {
            isValid: verificationResult.status === "safe",
            checkedAt: serverTimestamp(),
            verificationData: verificationResult,
          });
          console.log(
            "Updated existing email verification document:",
            existingDocId
          );
        } else {
          // Create new document with random ID if no existing document
          const randomId = Math.random().toString(36).substring(2, 10);
          const docId = `${randomId}_${email}`;
          const checkedEmailRef = doc(collection(db, "checked_emails"), docId);
          await setDoc(checkedEmailRef, {
            email,
            isValid: verificationResult.status === "safe",
            checkedAt: serverTimestamp(),
            verificationData: verificationResult,
          });
          console.log("Created new email verification document:", docId);
        }
      }

      // At this point emailVerificationData is guaranteed to be non-null
      // because we either got it from cache or just verified it
      const verificationData = emailVerificationData!;
      if (verificationData.status !== "safe") {
        throw new Error("This email address appears to be invalid or risky");
      }

      // Then check if email already exists in Firebase Auth
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        throw new Error(
          "This email is already registered. Please use a different email or login."
        );
      }

      // Generate verification code
      const code = generateVerificationCode();

      // Store email and code in Firestore
      await storeEmailInFirestore(email, code);

      // Send verification code email
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          subject: "Your Verification Code",
          code,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send verification code");
      }

      // Start the 5-minute timer (300 seconds)
      setResendTimer(300);

      showMessage("Verification code sent to your email!", false);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error:", error);
      showMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while processing your request.",
        true
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, emailSubmit: false }));
    }
  };

  // Update validatePassword to NOT show confirm field automatically
  const validatePassword = (value: string) => {
    const rules = {
      minLength: value.length >= 8,
      hasUppercase: /[A-Z]/.test(value),
      hasNumber: /[0-9]/.test(value),
    };

    setPasswordRules(rules);

    // Only check if passwords match when confirm field is visible
    if (showConfirmPassword) {
      setPasswordsMatch(value === confirmPassword);
    }
  };

  // Add function to validate confirm password
  const validateConfirmPassword = (value: string) => {
    setConfirmPassword(value);
    setPasswordsMatch(password === value);
  };

  // Add a handler for the edit password button
  const handleEditPassword = () => {
    setShowConfirmPassword(false);
    setPasswordFocused(true);
    setConfirmPassword("");
    // Focus the password input after hiding confirm password field
    setTimeout(() => {
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }, 100);
  };

  // Modify the handleSubmitPassword function to use the edit handler
  const handleSubmitPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If confirm password is not visible yet, show it instead of submitting
    if (!showConfirmPassword) {
      // Check if password meets requirements first
      const isPasswordValid = Object.values(passwordRules).every(
        (rule) => rule
      );

      if (!isPasswordValid) {
        showMessage("Please meet all password requirements", true);
        return;
      }

      // Show confirm password field
      setShowConfirmPassword(true);

      // Focus the confirm password input after it appears
      setTimeout(() => {
        confirmPasswordRef.current?.focus();
      }, 100);
      return;
    }

    setIsLoading((prev) => ({ ...prev, passwordSubmit: true }));

    if (!password || password.length === 0) {
      setIsLoading((prev) => ({ ...prev, passwordSubmit: false }));
      showMessage("Please enter a password", true);
      return;
    }

    // Check if all password rules are met
    const isPasswordValid = Object.values(passwordRules).every((rule) => rule);

    if (!isPasswordValid) {
      setIsLoading((prev) => ({ ...prev, passwordSubmit: false }));
      showMessage("Please meet all password requirements", true);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setIsLoading((prev) => ({ ...prev, passwordSubmit: false }));
      showMessage("Passwords do not match", true);
      return;
    }

    // Call handleCreateAccount when Continue is pressed
    handleCreateAccount(e);
  };

  // Render different content based on the current step
  const renderStepContent = () => {
    const content = (step: number) => {
      if (step === 1) {
        return (
          <motion.div
            key="step-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex items-center"
            onAnimationComplete={() => {
              emailInputRef.current?.focus();
            }}
          >
            <form onSubmit={handleSubmitEmail} className="w-full">
              <div className="w-full max-w-7xl relative translate-x-[-7rem]">
                <div className="flex flex-col">
                  <h1 className="text-xl font-ot ot-regular text-gray-900 mb-2">
                    Please enter your work email
                  </h1>

                  <div className="w-full">
                    <motion.div
                      animate={
                        notification?.type === "danger"
                          ? {
                              x: [0, -4, 4, -2, 2, -1, 1, 0],
                            }
                          : {}
                      }
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      className="w-full relative"
                    >
                      <CustomInput
                        ref={emailInputRef}
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (notification?.type === "danger") {
                            setNotification(null);
                          }
                        }}
                        onSuggestionSelect={(suggestion) => {
                          setEmail(suggestion);
                        }}
                        suggestions={getEmailHistory()}
                        onInvalid={(e) => {
                          e.preventDefault();
                        }}
                        required
                        disabled={
                          isLoading.emailSubmit || serverStatus !== "running"
                        }
                        error={
                          notification?.type === "danger"
                            ? notification.message
                            : undefined
                        }
                        placeholder="panic@thedis.co"
                        className="pr-8"
                      />
                    </motion.div>
                  </div>

                  <p className="text-blue-600 text-base font-ot ot-regular mt-2">
                    We'll send you a verification code
                  </p>
                </div>
              </div>

              <div className="fixed bottom-[50px] right-[50px] z-50">
                <button
                  type="submit"
                  className={`w-[120px] px-4 py-2 bg-black text-white rounded-xl font-ot ot-regular flex items-center justify-center gap-3 ${
                    isLoading.emailSubmit ||
                    serverStatus !== "running" ||
                    !email
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-black/90"
                  }`}
                  disabled={
                    isLoading.emailSubmit ||
                    serverStatus !== "running" ||
                    !email
                  }
                >
                  Continue
                  {isLoading.emailSubmit ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 8H15M15 8L8 1M15 8L8 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        );
      } else if (step === 2) {
        return (
          <motion.div
            key="step-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex items-center"
          >
            <form onSubmit={handleVerifyCode} className="w-full">
              <div className="w-full max-w-7xl relative translate-x-[-5rem]">
                <div className="flex flex-col">
                  <h1 className="text-xl font-ot ot-regular text-gray-900 mb-4">
                    Enter the verification code
                  </h1>

                  <div className="w-full">
                    <motion.div
                      animate={
                        otpError
                          ? {
                              x: [0, -4, 4, -2, 2, -1, 1, 0],
                            }
                          : {}
                      }
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      className="w-full relative"
                    >
                      <InputOTP
                        ref={otpRef}
                        maxLength={6}
                        value={verificationCode}
                        onChange={(value) => {
                          setVerificationCode(value);
                          setOtpError(false);
                          if (value.length === 6) {
                            verifyCode(value);
                          }
                        }}
                        pattern={REGEXP_ONLY_DIGITS}
                        disabled={isLoading.verification}
                        className="gap-2"
                        showSuccessAnimation={showSuccessAnimation}
                        error={otpError}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot
                            index={0}
                            showSuccessAnimation={showSuccessAnimation}
                            className={`w-14 h-14 text-2xl font-ot ot-regular ${
                              otpError
                                ? "border-red-500 ring-1 ring-red-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            }`}
                          />
                          <InputOTPSlot
                            index={1}
                            showSuccessAnimation={showSuccessAnimation}
                            className={`w-14 h-14 text-2xl font-ot ot-regular ${
                              otpError
                                ? "border-red-500 ring-1 ring-red-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            }`}
                          />
                          <InputOTPSlot
                            index={2}
                            showSuccessAnimation={showSuccessAnimation}
                            className={`w-14 h-14 text-2xl font-ot ot-regular ${
                              otpError
                                ? "border-red-500 ring-1 ring-red-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            }`}
                          />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot
                            index={3}
                            showSuccessAnimation={showSuccessAnimation}
                            className={`w-14 h-14 text-2xl font-ot ot-regular ${
                              otpError
                                ? "border-red-500 ring-1 ring-red-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            }`}
                          />
                          <InputOTPSlot
                            index={4}
                            showSuccessAnimation={showSuccessAnimation}
                            className={`w-14 h-14 text-2xl font-ot ot-regular ${
                              otpError
                                ? "border-red-500 ring-1 ring-red-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            }`}
                          />
                          <InputOTPSlot
                            index={5}
                            showSuccessAnimation={showSuccessAnimation}
                            className={`w-14 h-14 text-2xl font-ot ot-regular ${
                              otpError
                                ? "border-red-500 ring-1 ring-red-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            }`}
                          />
                        </InputOTPGroup>
                      </InputOTP>
                    </motion.div>
                  </div>

                  <div className="flex flex-col gap-4 mt-4">
                    <p className="text-blue-600 text-base font-ot ot-regular">
                      We sent a code to {email || "your email"}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={resendTimer > 0 || isLoading.resendingCode}
                        className={`px-3 py-1.5 rounded-lg font-ot ot-regular bg-gray-100 inline-flex items-center gap-1.5 ${
                          resendTimer > 0 || isLoading.resendingCode
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-900 hover:bg-gray-200"
                        }`}
                        onClick={() => {
                          setVerificationCode("");
                          resendVerificationCode();
                        }}
                      >
                        {isLoading.resendingCode ? (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 512 513.11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="opacity-70"
                            >
                              <path
                                fillRule="nonzero"
                                d="M210.48 160.8c0-14.61 11.84-26.46 26.45-26.46s26.45 11.85 26.45 26.46v110.88l73.34 32.24c13.36 5.88 19.42 21.47 13.54 34.82-5.88 13.35-21.47 19.41-34.82 13.54l-87.8-38.6c-10.03-3.76-17.16-13.43-17.16-24.77V160.8zM5.4 168.54c-.76-2.25-1.23-4.64-1.36-7.13l-4-73.49c-.75-14.55 10.45-26.95 25-27.69 14.55-.75 26.95 10.45 27.69 25l.74 13.6a254.258 254.258 0 0136.81-38.32c17.97-15.16 38.38-28.09 61.01-38.18 64.67-28.85 134.85-28.78 196.02-5.35 60.55 23.2 112.36 69.27 141.4 132.83.77 1.38 1.42 2.84 1.94 4.36 27.86 64.06 27.53 133.33 4.37 193.81-23.2 60.55-69.27 112.36-132.83 141.39a26.24 26.24 0 01-12.89 3.35c-14.61 0-26.45-11.84-26.45-26.45 0-11.5 7.34-21.28 17.59-24.92 7.69-3.53 15.06-7.47 22.09-11.8.8-.66 1.65-1.28 2.55-1.86 11.33-7.32 22.1-15.7 31.84-25.04.64-.61 1.31-1.19 2-1.72 20.66-20.5 36.48-45.06 46.71-71.76 18.66-48.7 18.77-104.46-4.1-155.72l-.01-.03C418.65 122.16 377.13 85 328.5 66.37c-48.7-18.65-104.46-18.76-155.72 4.1a203.616 203.616 0 00-48.4 30.33c-9.86 8.32-18.8 17.46-26.75 27.29l3.45-.43c14.49-1.77 27.68 8.55 29.45 23.04 1.77 14.49-8.55 27.68-23.04 29.45l-73.06 9c-13.66 1.66-26.16-7.41-29.03-20.61zM283.49 511.5c20.88-2.34 30.84-26.93 17.46-43.16-5.71-6.93-14.39-10.34-23.29-9.42-15.56 1.75-31.13 1.72-46.68-.13-9.34-1.11-18.45 2.72-24.19 10.17-12.36 16.43-2.55 39.77 17.82 42.35 19.58 2.34 39.28 2.39 58.88.19zm-168.74-40.67c7.92 5.26 17.77 5.86 26.32 1.74 18.29-9.06 19.97-34.41 3.01-45.76-12.81-8.45-25.14-18.96-35.61-30.16-9.58-10.2-25.28-11.25-36.11-2.39a26.436 26.436 0 00-2.55 38.5c13.34 14.2 28.66 27.34 44.94 38.07zM10.93 331.97c2.92 9.44 10.72 16.32 20.41 18.18 19.54 3.63 36.01-14.84 30.13-33.82-4.66-15-7.49-30.26-8.64-45.93-1.36-18.33-20.21-29.62-37.06-22.33C5.5 252.72-.69 262.86.06 274.14c1.42 19.66 5.02 39 10.87 57.83z"
                                fill="currentColor"
                              />
                            </svg>
                            Sending...
                            <Spinner size="sm" color="default" />
                          </>
                        ) : (
                          <>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 512 513.11"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="opacity-70"
                            >
                              <path
                                fillRule="nonzero"
                                d="M210.48 160.8c0-14.61 11.84-26.46 26.45-26.46s26.45 11.85 26.45 26.46v110.88l73.34 32.24c13.36 5.88 19.42 21.47 13.54 34.82-5.88 13.35-21.47 19.41-34.82 13.54l-87.8-38.6c-10.03-3.76-17.16-13.43-17.16-24.77V160.8zM5.4 168.54c-.76-2.25-1.23-4.64-1.36-7.13l-4-73.49c-.75-14.55 10.45-26.95 25-27.69 14.55-.75 26.95 10.45 27.69 25l.74 13.6a254.258 254.258 0 0136.81-38.32c17.97-15.16 38.38-28.09 61.01-38.18 64.67-28.85 134.85-28.78 196.02-5.35 60.55 23.2 112.36 69.27 141.4 132.83.77 1.38 1.42 2.84 1.94 4.36 27.86 64.06 27.53 133.33 4.37 193.81-23.2 60.55-69.27 112.36-132.83 141.39a26.24 26.24 0 01-12.89 3.35c-14.61 0-26.45-11.84-26.45-26.45 0-11.5 7.34-21.28 17.59-24.92 7.69-3.53 15.06-7.47 22.09-11.8.8-.66 1.65-1.28 2.55-1.86 11.33-7.32 22.1-15.7 31.84-25.04.64-.61 1.31-1.19 2-1.72 20.66-20.5 36.48-45.06 46.71-71.76 18.66-48.7 18.77-104.46-4.1-155.72l-.01-.03C418.65 122.16 377.13 85 328.5 66.37c-48.7-18.65-104.46-18.76-155.72 4.1a203.616 203.616 0 00-48.4 30.33c-9.86 8.32-18.8 17.46-26.75 27.29l3.45-.43c14.49-1.77 27.68 8.55 29.45 23.04 1.77 14.49-8.55 27.68-23.04 29.45l-73.06 9c-13.66 1.66-26.16-7.41-29.03-20.61zM283.49 511.5c20.88-2.34 30.84-26.93 17.46-43.16-5.71-6.93-14.39-10.34-23.29-9.42-15.56 1.75-31.13 1.72-46.68-.13-9.34-1.11-18.45 2.72-24.19 10.17-12.36 16.43-2.55 39.77 17.82 42.35 19.58 2.34 39.28 2.39 58.88.19zm-168.74-40.67c7.92 5.26 17.77 5.86 26.32 1.74 18.29-9.06 19.97-34.41 3.01-45.76-12.81-8.45-25.14-18.96-35.61-30.16-9.58-10.2-25.28-11.25-36.11-2.39a26.436 26.436 0 00-2.55 38.5c13.34 14.2 28.66 27.34 44.94 38.07zM10.93 331.97c2.92 9.44 10.72 16.32 20.41 18.18 19.54 3.63 36.01-14.84 30.13-33.82-4.66-15-7.49-30.26-8.64-45.93-1.36-18.33-20.21-29.62-37.06-22.33C5.5 252.72-.69 262.86.06 274.14c1.42 19.66 5.02 39 10.87 57.83z"
                                fill="currentColor"
                              />
                            </svg>
                            Send again
                            {resendTimer > 0 && (
                              <span className="text-xs text-gray-400 ml-1">
                                ({formatTime(resendTimer)})
                              </span>
                            )}
                          </>
                        )}
                      </button>

                      {/* Add test button */}
                      {/* {process.env.NODE_ENV === "development" && (
                        <button
                          type="button"
                          onClick={handleSuccessAnimation}
                          className="px-3 py-1.5 rounded-lg font-ot ot-regular bg-green-100 text-green-700 hover:bg-green-200"
                        >
                          Success OTP
                        </button>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>

              <div className="fixed bottom-[50px] right-[50px] z-50">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      localStorage.removeItem("signupUID");
                      localStorage.removeItem("verificationTokenId");
                    }}
                    className="w-[120px] px-4 py-2 text-gray-600 hover:text-gray-900 font-ot ot-regular flex items-center justify-center gap-2"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="rotate-180"
                    >
                      <path
                        d="M1 8H15M15 8L8 1M15 8L8 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Back
                  </button>
                  <button
                    type="submit"
                    className={`w-[120px] px-4 py-2 bg-black text-white rounded-xl font-ot ot-regular flex items-center justify-center gap-3 ${
                      isLoading.verification || verificationCode.length !== 6
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-black/90"
                    }`}
                    disabled={
                      isLoading.verification || verificationCode.length !== 6
                    }
                  >
                    Verify
                    {isLoading.verification ? (
                      <Spinner size="sm" color="white" />
                    ) : (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 8H15M15 8L8 1M15 8L8 15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Email info text */}
              {/* <div className="fixed bottom-8 left-8 z-10 flex items-center gap-2 text-sm text-gray-600">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                Signing up as {email}
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setEmail("");
                    localStorage.removeItem("signupUID");
                    localStorage.removeItem("verificationTokenId");
                  }}
                  className="text-gray-500 hover:text-gray-700 underline"
                >
                  (logout)
                </button>
              </div> */}
            </form>
          </motion.div>
        );
      } else if (step === 3) {
        return (
          <motion.div
            key="step-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex items-center"
          >
            <form onSubmit={handleSubmitPassword} className="w-full">
              <div className="w-full max-w-7xl relative translate-x-[-5rem]">
                <div className="flex flex-col">
                  <h1
                    className={`text-xl font-ot ot-regular mb-4 ${showConfirmPassword ? "text-[#989898]" : "text-gray-900"}`}
                  >
                    Choose a password
                  </h1>

                  <div className="w-full">
                    <motion.div
                      animate={
                        notification?.type === "danger"
                          ? {
                              x: [0, -4, 4, -2, 2, -1, 1, 0],
                            }
                          : {}
                      }
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      className="w-full relative"
                    >
                      {showConfirmPassword && (
                        <button
                          type="button"
                          onClick={handleEditPassword}
                          className="absolute left-[-40px] top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 rounded-full z-10 transition-all group"
                          aria-label="Edit password"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="absolute bottom-[-24px] left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Edit password
                          </span>
                        </button>
                      )}
                      <CustomInput
                        ref={passwordInputRef}
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          validatePassword(e.target.value);
                          if (notification?.type === "danger") {
                            setNotification(null);
                          }
                        }}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        disabled={
                          isLoading.passwordSubmit || showConfirmPassword
                        }
                        disableToggle={isLoading.passwordSubmit}
                        readOnly={showConfirmPassword}
                        error={
                          notification?.type === "danger"
                            ? notification.message
                            : undefined
                        }
                        placeholder="Enter your password"
                        className={`w-full text-gray-900 ${showConfirmPassword ? "opacity-40 cursor-not-allowed bg-gray-50" : ""}`}
                      />
                    </motion.div>
                    {/* Confirm Password Input */}
                    <AnimatePresence>
                      {showConfirmPassword && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -20 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="mt-8 relative w-full"
                        >
                          <label className="block text-xl font-ot ot-regular text-gray-900 mb-4">
                            Confirm your password
                          </label>
                          <CustomInput
                            ref={confirmPasswordRef}
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                              validateConfirmPassword(e.target.value);
                            }}
                            disabled={isLoading.passwordSubmit}
                            error={
                              confirmPassword.length > 0 && !passwordsMatch
                                ? "Passwords do not match"
                                : undefined
                            }
                            placeholder="Re-enter your password"
                            className="w-full"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Password Rules Container */}
                  <AnimatePresence>
                    {password.length > 0 && passwordFocused && (
                      <motion.div
                        className="absolute left-0 right-0 top-full mt-4 p-4 font-ot ot-regular bg-gray-50 rounded-lg border border-gray-200 z-10 shadow-md"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                          Password must contain at least:
                        </h3>
                        <ul className="space-y-2">
                          <li className="text-sm flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordRules.minLength ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                            >
                              {passwordRules.minLength ? "✓" : "·"}
                            </span>
                            8 characters
                          </li>
                          <li className="text-sm flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordRules.hasUppercase ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                            >
                              {passwordRules.hasUppercase ? "✓" : "·"}
                            </span>
                            One uppercase letter
                          </li>
                          <li className="text-sm flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordRules.hasNumber ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                            >
                              {passwordRules.hasNumber ? "✓" : "·"}
                            </span>
                            One number
                          </li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="fixed bottom-[50px] right-[50px] z-50">
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className={`w-[120px] px-4 py-2 bg-black text-white rounded-xl font-ot ot-regular flex items-center justify-center gap-3 ${
                      isLoading.passwordSubmit ||
                      !password ||
                      (!showConfirmPassword &&
                        !Object.values(passwordRules).every((rule) => rule)) ||
                      (showConfirmPassword && !passwordsMatch)
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-black/90"
                    }`}
                    disabled={
                      isLoading.passwordSubmit ||
                      !password ||
                      (!showConfirmPassword &&
                        !Object.values(passwordRules).every((rule) => rule)) ||
                      (showConfirmPassword && !passwordsMatch)
                    }
                  >
                    {showConfirmPassword ? "Continue" : "Next"}
                    {isLoading.passwordSubmit ? (
                      <Spinner size="sm" color="white" />
                    ) : (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 8H15M15 8L8 1M15 8L8 15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Email info text */}
              {/* <div className="fixed bottom-8 left-8 z-10 flex items-center gap-2 text-sm text-gray-600">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                Signing up as {email}
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setEmail("");
                    localStorage.removeItem("signupUID");
                    localStorage.removeItem("verificationTokenId");
                  }}
                  className="text-gray-500 hover:text-gray-700 underline"
                >
                  (logout)
                </button>
              </div> */}
            </form>
          </motion.div>
        );
      } else {
        return null;
      }
    };

    return (
      <AnimatePresence mode="wait">{content(currentStep)}</AnimatePresence>
    );
  };

  // Update showMessage function
  const showMessage = (message: string, isError: boolean) => {
    // First set the notification content
    setNotification({
      message,
      type: isError ? "danger" : "success",
      isVisible: true,
    });

    // Add notification to global system as NotificationItem
    addNotification({
      message,
      type: isError ? "danger" : "success",
      duration: 5000,
    } as NotificationItem);
  };

  // Add this function after other handlers
  // const handleSuccessAnimation = () => {
  //   setShowSuccessAnimation(true);
  //   // Reset the animation after it completes
  //   setTimeout(() => {
  //     setShowSuccessAnimation(false);
  //   }, 1000);
  // };

  // Add this useEffect for cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex h-screen bg-white">
      {/* Server Error State */}
      {serverStatus !== "running" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center font-ot ot-medium">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-red-600"
              >
                <path
                  d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-2xl text-gray-900 mb-2">
              Server Connection Error
            </h1>
            <p className="text-gray-600 max-w-md mx-auto">
              We're unable to connect to our servers at the moment. Please check
              your internet connection and try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Main content - Only show when server is running */}
      {serverStatus === "running" && (
        <>
          {/* Left sidebar */}
          {/* <SignupSidebar currentStep={currentStep} /> */}

          {/* Dev Jump Button */}
          {process.env.NODE_ENV === "development" && (
            <div className="fixed top-4 right-4 z-50">
              <select
                value={currentStep}
                onChange={(e) => setCurrentStep(Number(e.target.value))}
                className="bg-black/10 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-md border border-gray-200"
              >
                <option value={1}>Step 1: Email</option>
                <option value={2}>Step 2: Verification</option>
                <option value={3}>Step 3: Password</option>
              </select>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-h-screen overflow-y-auto relative">
            {/* Logo */}
            <div className="absolute top-[50px] left-[50px] flex items-center font-ot ot-medium">
              <img src="/images/logo.svg" alt="Logo" className="h-8" />
              <span className="text-2xl text-gray-500 ml-3">Booking</span>
            </div>

            <div className="flex flex-col items-center min-h-screen">
              <div className="flex-1 flex items-center justify-center w-full p-8">
                <motion.div className="w-full max-w-3xl">
                  {/* Step content */}
                  {renderStepContent()}
                </motion.div>
              </div>

              {/* Step indicators */}
              <div className="fixed bottom-[50px] z-10">
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg">
                  <motion.div
                    className="h-2 rounded-full bg-[#000] transition-colors"
                    animate={{
                      width: currentStep === 1 ? "2rem" : "0.5rem",
                      backgroundColor: currentStep === 1 ? "#000" : "#E5E7EB",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                  <motion.div
                    className="h-2 rounded-full bg-[#000] transition-colors"
                    animate={{
                      width: currentStep === 2 ? "2rem" : "0.5rem",
                      backgroundColor: currentStep === 2 ? "#000" : "#E5E7EB",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                  <motion.div
                    className="h-2 rounded-full bg-[#000] transition-colors"
                    animate={{
                      width: currentStep === 3 ? "2rem" : "0.5rem",
                      backgroundColor: currentStep === 3 ? "#000" : "#E5E7EB",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SignupFlow;
