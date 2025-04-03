import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Spinner } from "@heroui/react";
import { useCompanyStatus } from "@/hooks/useCompanyStatus";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  requireStatus?: "pending" | "approved" | "rejected";
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireOnboarding = false,
  requireStatus,
  redirectTo = "/login",
}: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const location = useLocation();

  const userId = auth.currentUser?.uid || null;
  const { data: statusData, isLoading: statusLoading } = requireStatus
    ? useCompanyStatus(userId)
    : { data: null, isLoading: false };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        if (requireOnboarding) {
          try {
            const companyDoc = await getDoc(
              doc(db, "transportation_companies", user.uid)
            );
            setNeedsOnboarding(
              !companyDoc.exists() || !companyDoc.data()?.onboarded
            );
          } catch (error) {
            console.error("Error checking onboarding status:", error);
            setNeedsOnboarding(true);
          }
        }
      } else {
        setIsAuthenticated(false);
        setNeedsOnboarding(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [requireOnboarding]);

  if (isLoading || statusLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Auth check
  if (requireAuth && !isAuthenticated) {
    sessionStorage.setItem("redirectAfterLogin", location.pathname);
    return <Navigate to={redirectTo} replace />;
  }

  // Onboarding check
  if (requireAuth && requireOnboarding && needsOnboarding) {
    return <Navigate to="/onboarding/select-company" replace />;
  }

  // Status check
  if (requireStatus && (!statusData || statusData.status !== requireStatus)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
