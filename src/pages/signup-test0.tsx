import { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Link,
  Divider,
} from "@heroui/react";
import DefaultLayout from "@/layouts/default";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/config/firebase";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, collection } from "firebase/firestore";
import { ImageUploadPreview } from "@/components/ui/ImageUploadPreview";
import { FileUpload } from "@/components/ui/file-upload";
import { addAccountToLocalStorage } from "@/utils/localAccounts";
import { GeoPoint, Timestamp } from "firebase/firestore";

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
  logo: boolean;
  license: boolean;
  submit: boolean;
  location: boolean;
}

interface LocationInput {
  latitude: string;
  longitude: string;
}

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [locationInput, setLocationInput] = useState<LocationInput>({
    latitude: "",
    longitude: "",
  });
  const [isLoading, setIsLoading] = useState<LoadingState>({
    logo: false,
    license: false,
    submit: false,
    location: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const handleFilesUpload = (files: File[]) => {
    setFiles(files);
    console.log(files);
  };
  const navigate = useNavigate();

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

  const handleFileUpload = async (file: File, type: "logo" | "license") => {
    try {
      setIsLoading((prev) => ({ ...prev, [type]: true }));
      setError("");

      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("File size should be less than 5MB");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "booking-app");
      formData.append("cloud_name", "dwctkor2s");

      console.log("Uploading file:", file.name);

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dwctkor2s/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Upload response:", data);

      if (!response.ok || data.error) {
        console.error("Cloudinary error response:", data);
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
      } else {
        throw new Error("Missing public_id or secure_url in response");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error uploading file. Please try again."
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleLocationChange = (field: keyof LocationInput, value: string) => {
    // Only allow numbers, decimal point, and minus sign
    if (!/^-?\d*\.?\d*$/.test(value) && value !== "") return;

    setLocationInput((prev) => ({
      ...prev,
      [field]: value,
    }));

    const lat =
      field === "latitude" ? Number(value) : Number(locationInput.latitude);
    const lng =
      field === "longitude" ? Number(value) : Number(locationInput.longitude);

    // Update GeoPoint only if both values are valid numbers
    if (!isNaN(lat) && !isNaN(lng)) {
      setCompanyData((prev) => ({
        ...prev,
        location: new GeoPoint(lat, lng),
      }));
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading((prev) => ({ ...prev, location: true }));
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Update both the input fields and the GeoPoint
        setLocationInput({
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        });

        setCompanyData((prev) => ({
          ...prev,
          location: new GeoPoint(latitude, longitude),
        }));

        setIsLoading((prev) => ({ ...prev, location: false }));
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
        setError(errorMessage);
        setIsLoading((prev) => ({ ...prev, location: false }));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading((prev) => ({ ...prev, submit: true }));

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading((prev) => ({ ...prev, submit: false }));
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters");
      setIsLoading((prev) => ({ ...prev, submit: false }));
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
      setError("Please enter valid location coordinates");
      setIsLoading((prev) => ({ ...prev, submit: false }));
      return;
    }

    if (
      !companyData.name ||
      !locationInput.latitude ||
      !locationInput.longitude ||
      !companyData.phoneNumber ||
      !companyData.logoPublicId ||
      !companyData.logoUrl
    ) {
      setError(
        "Please fill in all required company information and upload a logo"
      );
      setIsLoading((prev) => ({ ...prev, submit: false }));
      return;
    }

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create GeoPoint from validated coordinates
      const geoPoint = new GeoPoint(latitude, longitude);

      // Prepare company data for Firestore
      const companyDocData = {
        name: companyData.name,
        email: userCredential.user.email,
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
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Save company data to Firestore
      const companyRef = doc(db, "agencies", userCredential.user.uid);
      await setDoc(companyRef, companyDocData);

      // Create empty trips subcollection
      const tripsCollectionRef = collection(companyRef, "trips");
      await setDoc(doc(tripsCollectionRef, "placeholder"), {
        createdAt: Timestamp.now(),
        placeholder: true,
      });

      // Create empty seats subcollection
      const seatsCollectionRef = collection(companyRef, "seats");
      await setDoc(doc(seatsCollectionRef, "placeholder"), {
        createdAt: Timestamp.now(),
        placeholder: true,
      });

      // Save to local storage
      addAccountToLocalStorage({
        id: userCredential.user.uid,
        name: companyData.name,
        email: userCredential.user.email || "",
        logo: {
          publicId: companyData.logoPublicId,
          url: companyData.logoUrl,
          uploadedAt: new Date().toISOString(),
        },
      });

      console.log("Company data saved successfully:", companyDocData);
      setIsLoading((prev) => ({ ...prev, submit: false }));
      navigate("/login");
    } catch (error: any) {
      let errorMessage = "Failed to create an account";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Email already in use";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Email/password accounts are not enabled";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak";
          break;
        default:
          errorMessage = error.message;
      }
      setError(errorMessage);
      console.error("Signup error:", error.message);
    } finally {
      setIsLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <Card className="w-full max-w-2xl p-6">
          <CardHeader className="flex flex-col gap-2 items-center">
            <h1 className="text-2xl font-bold">Create Company Account</h1>
            <p className="text-default-500">Join our transportation platform</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-3">
                  Authentication Details
                </h2>
                <div className="space-y-3">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter company email"
                    required
                  />
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="focus:outline-none"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    }
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              <Divider className="my-4" />

              <div>
                <h2 className="text-xl font-semibold mb-3">
                  Company Information
                </h2>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Company Logo
                    </label>
                    {/* <ImageUploadPreview
                      onFileSelect={(file) => handleFileUpload(file, "logo")}
                      publicId={companyData.logoPublicId}
                      required={true}
                      isLoading={isLoading.logo}
                    /> */}
                    <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
                      <FileUpload
                        onChange={handleFilesUpload}
                        type="logo"
                        setCompanyData={setCompanyData}
                      />
                    </div>
                  </div>

                  <Input
                    label="Company Name"
                    value={companyData.name}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, name: e.target.value })
                    }
                    placeholder="Enter registered company name"
                    required
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium">
                        Company Location
                      </label>
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onClick={getCurrentLocation}
                        isLoading={isLoading.location}
                        startContent={
                          !isLoading.location && (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          )
                        }
                      >
                        {isLoading.location
                          ? "Getting Location..."
                          : "Use Current Location"}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Latitude"
                        value={locationInput.latitude}
                        onChange={(e) =>
                          handleLocationChange("latitude", e.target.value)
                        }
                        placeholder="Waiting for location..."
                        required
                        description="Use current location button above"
                        isDisabled={isLoading.location}
                        isReadOnly
                      />
                      <Input
                        label="Longitude"
                        value={locationInput.longitude}
                        onChange={(e) =>
                          handleLocationChange("longitude", e.target.value)
                        }
                        placeholder="Waiting for location..."
                        required
                        description="Use current location button above"
                        isDisabled={isLoading.location}
                        isReadOnly
                      />
                    </div>
                  </div>

                  <Input
                    label="Phone Number"
                    type="tel"
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

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Business License (Optional)
                    </label>
                    {/* <ImageUploadPreview
                      onFileSelect={(file) => handleFileUpload(file, "license")}
                      publicId={companyData.businessLicensePublicId}
                      isLoading={isLoading.license}
                    /> */}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                color="primary"
                className="w-full mt-6"
                size="lg"
                isLoading={isLoading.submit}
              >
                Create Company Account
              </Button>
            </form>
            <div className="mt-4 text-center text-default-500">
              Already have an account?{" "}
              <Link href="/login" className="text-primary">
                Sign in
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
}
