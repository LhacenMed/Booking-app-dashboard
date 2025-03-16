import React from "react";
import { useCompanyStatus } from "@/hooks/useCompanyStatus";
import { auth } from "../../../FirebaseConfig";
import { Card, CardBody, Button, Spinner } from "@heroui/react";
import { FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";

export const StatusBanner = () => {
  const userId = auth.currentUser?.uid || null;
  const { data: statusData, isLoading, error } = useCompanyStatus(userId);

  if (isLoading) {
    return (
      <Card className="border-default">
        <CardBody className="flex items-center justify-center py-3">
          <Spinner size="sm" />
          <span className="ml-2">Loading status...</span>
        </CardBody>
      </Card>
    );
  }

  if (error || !statusData) {
    return (
      <Card className="border-danger">
        <CardBody className="flex items-center gap-4 py-3">
          <div className="text-danger">
            <FiXCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Error Loading Status</h3>
            <p className="text-sm text-default-500">
              {error instanceof Error
                ? error.message
                : "Failed to load company status"}
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const statusConfig = {
    pending: {
      icon: <FiClock className="w-5 h-5" />,
      color: "warning",
      title: "Account Pending Activation",
      message:
        "Your account is currently under review. This usually takes 1-2 business days.",
    },
    approved: {
      icon: <FiCheckCircle className="w-5 h-5" />,
      color: "success",
      title: "Account Activated",
      message: "Your account is active. You can now create and manage trips.",
    },
    rejected: {
      icon: <FiXCircle className="w-5 h-5" />,
      color: "danger",
      title: "Account Activation Failed",
      message:
        "Your account activation was rejected. Please contact support for more information.",
    },
  };

  const config = statusConfig[statusData.status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <Card className={`border-${config.color} bg-${config.color}/5`}>
      <CardBody className="flex items-center gap-4 py-3">
        <div className={`text-${config.color}`}>{config.icon}</div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">{config.title}</h3>
          <p className="text-sm text-default-500">{config.message}</p>
          {statusData.status === "pending" && (
            <p className="text-xs text-default-400 mt-1">
              Last updated: {statusData.updatedAt.toDate().toLocaleString()}
            </p>
          )}
        </div>
        {statusData.status === "rejected" && (
          <Button
            color="primary"
            size="sm"
            onClick={() =>
              (window.location.href = "mailto:support@example.com")
            }
          >
            Contact Support
          </Button>
        )}
      </CardBody>
    </Card>
  );
};
