import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../FirebaseConfig";
import { Spinner } from "@heroui/react";

export default function PrivateRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // No user is signed in, redirect to login
        navigate("/login");
      }
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return <Spinner />;
  }

  return <>{children}</>;
}
