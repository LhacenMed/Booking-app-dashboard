import React, { useState, useEffect } from "react";
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
} from "firebase/firestore";
// import { ImageUploadPreview } from "@/components/ImageUploadPreview";
import { addAccountToLocalStorage } from "@/utils/localAccounts";
// import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Notification } from "@/components/ui/notification";
import { motion, AnimatePresence } from "framer-motion";
import { SignupSidebar } from "@/components/Sidebar/SignupSidebar";
// import { FileUpload } from "@/components/ui/file-upload";
import { ImageUploadPreview } from "@/components/ui/ImageUploadPreview";

// Simple function to generate 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
  const [files, setFiles] = useState<File[]>([]);
  // const [message, setMessage] = useState("");
  // const [isError, setIsError] = useState(false);
  const [serverStatus, setServerStatus] = useState<"running" | "error">(
    "running"
  );

  // Update notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: "informative" | "success" | "warning" | "danger";
    isVisible: boolean;
  } | null>(null);

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

      // Generate a UID that will be used throughout the signup process
      const uid = doc(collection(db, "transportation_companies")).id;

      const docData = {
        email,
        verificationCode: code,
        createdAt: serverTimestamp(),
        email_status: "pending_verification",
        userId: uid, // Store the UID that will be used later
      };

      console.log("Document data to be stored:", docData);
      console.log("Document path:", `transportation_companies/${uid}`);

      // Create document with the generated UID
      await setDoc(doc(db, "transportation_companies", uid), docData);
      console.log("Successfully stored email, doc ID:", uid);

      // Store the UID in localStorage for later use
      localStorage.setItem("signupUID", uid);

      return uid;
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

  // Verify the code against Firestore
  const verifyCode = async (inputCode: string) => {
    try {
      console.log("Verifying code:", { email, inputCode });
      setIsLoading((prev) => ({ ...prev, verification: true }));
      const companiesRef = collection(db, "transportation_companies");
      const q = query(
        companiesRef,
        where("email", "==", email),
        where("email_status", "==", "pending_verification"),
        where("verificationCode", "==", inputCode)
      );

      console.log("Executing Firestore query...");
      const querySnapshot = await getDocs(q);
      console.log("Query results:", {
        empty: querySnapshot.empty,
        size: querySnapshot.size,
      });

      if (querySnapshot.empty) {
        throw new Error("Invalid verification code");
      }

      // Update the document status to verified
      const docRef = querySnapshot.docs[0].ref;
      console.log("Updating document status...");
      await updateDoc(docRef, {
        email_status: "verified",
        verifiedAt: serverTimestamp(),
      });
      console.log("Document status updated successfully");

      showMessage(
        "Email verified successfully! Please create your password.",
        false
      );
      setCurrentStep(2);
    } catch (error) {
      console.error("Verification error:", error);
      showMessage(
        error instanceof Error ? error.message : "Verification failed",
        true
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, verification: false }));
    }
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

  const handleFileUpload = async (file: File, type: "logo" | "license") => {
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

      // Create empty seats subcollection
      console.log("Creating seats subcollection...");
      const seatsCollectionRef = collection(companyRef, "seats");
      await setDoc(doc(seatsCollectionRef, "placeholder"), {
        createdAt: Timestamp.now(),
        placeholder: true,
      });

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

  const handleVerifyCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading((prev) => ({ ...prev, verification: true }));
    verifyCode(verificationCode).finally(() => {
      setIsLoading((prev) => ({ ...prev, verification: false }));
    });
  };

  const handleSubmitPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading((prev) => ({ ...prev, passwordSubmit: true }));

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters long", true);
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
        // Email step
        return (
          <motion.div
            key="step-1"
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
                    d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z"
                    stroke="#111827"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 6L12 13L2 6"
                    stroke="#111827"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2">
              Your details
            </h1>
            <p className="text-gray-500 text-center mb-8">
              Please provide your email to get started.
            </p>

            <form onSubmit={handleSubmitEmail} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full py-2 px-3 border border-gray-300 rounded-md"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading.emailSubmit || serverStatus !== "running"}
                />
              </div>
              <button
                type="submit"
                className={`w-full py-2 bg-blue-600 text-white rounded-md font-medium ${
                  isLoading.emailSubmit || serverStatus !== "running"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={isLoading.emailSubmit || serverStatus !== "running"}
              >
                {isLoading.emailSubmit ? "Processing..." : "Continue"}
              </button>
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
                    d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999"
                    stroke="#111827"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 4L12 14.01L9 11.01"
                    stroke="#111827"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2">
              Verify your email
            </h1>
            <p className="text-gray-500 text-center mb-8">
              We've sent a code to your email.
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  className="w-full py-2 px-3 border border-gray-300 rounded-md"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  disabled={isLoading.verification}
                />
              </div>
              <button
                type="submit"
                className={`w-full py-2 bg-blue-600 text-white rounded-md font-medium ${
                  isLoading.verification ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isLoading.verification}
              >
                {isLoading.verification ? "Verifying..." : "Verify Code"}
              </button>
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
              Must be at least 6 characters.
            </p>

            <form onSubmit={handleSubmitPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full py-2 px-3 border border-gray-300 rounded-md"
                  placeholder="Enter password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading.passwordSubmit}
                />
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
            className="w-full max-w-xl mx-auto h-[calc(100vh-12rem)] flex flex-col justify-center"
          >
            <form
              onSubmit={handleSubmitCompanyDetails}
              className="grid grid-cols-2 gap-x-6 gap-y-4"
            >
              {/* Left Column */}
              <div className="col-span-2 lg:col-span-1 space-y-4">
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

                <div>
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
              </div>

              {/* Right Column */}
              <div className="col-span-2 lg:col-span-1 space-y-4">
                <div>
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

                <div>
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
              </div>

              {/* Full-width button at the bottom */}
              <div className="col-span-2 mt-2">
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
      <SignupSidebar currentStep={currentStep} />

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
      <div className="ml-96 flex-1 min-h-screen overflow-y-auto relative">
        <div className="flex flex-col items-center min-h-screen">
          <div className="flex-1 flex items-center justify-center w-full p-8">
            <div className="w-full max-w-md">
              {/* Step content */}
              {renderStepContent()}
            </div>
          </div>

          {/* Step indicators */}
          <div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10"
            style={{ marginLeft: "192px" }}
          >
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
