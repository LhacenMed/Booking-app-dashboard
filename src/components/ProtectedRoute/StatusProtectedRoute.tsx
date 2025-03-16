import React from "react";
import { Navigate } from "react-router-dom";
import { useCompanyStatus } from "@/hooks/useCompanyStatus";
import { auth } from "../../../FirebaseConfig";
import { Spinner } from "@heroui/react";

interface StatusProtectedRouteProps {
  children: React.ReactNode;
  requiredStatus?: "pending" | "approved" | "rejected";
  fallbackPath?: string;
}

export const StatusProtectedRoute: React.FC<StatusProtectedRouteProps> = ({
  children,
  requiredStatus = "approved",
  fallbackPath = "/dashboard",
}) => {
  const userId = auth.currentUser?.uid || null;
  const { data: statusData, isLoading, error } = useCompanyStatus(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    console.error("Error loading company status:", error);
    return <Navigate to={fallbackPath} replace />;
  }

  if (!statusData || statusData.status !== requiredStatus) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
