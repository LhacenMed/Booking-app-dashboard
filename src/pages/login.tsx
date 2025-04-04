import { useState } from "react";
import { Card, CardHeader, CardBody, Input, Button, Link } from "@heroui/react";
import DefaultLayout from "@/layouts/default";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "@/config/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { addAccountToLocalStorage } from "@/utils/localAccounts";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Successfully logged out");
      // Clear any stored user data if needed
      localStorage.removeItem("currentAccount");
      setError(""); // Clear any existing errors
    } catch (error: any) {
      console.error("Logout error:", error);
      setError("Failed to logout: " + error.message);
    }
  };

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

      // Get company data
      const companyDoc = await getDoc(
        doc(db, "agencies", userCredential.user.uid)
      );
      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        console.log("Company data fetched:", companyData);

        // Save to local storage
        const accountData = {
          id: userCredential.user.uid,
          name: companyData.name,
          email: companyData.email,
          logo: companyData.logo,
        };
        console.log("Saving account to local storage:", accountData);
        const saved = addAccountToLocalStorage(accountData);
        console.log("Save to local storage result:", saved);
      } else {
        console.log("No company data found for user:", userCredential.user.uid);
      }

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
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-default-500">Sign in to continue</p>
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
            <div className="mt-4 text-center text-default-500">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary">
                Sign up
              </Link>
            </div>
            <div className="mt-4 text-center">
              <Button
                color="danger"
                variant="light"
                onPress={handleLogout}
                size="sm"
              >
                Logout
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
}
