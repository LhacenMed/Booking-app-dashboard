import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { cn, Spinner } from "@heroui/react";
import { useAgency } from "@/hooks/useAgency";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  preventIfOnboarded?: boolean;
  requireStatus?: "pending" | "approved" | "rejected";
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireOnboarding = false,
  preventIfOnboarded = false,
  requireStatus,
  redirectTo = "/login",
}: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const location = useLocation();

  const userId = auth.currentUser?.uid || null;
  const { status: statusData, isLoading: statusLoading } = requireStatus
    ? useAgency(userId)
    : { status: null, isLoading: false };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        if (requireOnboarding || preventIfOnboarded) {
          try {
            const companyDoc = await getDoc(doc(db, "agencies", user.uid));
            const onboardedStatus =
              companyDoc.exists() && companyDoc.data()?.onboarded;
            setIsOnboarded(onboardedStatus);
            setNeedsOnboarding(!onboardedStatus);
          } catch (error) {
            console.error("Error checking onboarding status:", error);
            // When offline, don't redirect to onboarding
            if (isOffline) {
              // Use session storage or localStorage to remember last known state if available
              const lastKnownOnboardingState =
                localStorage.getItem("user_onboarded");
              if (lastKnownOnboardingState === "true") {
                setIsOnboarded(true);
                setNeedsOnboarding(false);
              } else if (requireOnboarding) {
                // For the dashboard route that requires onboarding
                // Default to assuming the user is onboarded when offline
                setIsOnboarded(true);
                setNeedsOnboarding(false);
              } else if (preventIfOnboarded) {
                // For the onboarding route that should be prevented if onboarded
                // Default to allowing access to onboarding when offline only if explicitly going there
                setIsOnboarded(false);
                setNeedsOnboarding(true);
              }
            } else {
              // If error is not related to being offline, use default behavior
              setNeedsOnboarding(true);
              setIsOnboarded(false);
            }
          }
        }
      } else {
        setIsAuthenticated(false);
        setNeedsOnboarding(false);
        setIsOnboarded(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [requireOnboarding, preventIfOnboarded, isOffline]);

  // Save onboarding state to localStorage when it changes
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      localStorage.setItem("user_onboarded", isOnboarded.toString());
    }
  }, [isOnboarded, isAuthenticated, isLoading]);

  if (isLoading || statusLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center min-h-screen relative overflow-hidden bg-black">
        {/* Grid Background */}
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:50px_50px]",
            "[background-image:linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)]"
          )}
        />
        {/* Radial gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
          aria-hidden="true"
        />
        <Spinner size="lg" />
      </div>
    );
  }

  // Auth check
  if (requireAuth && !isAuthenticated) {
    sessionStorage.setItem("redirectAfterLogin", location.pathname);
    return <Navigate to={redirectTo} replace />;
  }

  // If offline and trying to access dashboard, allow access regardless of onboarding status
  if (isOffline && requireOnboarding) {
    return <>{children}</>;
  }

  // Prevent onboarded users from accessing onboarding pages
  if (preventIfOnboarded && isOnboarded && !isOffline) {
    return <Navigate to="/dashboard" replace />;
  }

  // Onboarding check (skip if offline)
  if (requireAuth && requireOnboarding && needsOnboarding && !isOffline) {
    return <Navigate to="/onboarding/select-company" replace />;
  }

  // Status check (skip if offline)
  if (
    requireStatus &&
    (!statusData || statusData.status !== requireStatus) &&
    !isOffline
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
