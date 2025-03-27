import React, { useState, useEffect } from "react";
import { db } from "../../FirebaseConfig";
import { auth } from "../../FirebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  // addDoc,
  serverTimestamp,
  // query,
  // where,
  // getDocs,
  updateDoc,
  doc,
  setDoc,
  GeoPoint,
  Timestamp,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
// import { ImageUploadPreview } from "@/components/ImageUploadPreview";
import { addAccountToLocalStorage } from "@/utils/localAccounts";
// import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Notification } from "@/components/ui/notification";
import { motion, AnimatePresence } from "framer-motion";
import { SignupSidebar } from "@/components/Sidebar/SignupSidebar";
// import { FileUpload } from "@/components/ui/file-upload";
import { ImageUploadPreview } from "@/components/ui/ImageUploadPreview";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Input } from "@heroui/react";
// import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import CustomInput from "@/components/ui/CustomInput";
import { Spinner } from "@heroui/react";

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
}

interface LocationInput {
  latitude: string;
  longitude: string;
}

const SignupFlow = () => {
  // Form state
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [angelListUrl, setAngelListUrl] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");

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
  });

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [serverStatus, setServerStatus] = useState<"running" | "error">(
    "running"
  );
  const [showPassword, setShowPassword] = useState(false);
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
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });

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
      const apiUrl = `https://emailverifier.reoon.com/api/v1/verify?email=${encodeURIComponent(emailToVerify)}&key=HLxt5vq4ZXmBAjTdnTsx50OChXNgN4NU&mode=power`;

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
      console.log("Starting to store email in Firestore:", { email, code });

      // Generate custom company ID
      const customId = generateCustomCompanyId(email);
      console.log("Generated custom company ID:", customId);

      // Create the main company document with minimal data
      const companyDocData = {
        email,
        createdAt: serverTimestamp(),
      };

      // Create the main document with custom ID
      await setDoc(
        doc(db, "transportation_companies", customId),
        companyDocData
      );
      console.log("Created main company document:", customId);

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

      // Add to email_verification_token subcollection with unique ID
      await setDoc(
        doc(
          db,
          "transportation_companies",
          customId,
          "email_verification_token",
          tokenId
        ),
        tokenData
      );
      console.log("Created verification token:", tokenId);

      // Store both IDs in localStorage for later use
      localStorage.setItem("signupUID", customId);
      localStorage.setItem("verificationTokenId", tokenId);

      return customId;
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
      setIsLoading((prev) => ({ ...prev, verification: true }));

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
      setIsLoading((prev) => ({ ...prev, verification: false }));
    }
  };

  // Verify the code against Firestore
  const verifyCode = async (inputCode: string) => {
    try {
      console.log("Verifying code:", { email, inputCode });
      setIsLoading((prev) => ({ ...prev, verification: true }));

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
        throw new Error("Invalid verification code");
      }

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
        // setEmail("");
      }
    } finally {
      setIsLoading((prev) => ({ ...prev, verification: false }));
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
      // First, verify email with Reoon
      const isEmailValid = await verifyEmail(email);
      if (!isEmailValid) {
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

  // Add this function before handleSubmitPassword
  const validatePassword = (value: string) => {
    setPasswordRules({
      minLength: value.length >= 8,
      hasUppercase: /[A-Z]/.test(value),
      hasLowercase: /[a-z]/.test(value),
      hasNumber: /[0-9]/.test(value),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
    });
  };

  const handleSubmitPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full h-screen flex items-center"
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
                        placeholder="jana@ollie.com"
                        className="pr-8"
                      />
                    </motion.div>
                  </div>

                  <p className="text-blue-600 text-base font-ot ot-regular mt-4">
                    We'll send you a magic link
                  </p>
                </div>
              </div>

              <div className="fixed bottom-8 right-8">
                <button
                  type="submit"
                  className={`px-4 py-3 bg-black text-white rounded-lg font-ot ot-regular flex items-center gap-3 ${
                    isLoading.emailSubmit || serverStatus !== "running"
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-black/90"
                  }`}
                  disabled={isLoading.emailSubmit || serverStatus !== "running"}
                >
                  {isLoading.emailSubmit ? "Processing..." : "Send link"}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full max-w-sm mx-auto"
          >
            <h1 className="text-xl font-semibold text-center mb-2">
              Verify your email
            </h1>
            <p className="text-sm text-gray-600 text-center mb-8">
              We sent a code to {email}
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={(value) => {
                    setVerificationCode(value);
                    // Auto-submit when all 6 digits are entered
                    if (value.length === 6) {
                      verifyCode(value);
                    }
                  }}
                  pattern={REGEXP_ONLY_DIGITS}
                  disabled={isLoading.verification}
                  className="gap-2"
                >
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={0}
                      className="w-14 h-14 text-2xl border-gray-300"
                    />
                    <InputOTPSlot
                      index={1}
                      className="w-14 h-14 text-2xl border-gray-300"
                    />
                    <InputOTPSlot
                      index={2}
                      className="w-14 h-14 text-2xl border-gray-300"
                    />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={3}
                      className="w-14 h-14 text-2xl border-gray-300"
                    />
                    <InputOTPSlot
                      index={4}
                      className="w-14 h-14 text-2xl border-gray-300"
                    />
                    <InputOTPSlot
                      index={5}
                      className="w-14 h-14 text-2xl border-gray-300"
                    />
                  </InputOTPGroup>
                </InputOTP>

                <button
                  type="submit"
                  className={`w-full py-3 bg-blue-600 text-white rounded-lg font-medium ${
                    isLoading.verification
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700"
                  }`}
                  disabled={
                    isLoading.verification || verificationCode.length !== 6
                  }
                >
                  {isLoading.verification ? "Verifying..." : "Verify"}
                </button>

                <div className="flex flex-col items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setEmail("");
                      localStorage.removeItem("signupUID");
                      localStorage.removeItem("verificationTokenId");
                    }}
                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Change email
                  </button>

                  <p className="text-sm text-gray-600">
                    Didn't get a code?{" "}
                    <button
                      type="button"
                      disabled={resendTimer > 0}
                      className={`font-medium ${
                        resendTimer > 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-900 hover:underline"
                      }`}
                      onClick={() => {
                        setVerificationCode("");
                        resendVerificationCode();
                      }}
                    >
                      Click to resend
                      {resendTimer > 0 && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({formatTime(resendTimer)})
                        </span>
                      )}
                    </button>
                  </p>
                </div>
              </div>
            </form>
          </motion.div>
        );
      } else if (step === 2) {
        // Password step
        return (
          <motion.div
            key="step-2"
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
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    stroke="#111827"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
                    stroke="#111827"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="16" r="1" fill="#111827" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2">
              Choose a password
            </h1>
            <p className="text-gray-500 text-center mb-8">
              Must be at least 8 characters.
            </p>

            <form onSubmit={handleSubmitPassword} className="space-y-6">
              <div>
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
                >
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    variant="bordered"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validatePassword(e.target.value);
                      // Clear error state when user modifies the password
                      if (notification?.type === "danger") {
                        setNotification(null);
                      }
                    }}
                    onInvalid={(e) => {
                      e.preventDefault();
                    }}
                    required
                    disabled={isLoading.passwordSubmit}
                    isInvalid={notification?.type === "danger"}
                    errorMessage={
                      notification?.type === "danger"
                        ? notification.message
                        : undefined
                    }
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="w-5 h-5 text-gray-500" />
                        ) : (
                          <EyeIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    }
                  />
                </motion.div>

                {/* Password Rules Container */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Password must have:
                  </h3>
                  <ul className="space-y-2">
                    <li className="text-sm flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordRules.minLength ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                      >
                        {passwordRules.minLength ? "✓" : "·"}
                      </span>
                      At least 8 characters
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
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordRules.hasLowercase ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                      >
                        {passwordRules.hasLowercase ? "✓" : "·"}
                      </span>
                      One lowercase letter
                    </li>
                    <li className="text-sm flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordRules.hasNumber ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                      >
                        {passwordRules.hasNumber ? "✓" : "·"}
                      </span>
                      One number
                    </li>
                    <li className="text-sm flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${passwordRules.hasSpecial ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                      >
                        {passwordRules.hasSpecial ? "✓" : "·"}
                      </span>
                      One special character (!@#$%^&*(),.?":{}|&lt;&gt;)
                    </li>
                  </ul>
                </div>
              </div>
              <button
                type="submit"
                className={`w-full py-2 bg-blue-600 text-white rounded-md font-medium ${
                  isLoading.passwordSubmit
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={isLoading.passwordSubmit}
              >
                {isLoading.passwordSubmit ? "Processing..." : "Continue"}
              </button>
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
                        d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"
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
          <img src="/images/qatalog-logo.svg" alt="Qatalog" className="h-8" />
          <span className="text-md text-gray-500 ml-3">Logo</span>
        </div>

        <div className="flex flex-col items-center min-h-screen">
          <div className="flex-1 flex items-center justify-center w-full p-8">
            <motion.div
              className="w-full max-w-3xl"
              // animate={{
              //   maxWidth: currentStep === 3 ? "64rem" : "28rem",
              //   paddingLeft: currentStep === 3 ? "2rem" : "0rem",
              //   paddingRight: currentStep === 3 ? "2rem" : "0rem",
              // }}
              // transition={{
              //   duration: 0.3,
              //   ease: "easeInOut",
              //   delay: currentStep === 3 ? 0.2 : 0,
              // }}
            >
              {/* Step content */}
              {renderStepContent()}
            </motion.div>
          </div>

          {/* Step indicators */}
          <div className="fixed bottom-8 z-10">
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg">
              <motion.div
                className={`h-2 rounded-full bg-blue-600 transition-colors`}
                animate={{
                  width:
                    currentStep === 1 || currentStep === 1.5
                      ? "2rem"
                      : "0.5rem",
                  backgroundColor:
                    currentStep === 1 || currentStep === 1.5
                      ? "#2563EB"
                      : "#E5E7EB",
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              />
              <motion.div
                className={`h-2 rounded-full bg-blue-600 transition-colors`}
                animate={{
                  width: currentStep === 2 ? "2rem" : "0.5rem",
                  backgroundColor: currentStep === 2 ? "#2563EB" : "#E5E7EB",
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              />
              <motion.div
                className={`h-2 rounded-full bg-blue-600 transition-colors`}
                animate={{
                  width: currentStep === 3 ? "2rem" : "0.5rem",
                  backgroundColor: currentStep === 3 ? "#2563EB" : "#E5E7EB",
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              />
              <motion.div
                className={`h-2 rounded-full bg-blue-600 transition-colors`}
                animate={{
                  width: currentStep === 4 ? "2rem" : "0.5rem",
                  backgroundColor: currentStep === 4 ? "#2563EB" : "#E5E7EB",
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
    </div>
  );
};

export default SignupFlow;