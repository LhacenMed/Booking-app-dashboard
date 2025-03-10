import { useState } from "react";
import { Card, CardHeader, CardBody, Input, Button, Link } from "@heroui/react";
import DefaultLayout from "@/layouts/default";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../FirebaseConfig";
import { useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    // Password validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Signed up successfully
      setIsLoading(false);
      const user = userCredential.user;
      console.log("Created user:", user);
      navigate("/login"); // Navigate to login page after successful signup
    } catch (error: any) {
      let errorMessage = "Failed to create an account";
      // Handle specific Firebase error codes
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
          setIsLoading(false);
      }
      setError(errorMessage);
      console.error("Signup error:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="flex flex-col gap-2 items-center">
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="text-default-500">Join our community today</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
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
                placeholder="Create a password"
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
              <Button
                type="submit"
                color="primary"
                className="w-full mt-2"
                size="lg"
                isLoading={isLoading}
              >
                Sign Up
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
