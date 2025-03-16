import React from "react";
import { useCompanyStatus } from "@/hooks/useCompanyStatus";
import { auth } from "../../FirebaseConfig";
import { StatusBanner } from "@/components/CompanyStatus/StatusBanner";
import { Spinner } from "@heroui/react";
import { Dashboard } from "@/components/Dashboard/Dashboard";

export default function DashboardPage() {
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
    return (
      <div className="container mx-auto px-4 py-8">
        <StatusBanner />
        <div className="mt-8 text-center text-red-500">
          <p>Failed to load company status. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Show restricted dashboard for non-approved companies
  if (statusData && statusData.status !== "approved") {
    return (
      <div className="container mx-auto px-4 py-8">
        <StatusBanner />
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h2>
          <p className="text-gray-600">
            Your account is currently {statusData.status}. Once approved, you'll
            have access to:
          </p>
          <ul className="list-disc list-inside mt-4 text-gray-600">
            <li>Trip Management</li>
            <li>Seat Allocation</li>
            <li>Booking Management</li>
            <li>Revenue Reports</li>
          </ul>
          <p className="mt-4 text-sm text-gray-500">
            Account created: {statusData.createdAt.toDate().toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <StatusBanner />
      <Dashboard />
    </div>
  );
}
