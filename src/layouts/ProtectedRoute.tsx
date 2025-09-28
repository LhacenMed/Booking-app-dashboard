import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Spinner } from "@heroui/react";
import { useAgency } from "@/hooks/useAgency";
import { useAuth } from "@/context/AuthContext";

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
  console.log("[ProtectedRoute] Initializing with props:", {
    requireAuth,
    requireOnboarding,
    preventIfOnboarded,
    requireStatus,
    redirectTo,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  console.log("[ProtectedRoute] Current state:", {
    isLoading,
    needsOnboarding,
    isOnboarded,
    isOffline,
    location: location.pathname,
    user: user ? { uid: user.uid, email: user.email } : null,
    authLoading,
  });

  const userId = user?.uid || null;
  const { status: statusData, isLoading: statusLoading } = requireStatus
    ? useAgency(userId)
    : { status: null, isLoading: false };

  console.log("[ProtectedRoute] Agency status:", {
    userId,
    statusData,
    statusLoading,
  });

  // Monitor online/offline status
  useEffect(() => {
    console.log("[ProtectedRoute] Setting up online/offline listeners");
    const handleOnline = () => {
      console.log("[ProtectedRoute] Device went online");
      setIsOffline(false);
    };
    const handleOffline = () => {
      console.log("[ProtectedRoute] Device went offline");
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      console.log("[ProtectedRoute] Cleaning up online/offline listeners");
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      console.log(
        "[ProtectedRoute] Checking onboarding status for user:",
        user?.uid
      );
      if (user) {
        if (requireOnboarding || preventIfOnboarded) {
          try {
            const companyDoc = await getDoc(doc(db, "agencies", user.uid));
            const onboardedStatus =
              companyDoc.exists() && companyDoc.data()?.onboarded;
            console.log("[ProtectedRoute] Company doc data:", {
              exists: companyDoc.exists(),
              onboardedStatus,
              data: companyDoc.exists() ? companyDoc.data() : null,
            });
            setIsOnboarded(onboardedStatus);
            setNeedsOnboarding(!onboardedStatus);
          } catch (error) {
            console.error(
              "[ProtectedRoute] Error checking onboarding status:",
              error
            );
            if (isOffline) {
              const lastKnownOnboardingState =
                localStorage.getItem("user_onboarded");
              console.log(
                "[ProtectedRoute] Using cached onboarding state:",
                lastKnownOnboardingState
              );
              if (lastKnownOnboardingState === "true") {
                setIsOnboarded(true);
                setNeedsOnboarding(false);
              } else if (requireOnboarding) {
                setIsOnboarded(true);
                setNeedsOnboarding(false);
              } else if (preventIfOnboarded) {
                setIsOnboarded(false);
                setNeedsOnboarding(true);
              }
            } else {
              setNeedsOnboarding(true);
              setIsOnboarded(false);
            }
          }
        }
      } else {
        console.log(
          "[ProtectedRoute] No user found, resetting onboarding state"
        );
        setNeedsOnboarding(false);
        setIsOnboarded(false);
      }
      setIsLoading(false);
    };

    checkOnboardingStatus();
  }, [user, requireOnboarding, preventIfOnboarded, isOffline]);

  useEffect(() => {
    if (user && !isLoading) {
      console.log(
        "[ProtectedRoute] Saving onboarding state to localStorage:",
        isOnboarded
      );
      localStorage.setItem("user_onboarded", isOnboarded.toString());
    }
  }, [isOnboarded, user, isLoading]);

  if (isLoading || statusLoading || authLoading) {
    console.log("[ProtectedRoute] Still loading...", {
      isLoading,
      statusLoading,
      authLoading,
    });
    return (
      <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden">
        <Spinner size="lg" />
      </div>
    );
  }

  // Auth check
  if (requireAuth && !user) {
    console.log(
      "[ProtectedRoute] Auth required but no user found, redirecting to:",
      redirectTo
    );
    sessionStorage.setItem("redirectAfterLogin", location.pathname);
    return <Navigate to={redirectTo} replace />;
  }

  // If offline and trying to access dashboard, allow access regardless of onboarding status
  if (isOffline && requireOnboarding) {
    console.log("[ProtectedRoute] Offline mode - bypassing onboarding check");
    return <>{children}</>;
  }

  // Prevent onboarded users from accessing onboarding pages
  if (preventIfOnboarded && isOnboarded && !isOffline) {
    console.log(
      "[ProtectedRoute] User is onboarded, preventing access to onboarding pages"
    );
    return <Navigate to="/dashboard" replace />;
  }

  // Onboarding check (skip if offline)
  if (requireAuth && requireOnboarding && needsOnboarding && !isOffline) {
    console.log(
      "[ProtectedRoute] User needs onboarding, redirecting to onboarding flow"
    );
    return <Navigate to="/onboarding/select-company" replace />;
  }

  // Status check (skip if offline)
  if (
    requireStatus &&
    (!statusData || statusData.status !== requireStatus) &&
    !isOffline
  ) {
    console.log("[ProtectedRoute] Status check failed:", {
      required: requireStatus,
      current: statusData?.status,
    });
    return <Navigate to="/dashboard" replace />;
  }

  console.log("[ProtectedRoute] All checks passed, rendering children");
  return <>{children}</>;
};
