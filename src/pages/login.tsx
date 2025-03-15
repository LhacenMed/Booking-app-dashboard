import { useState } from "react";
import { Card, CardHeader, CardBody, Input, Button, Link } from "@heroui/react";
import DefaultLayout from "@/layouts/default";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../FirebaseConfig";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { addAccountToLocalStorage } from "@/utils/localAccounts";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting login with:", email);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Login successful, user:", userCredential.user.uid);

      // Query admins collection to find the admin document with matching Firebase UID
      const adminsQuery = query(
        collection(db, "admins"),
        where("firebaseUid", "==", userCredential.user.uid)
      );
      const querySnapshot = await getDocs(adminsQuery);

      if (querySnapshot.empty) {
        throw new Error(
          "Unauthorized access. This login is for administrators only."
        );
      }

      // Get the first matching admin document
      const adminDoc = querySnapshot.docs[0];
      const adminData = adminDoc.data();
      console.log("Admin data fetched:", adminData);

      // Save to local storage with custom admin ID
      const accountData = {
        id: adminDoc.id, // This is the custom admin_XXXX ID
        name: adminData.name,
        email: adminData.email,
        logo: adminData.logo,
        lastLoginAt: new Date().toISOString(),
      };

      // Debug local storage before saving
      console.log(
        "Current local storage:",
        localStorage.getItem("recentAccounts")
      );
      console.log("About to save account data:", accountData);

      const saved = addAccountToLocalStorage(accountData);

      // Debug local storage after saving
      console.log("Save to local storage result:", saved);
      console.log(
        "Updated local storage:",
        localStorage.getItem("recentAccounts")
      );

      setIsLoading(false);
      navigate("/dashboard");
    } catch (error: any) {
      let errorMessage = "Failed to login";
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled";
          break;
        case "auth/user-not-found":
          errorMessage = "User not found";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password";
          break;
        default:
          errorMessage = error.message;
          break;
      }
      setError(errorMessage);
      setIsLoading(false);
      console.error("Login error:", error.message);
    }
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="flex flex-col gap-2 items-center">
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="text-default-500">
              Sign in to access admin dashboard
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
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
              <Button
                type="submit"
                color="primary"
                className="w-full mt-2"
                size="lg"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
}
