import { useNavigate } from "react-router-dom";
import { useAgency } from "@/hooks/useAgency";
import { auth } from "@/config/firebase";
import { StatusBanner } from "@/components/CompanyStatus/StatusBanner";
import { Button, Spinner } from "@heroui/react";
import { Dashboard } from "@/components/Dashboard/Dashboard";
import { DashboardTopBar } from "@/components/Dashboard/DashboardTopBar";

export default function DashboardPage() {
  const navigate = useNavigate();
  const userId = auth.currentUser?.uid || null;
  const { status: statusData, isLoading, error } = useAgency(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto">
        <div className="mt-8 text-center text-red-500">
          <p>Failed to load company status. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Show restricted dashboard for non-approved companies
  if (statusData && statusData.status !== "approved") {
    return (
      <div className="container mx-auto px-4 py-[200px] flex justify-center">
        <StatusBanner />
        <div className="flex flex-col justify-center items-center">
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

  if (!userId) {
    return (
      <div className="container mx-auto">
        <DashboardTopBar showSearch={false} />
        <div className="text-xl font-medium text-default-500 text-center pt-20">
          Please sign in to continue
          <div className="mt-3">
            <Button onPress={() => navigate("/login")}>Login</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <StatusBanner />
      <Dashboard />
    </div>
  );
}
