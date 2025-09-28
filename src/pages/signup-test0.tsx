import { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Link,
  // Divider,
} from "@heroui/react";
import DefaultLayout from "@/layouts/default";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface LoadingState {
  submit: boolean;
}

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState<LoadingState>({
    submit: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const { session, signUpNewUser } = useAuth();
  console.log(session);

  const navigate = useNavigate();

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

    try {
      const result = await signUpNewUser(email, password);
      if (result.success) {
        navigate("/login");
      }
    } catch (error) {
      setError("An error occurred: " + error);
    } finally {
      setIsLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <Card className="w-full max-w-2xl p-6">
          <CardHeader className="flex flex-col gap-2 items-center">
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="text-default-500">Join our transportation platform</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              <div className="mb-4">
                <div className="space-y-3">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
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

              <Button
                type="submit"
                color="primary"
                className="w-full mt-6"
                size="lg"
                isLoading={isLoading.submit}
              >
                Create Account
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
