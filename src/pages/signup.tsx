import React, { useState, useEffect, useRef } from "react";
import { db } from "../../FirebaseConfig";
import { auth } from "../../FirebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  // addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  GeoPoint,
  Timestamp,
  getDoc,
  deleteDoc,
  orderBy,
  limit,
} from "firebase/firestore";
// import { ImageUploadPreview } from "@/components/ImageUploadPreview";
import { addAccountToLocalStorage } from "@/utils/localAccounts";
// import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Notification } from "@/components/ui/notification";
import { motion, AnimatePresence } from "framer-motion";
// import { SignupSidebar } from "@/components/Sidebar/SignupSidebar";
// import { FileUpload } from "@/components/ui/file-upload";
import { ImageUploadPreview } from "@/components/ui/ImageUploadPreview";
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

interface CompanyData {
  name: string;
  location: GeoPoint;
  phoneNumber: string;
  logoPublicId: string;
  logoUrl: string;
  businessLicensePublicId?: string;
  businessLicenseUrl?: string;
  creditBalance?: number;
  status?: "pending" | "approved" | "rejected" | null;
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

interface LocationInput {
  latitude: string;
  longitude: string;
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

const SignupFlow = () => {
  // Form state
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [angelListUrl, setAngelListUrl] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Company Information State
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "",
    location: new GeoPoint(0, 0),
    phoneNumber: "",
    logoPublicId: "",
    logoUrl: "",
    businessLicensePublicId: "",
    businessLicenseUrl: "",
    creditBalance: 0,
    status: "pending",
  });

  const [locationInput, setLocationInput] = useState<LocationInput>({
    latitude: "",
    longitude: "",
  });

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
  const [notification, setNotification] = useState<{
    message: string;
    type: "informative" | "success" | "warning" | "danger";
    isVisible: boolean;
  } | null>(null);

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

  // Add this useEffect after the other useEffect hooks
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (currentStep === 1) {
        emailInputRef.current?.focus();
      } else if (currentStep === 1.5) {
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

      // First, check if the email already exists in transportation_companies
      const transportationQuery = query(
        collection(db, "transportation_companies"),
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
        await setDoc(
          doc(db, "transportation_companies", companyId),
          companyDocData
        );
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
        collection(
          db,
          "transportation_companies",
          companyId,
          "email_verification_token"
        )
      );
      const existingTokens = await getDocs(existingTokensQuery);

      // Delete all existing tokens in parallel
      await Promise.all(existingTokens.docs.map((doc) => deleteDoc(doc.ref)));
      console.log("Cleaned up existing verification tokens");

      // Add new verification token to email_verification_token subcollection
      await setDoc(
        doc(
          db,
          "transportation_companies",
          companyId,
          "email_verification_token",
          tokenId
        ),
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
        "transportation_companies",
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
        doc(
          db,
          "transportation_companies",
          uid,
          "email_verification_token",
          tokenId
        )
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
        const companyRef = doc(db, "transportation_companies", uid);
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

      // Show success animation
      setShowSuccessAnimation(true);

      // Wait for animation to complete before proceeding
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Delete the verification token document
      await deleteDoc(tokenDoc.ref);

      // Clean up localStorage
      localStorage.removeItem("verificationTokenId");

      showMessage(
        "Email verified successfully! Please create your password.",
        false
      );
      setCurrentStep(2);
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

      // Fetch all registered users
      const response = await fetch("/api/list-users");

      type FirebaseUser = {
        email: string;
        creationTime: string;
        emailVerified: boolean;
      };

      type ApiResponse = {
        success: boolean;
        users: FirebaseUser[];
      };

      const data = (await response.json()) as ApiResponse;

      if (!data.success || !Array.isArray(data.users)) {
        console.log("\n❌ Failed to fetch users");
        return false;
      }

      // console.log("\n📋 All registered users in Firebase Auth:");
      const users = data.users as FirebaseUser[];

      for (const user of users) {
        //TODO: Uncomment this when we have a way to view the users in the database
        // console.log(`- ${user.email}`);
        // console.log(`  Created: ${user.creationTime}`);
        // console.log(`  Verified: ${user.emailVerified ? "✅" : "❌"}`);
        // console.log("  ---");

        if (user.email === email) {
          try {
            const creationDate = new Date(user.creationTime);
            if (!isNaN(creationDate.getTime())) {
              console.log("\n✅ Found user with valid creation date:");
              console.log(`- Email: ${user.email}`);
              console.log(`- Created: ${user.creationTime}`);
              console.log(`- Verified: ${user.emailVerified ? "✅" : "❌"}`);
              return true;
            }
          } catch (error) {
            console.log("\n❌ Invalid creation date format");
          }
        }
      }

      console.log("\n❌ No valid user found in Firebase Auth");
      return false;
    } catch (error) {
      console.error("❌ Error checking email:", error);
      throw new Error("Failed to check email availability");
    }
  };

  const handleFileUpload = async (
    file: File | null,
    type: "logo" | "license"
  ) => {
    if (!file) {
      // Clear the relevant image data
      if (type === "logo") {
        setCompanyData((prev) => ({ ...prev, logoPublicId: "", logoUrl: "" }));
      } else {
        setCompanyData((prev) => ({
          ...prev,
          businessLicensePublicId: "",
          businessLicenseUrl: "",
        }));
      }
      return;
    }

    try {
      const loadingKey = type === "logo" ? "logoUpload" : "licenseUpload";
      setIsLoading((prev) => ({ ...prev, [loadingKey]: true }));
      setNotification(null);

      if (!file.type.startsWith("image/")) {
        showMessage("Please upload an image file", true);
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showMessage("File size should be less than 5MB", true);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "booking-app");
      formData.append("cloud_name", "dwctkor2s");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dwctkor2s/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error?.message || `Upload failed: ${response.statusText}`
        );
      }

      if (data.public_id && data.secure_url) {
        if (type === "logo") {
          setCompanyData((prev) => ({
            ...prev,
            logoPublicId: data.public_id,
            logoUrl: data.secure_url,
          }));
        } else {
          setCompanyData((prev) => ({
            ...prev,
            businessLicensePublicId: data.public_id,
            businessLicenseUrl: data.secure_url,
          }));
        }
      }
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Error uploading file. Please try again.",
        true
      );
    } finally {
      const loadingKey = type === "logo" ? "logoUpload" : "licenseUpload";
      setIsLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleLocationChange = (field: keyof LocationInput, value: string) => {
    // Only allow numbers, decimal point, and minus sign
    if (!/^-?\d*\.?\d*$/.test(value) && value !== "") return;

    // Update the input field value
    setLocationInput((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate and convert the coordinates
    const lat =
      field === "latitude" ? Number(value) : Number(locationInput.latitude);
    const lng =
      field === "longitude" ? Number(value) : Number(locationInput.longitude);

    try {
      // Validate latitude (-90 to 90)
      if (field === "latitude" && value !== "") {
        if (isNaN(lat)) {
          throw new Error("Latitude must be a valid number");
        }
        if (lat < -90 || lat > 90) {
          throw new Error("Latitude must be between -90 and 90 degrees");
        }
      }

      // Validate longitude (-180 to 180)
      if (field === "longitude" && value !== "") {
        if (isNaN(lng)) {
          throw new Error("Longitude must be a valid number");
        }
        if (lng < -180 || lng > 180) {
          throw new Error("Longitude must be between -180 and 180 degrees");
        }
      }

      // Only update GeoPoint if both values are valid numbers within range
      if (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        setCompanyData((prev) => ({
          ...prev,
          location: new GeoPoint(lat, lng),
        }));
      }
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message, true);
      }
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showMessage("Geolocation is not supported by your browser", true);
      return;
    }

    setIsLoading((prev) => ({ ...prev, locationFetch: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationInput({
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        });
        setCompanyData((prev) => ({
          ...prev,
          location: new GeoPoint(latitude, longitude),
        }));
        setIsLoading((prev) => ({ ...prev, locationFetch: false }));
      },
      (error) => {
        let errorMessage = "Failed to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Please allow location access to continue";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
          default:
            errorMessage = "An unknown error occurred";
        }
        showMessage(errorMessage, true);
        setIsLoading((prev) => ({ ...prev, locationFetch: false }));
      }
    );
  };

  const handleCreateAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading((prev) => ({ ...prev, accountCreation: true }));
    setNotification(null);

    try {
      console.log("Starting account creation process...");
      console.log("Form data:", {
        email,
        companyData,
        locationInput,
        socialLinks: { twitterHandle, angelListUrl, linkedInUrl },
      });

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      if (
        !companyData.name ||
        !companyData.phoneNumber ||
        !companyData.logoUrl
      ) {
        throw new Error("Company details are incomplete");
      }

      // Get the UID we stored earlier
      const existingUID = localStorage.getItem("signupUID");
      if (!existingUID) {
        throw new Error(
          "Session expired. Please start the signup process again."
        );
      }

      // Create Firebase Auth user with the same UID
      console.log("Creating Firebase Auth user...");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;
      console.log("Firebase Auth user created:", uid);

      // Create GeoPoint from validated coordinates
      const latitude = Number(locationInput.latitude);
      const longitude = Number(locationInput.longitude);

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error("Invalid location coordinates");
      }

      const geoPoint = new GeoPoint(latitude, longitude);

      // Update the existing document with company details
      const companyDocData = {
        name: companyData.name,
        location: geoPoint,
        phoneNumber: companyData.phoneNumber,
        logo: {
          publicId: companyData.logoPublicId,
          url: companyData.logoUrl,
          uploadedAt: new Date().toISOString(),
        },
        businessLicense: companyData.businessLicensePublicId
          ? {
              publicId: companyData.businessLicensePublicId,
              url: companyData.businessLicenseUrl,
              uploadedAt: new Date().toISOString(),
            }
          : null,
        creditBalance: 0,
        status: "pending",
        updatedAt: Timestamp.now(),
        socialLinks: {
          twitter: twitterHandle || "",
          angelList: angelListUrl || "",
          linkedIn: linkedInUrl || "",
        },
        authUID: uid, // Store the Firebase Auth UID
      };

      console.log("Updating company data in Firestore...");
      console.log("Document path:", `transportation_companies/${existingUID}`);
      console.log("Company data:", companyDocData);

      // Update the existing document
      const companyRef = doc(db, "transportation_companies", existingUID);
      await updateDoc(companyRef, companyDocData);
      console.log("Company data updated successfully");

      // Create empty subcollections
      console.log("Creating trips subcollection...");
      const tripsCollectionRef = collection(companyRef, "trips");
      await setDoc(doc(tripsCollectionRef, "placeholder"), {
        createdAt: Timestamp.now(),
        placeholder: true,
      });

      // Remove seats subcollection creation
      // Save to local storage
      console.log("Saving to local storage...");
      addAccountToLocalStorage({
        id: existingUID,
        name: companyData.name,
        email: email,
        logo: {
          publicId: companyData.logoPublicId,
          url: companyData.logoUrl,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Clean up the signup UID from localStorage
      localStorage.removeItem("signupUID");

      showMessage("Account created successfully!", false);
      console.log("Account creation completed successfully!");

      // Redirect to dashboard
      window.location.href = "/dashboard";
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
    setNotification(null);

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

        // Check if the verification is less than 2 days old
        const isRecent =
          checkedAt &&
          new Date().getTime() - checkedAt.getTime() < 2 * 24 * 60 * 60 * 1000;

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
      setCurrentStep(1.5);
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
    // Focus the password input after hiding confirm password field
    setTimeout(() => {
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }, 100);
  };

  // Modify the handleSubmitPassword function to use the edit handler
  const handleSubmitPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If confirm password is not visible yet, show it instead of submitting
    if (!showConfirmPassword) {
      // Check if password meets requirements first
      const isPasswordValid = Object.values(passwordRules).every((rule) => rule);
      
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
      showMessage("Please meet all password requirements", true);
      setIsLoading((prev) => ({ ...prev, passwordSubmit: false }));
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      showMessage("Passwords do not match", true);
      setIsLoading((prev) => ({ ...prev, passwordSubmit: false }));
      return;
    }

    setCurrentStep(3);
    setIsLoading((prev) => ({ ...prev, passwordSubmit: false }));
  };

  const handleSubmitCompanyDetails = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate company details
    if (
      !companyData.name ||
      !locationInput.latitude ||
      !locationInput.longitude ||
      !companyData.phoneNumber ||
      !companyData.logoPublicId ||
      !companyData.logoUrl
    ) {
      showMessage(
        "Please fill in all required company information and upload a logo",
        true
      );
      return;
    }

    // Validate location coordinates
    const latitude = Number(locationInput.latitude);
    const longitude = Number(locationInput.longitude);

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      showMessage("Please enter valid location coordinates", true);
      return;
    }

    setCurrentStep(4);
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
            className="w-full h-screen flex items-center"
            onAnimationComplete={() => {
              emailInputRef.current?.focus();
            }}
          >
            <form onSubmit={handleSubmitEmail} className="w-full">
              <div className="w-full max-w-7xl relative mb-[150px] translate-x-[-10rem]">
                <div className="flex flex-col">
                  <h1 className="text-xl font-ot ot-regular text-gray-900 mb-4">
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

                  <p className="text-blue-600 text-base font-ot ot-regular mt-4">
                    We'll send you a verification code
                  </p>
                </div>
              </div>

              <div className="fixed bottom-8 right-8 z-50">
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
      } else if (step === 1.5) {
        // Verification code step
        return (
          <motion.div
            key="step-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full h-screen flex items-center"
          >
            <form onSubmit={handleVerifyCode} className="w-full">
              <div className="w-full max-w-7xl relative mb-[150px] translate-x-[-10rem]">
                <div className="flex flex-col">
                  <h1 className="text-xl font-ot ot-regular text-gray-900 mb-4">
                    Enter the verification code
                  </h1>

                  <div className="w-full">
                    <motion.div
                      animate={
                        notification?.type === "danger" || otpError
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
                      We sent a code to {email}
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
                      {process.env.NODE_ENV === "development" && (
                        <button
                          type="button"
                          onClick={handleSuccessAnimation}
                          className="px-3 py-1.5 rounded-lg font-ot ot-regular bg-green-100 text-green-700 hover:bg-green-200"
                        >
                          Success OTP
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="fixed bottom-8 right-8 z-50">
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
              <div className="fixed bottom-8 left-8 z-10 flex items-center gap-2 text-sm text-gray-600">
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
              </div>
            </form>
          </motion.div>
        );
      } else if (step === 2) {
        // Password step
        return (
          <motion.div
            key="step-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full h-screen flex items-center"
          >
            <form onSubmit={handleSubmitPassword} className="w-full">
              <div className="w-full max-w-7xl relative mb-[150px] translate-x-[-10rem]">
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
                        disableToggle={isLoading.passwordSubmit} // Only disable toggle when loading
                        readOnly={showConfirmPassword} // Make input readonly instead of fully disabled when confirm is shown
                        error={
                          notification?.type === "danger"
                            ? notification.message
                            : undefined
                        }
                        placeholder="Enter your password"
                        className={`w-full ${showConfirmPassword ? "text-[#989898]" : "text-gray-900"}`}
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
                          {/* {confirmPassword.length > 0 && passwordsMatch && (
                            <div className="absolute right-[-30px] top-[55%] -translate-y-1/2 flex items-center justify-center text-green-500">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M20 6L9 17L4 12"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )} */}
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

              <div className="fixed bottom-8 right-8 z-50">
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
              <div className="fixed bottom-8 left-8 z-10 flex items-center gap-2 text-sm text-gray-600">
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
              </div>
            </form>
          </motion.div>
        );
      } else if (step === 3) {
        // Company Details step
        return (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex flex-col justify-center"
          >
            <form
              onSubmit={handleSubmitCompanyDetails}
              className="grid grid-cols-2 gap-x-6 gap-y-4 w-full"
            >
              {/* Top Column */}
              <div className="col-span-2 lg:col-span-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={companyData.name}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, name: e.target.value })
                    }
                    placeholder="Enter registered company name"
                    required
                  />
                </div>
              </div>

              {/* Middle Column */}
              <div className="col-span-1">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="text-xs text-blue-600 hover:text-blue-800"
                      disabled={isLoading.locationFetch}
                    >
                      {isLoading.locationFetch
                        ? "Getting location..."
                        : "Current Location"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="w-full h-10 px-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={locationInput.latitude}
                      onChange={(e) =>
                        handleLocationChange("latitude", e.target.value)
                      }
                      placeholder="37.7749"
                      required
                    />
                    <input
                      type="text"
                      className="w-full h-10 px-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      value={locationInput.longitude}
                      onChange={(e) =>
                        handleLocationChange("longitude", e.target.value)
                      }
                      placeholder="-122.4194"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={companyData.phoneNumber}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      phoneNumber: e.target.value,
                    })
                  }
                  placeholder="Enter company phone number"
                  required
                />
              </div>

              {/* Bottom Column */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Logo
                </label>
                <ImageUploadPreview
                  onFileSelect={(file) => handleFileUpload(file, "logo")}
                  previewUrl={companyData.logoUrl}
                  publicId={companyData.logoPublicId}
                  required={true}
                  isLoading={isLoading.logoUpload}
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business License (Optional)
                </label>
                <ImageUploadPreview
                  onFileSelect={(file) => handleFileUpload(file, "license")}
                  previewUrl={companyData.businessLicenseUrl}
                  publicId={companyData.businessLicensePublicId}
                  isLoading={isLoading.licenseUpload}
                />
              </div>

              {/* Full-width button at the bottom */}
              <div className="col-span-2 mt-4">
                <button
                  type="submit"
                  className="w-full h-10 bg-black text-white rounded-md font-medium hover:bg-black/90 transition-colors"
                  disabled={isLoading.passwordSubmit}
                >
                  Register Company
                </button>
              </div>
            </form>
          </motion.div>
        );
      } else if (step === 4) {
        // Socials step
        return (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="#111827"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2">
              Add your socials
            </h1>
            <p className="text-gray-500 text-center mb-8">
              Share posts to your social accounts.
            </p>

            <form onSubmit={handleCreateAccount} className="space-y-6">
              {/* Twitter input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 1 23 3z"
                        stroke="#6B7280"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 py-2 border border-gray-300 rounded-md"
                    placeholder="twitter.com/@example"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    disabled={isLoading.accountCreation}
                  />
                </div>
              </div>

              {/* AngelList input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AngelList
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#6B7280"
                        strokeWidth="2"
                      />
                      <path
                        d="M12 6v6l4 2"
                        stroke="#6B7280"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 py-2 border border-gray-300 rounded-md"
                    placeholder="angel.co/company/example"
                    value={angelListUrl}
                    onChange={(e) => setAngelListUrl(e.target.value)}
                    disabled={isLoading.accountCreation}
                  />
                </div>
              </div>

              {/* LinkedIn input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
                        stroke="#6B7280"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect
                        x="2"
                        y="9"
                        width="4"
                        height="12"
                        stroke="#6B7280"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="4"
                        cy="4"
                        r="2"
                        stroke="#6B7280"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 py-2 border border-gray-300 rounded-md"
                    placeholder="linkedin.com/company/example"
                    value={linkedInUrl}
                    onChange={(e) => setLinkedInUrl(e.target.value)}
                    disabled={isLoading.accountCreation}
                  />
                </div>
              </div>

              {/* Complete button */}
              <button
                type="submit"
                className={`w-full py-2 bg-blue-600 text-white rounded-md font-medium ${
                  isLoading.accountCreation
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={isLoading.accountCreation}
              >
                {isLoading.accountCreation
                  ? "Creating Account..."
                  : "Complete sign up"}
              </button>
            </form>
          </motion.div>
        );
      }
    };

    return (
      <AnimatePresence mode="wait">{content(currentStep)}</AnimatePresence>
    );
  };

  // Update showMessage function
  const showMessage = (message: string, isError: boolean) => {
    setNotification({
      message,
      type: isError ? "danger" : "success",
      isVisible: true,
    });
  };

  // Add this function after other handlers
  const handleSuccessAnimation = () => {
    setShowSuccessAnimation(true);
    // Reset the animation after it completes
    setTimeout(() => {
      setShowSuccessAnimation(false);
    }, 1000); // This should be longer than the total animation duration (0.3s + 0.5s delay)
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Add Notification component */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={() =>
            setNotification((prev) =>
              prev ? { ...prev, isVisible: false } : null
            )
          }
        />
      )}

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
                <option value={1.5}>Step 1.5: Verification</option>
                <option value={2}>Step 2: Password</option>
                <option value={3}>Step 3: Company</option>
                <option value={4}>Step 4: Socials</option>
              </select>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-h-screen overflow-y-auto relative">
            {/* Logo */}
            <div className="absolute top-8 left-8 flex items-center">
              <img
                src="/images/qatalog-logo.svg"
                alt="Qatalog"
                className="h-8"
              />
              <span className="text-md text-gray-500 ml-3">Logo</span>
            </div>

            <div className="flex flex-col items-center min-h-screen">
              <div className="flex-1 flex items-center justify-center w-full p-8">
                <motion.div className="w-full max-w-3xl">
                  {/* Step content */}
                  {renderStepContent()}
                </motion.div>
              </div>

              {/* Step indicators */}
              <div className="fixed bottom-8 z-10">
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg">
                  <motion.div
                    className="h-2 rounded-full bg-blue-600 transition-colors"
                    animate={{
                      width:
                        currentStep === 1 || currentStep === 1.5
                          ? "2rem"
                          : "0.5rem",
                      backgroundColor:
                        currentStep === 1 || currentStep === 1.5
                          ? "#000"
                          : "#E5E7EB",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                  <motion.div
                    className="h-2 rounded-full bg-blue-600 transition-colors"
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
                    className="h-2 rounded-full bg-blue-600 transition-colors"
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
                  <motion.div
                    className="h-2 rounded-full bg-blue-600 transition-colors"
                    animate={{
                      width: currentStep === 4 ? "2rem" : "0.5rem",
                      backgroundColor: currentStep === 4 ? "#000" : "#E5E7EB",
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
