import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Button } from "@heroui/react";
import DefaultLayout from "@/layouts/default";
import { auth } from "../../FirebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

interface CompanyData {
  name: string;
  email: string;
  logo: {
    url: string;
  };
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const companyDoc = await getDoc(doc(db, "companies", user.uid));
          if (companyDoc.exists()) {
            setCompanyData({
              name: companyDoc.data().name,
              email: companyDoc.data().email,
              logo: companyDoc.data().logo,
            });
          }
        } catch (error) {
          console.error("Error fetching company data:", error);
        }
      } else {
        setCompanyData(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <Card className="w-full max-w-2xl p-6">
          <CardHeader className="flex flex-col gap-2 items-center">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-default-500">Welcome back, {companyData?.name}</p>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-4">
              <div className="bg-default-100 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Your Account</h2>
                <p>Email: {userEmail}</p>
              </div>
              <Button color="danger" variant="flat" onPress={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
}
