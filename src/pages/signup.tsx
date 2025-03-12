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
import { auth, db } from "../../FirebaseConfig";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { ImageUploadPreview } from "@/components/ImageUploadPreview";
import { FileUpload } from "@/components/ui/file-upload";

interface CompanyData {
  name: string;
  location: string;
  phone: string;
  logoPublicId: string;
  logoUrl: string;
  businessLicensePublicId?: string;
  businessLicenseUrl?: string;
}

interface LoadingState {
  logo: boolean;
  license: boolean;
  submit: boolean;
}

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState<LoadingState>({
    logo: false,
    license: false,
    submit: false,
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
    location: "",
    phone: "",
    logoPublicId: "",
    logoUrl: "",
    businessLicensePublicId: "",
    businessLicenseUrl: "",
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

    if (
      !companyData.name ||
      !companyData.location ||
      !companyData.phone ||
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

      // Prepare company data for Firestore
      const companyDocData = {
        ...companyData,
        userId: userCredential.user.uid,
        email: userCredential.user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add metadata for images
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
      };

      // Save company data to Firestore
      const companyRef = doc(db, "companies", userCredential.user.uid);
      await setDoc(companyRef, companyDocData);

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

                  <Input
                    label="Main Office Location"
                    value={companyData.location}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        location: e.target.value,
                      })
                    }
                    placeholder="Enter company headquarters location"
                    required
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    value={companyData.phone}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, phone: e.target.value })
                    }
                    placeholder="Enter company phone number"
                    required
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Business License (Optional)
                    </label>
                    <ImageUploadPreview
                      onFileSelect={(file) => handleFileUpload(file, "license")}
                      publicId={companyData.businessLicensePublicId}
                      isLoading={isLoading.license}
                    />
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
