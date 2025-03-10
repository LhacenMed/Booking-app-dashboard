import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Button } from "@heroui/react";
import DefaultLayout from "@/layouts/default";
import { auth } from "../../FirebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user's email
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-2xl p-6">
          <CardHeader className="flex flex-col gap-2 items-center">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-default-500">Welcome back, {userEmail}</p>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-4">
              <div className="bg-default-100 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Your Account</h2>
                <p>Email: {userEmail}</p>
              </div>
              <Button color="danger" variant="flat" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
}
