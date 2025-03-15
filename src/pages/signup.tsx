import { useState } from "react";
import { Card, CardHeader, CardBody, Input, Button, Link } from "@heroui/react";
import DefaultLayout from "@/layouts/default";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../FirebaseConfig";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { ImageUploadPreview } from "@/components/ImageUploadPreview";
import { addAccountToLocalStorage } from "@/utils/localAccounts";

// Function to generate admin UID
const generateAdminId = () => {
  const randomNum = Math.floor(Math.random() * 10000); // Generate random number between 0 and 9999
  const paddedNum = randomNum.toString().padStart(4, "0"); // Pad with leading zeros if needed
  return `admin_${paddedNum}`;
};

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [logo, setLogo] = useState({ url: "", publicId: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
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

      setLogo({
        url: data.secure_url,
        publicId: data.public_id,
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Generate custom admin ID
      const adminId = generateAdminId();

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create admin document with custom ID
      const adminData = {
        name,
        email,
        logo,
        firebaseUid: userCredential.user.uid, // Store Firebase UID for reference
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in admins collection with custom ID
      await setDoc(doc(db, "admins", adminId), adminData);

      // Save to local storage with custom ID
      const accountData = {
        id: adminId,
        name,
        email,
        logo,
        lastLoginAt: new Date().toISOString(), // Add timestamp for last login
      };
      addAccountToLocalStorage(accountData);

      setIsLoading(false);
      navigate("/dashboard");
    } catch (error: any) {
      let errorMessage = "Failed to sign up";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Email already in use";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Sign up is not enabled";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak";
          break;
        default:
          errorMessage = error.message;
          break;
      }
      setError(errorMessage);
      setIsLoading(false);
      console.error("Sign up error:", error.message);
    }
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="flex flex-col gap-2 items-center">
            <h1 className="text-2xl font-bold">Create Admin Account</h1>
            <p className="text-default-500">Sign up as an administrator</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">Logo</label>
                <ImageUploadPreview
                  onFileSelect={handleFileSelect}
                  previewUrl={logo.url}
                  publicId={logo.publicId}
                  isLoading={isLoading}
                />
              </div>
              <Button
                type="submit"
                color="primary"
                className="w-full mt-2"
                size="lg"
                isLoading={isLoading}
              >
                Create Account
              </Button>
            </form>
            <div className="mt-4 text-center text-default-500">
              Already have an account?{" "}
              <Link href="/" className="text-primary">
                Sign in
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
}
