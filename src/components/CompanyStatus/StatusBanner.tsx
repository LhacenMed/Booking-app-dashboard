import React, { useState, useEffect } from "react";
import { useCompanyStatus } from "@/hooks/useCompanyStatus";
import { auth } from "../../../FirebaseConfig";
import { Card, CardBody, Button, Spinner } from "@heroui/react";
import { FiClock, FiCheckCircle, FiXCircle, FiX } from "react-icons/fi";

export const StatusBanner = () => {
  const userId = auth.currentUser?.uid || null;
  const { data: statusData, isLoading, error } = useCompanyStatus(userId);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem(`statusBannerHidden_${userId}`);
    }
    return false;
  });

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(`statusBannerHidden_${userId}`, "true");
  };

  if (!isVisible) return null;

  if (isLoading) {
    return (
      <Card className="border-default shadow-lg fixed top-0 right-0 left-[280px] z-50">
        <CardBody className="flex items-center justify-center py-3 bg-background/95 backdrop-blur-sm">
          <Spinner size="sm" />
          <span className="ml-2">Loading status...</span>
        </CardBody>
      </Card>
    );
  }

  if (error || !statusData) {
    return (
      <Card className="border-danger shadow-lg fixed top-0 right-0 left-[280px] z-50">
        <CardBody className="flex items-center gap-4 py-3 bg-background/95 backdrop-blur-sm">
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
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onClick={handleClose}
            className="text-default-400 hover:text-default-600"
          >
            <FiX className="w-4 h-4" />
          </Button>
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
    <Card
      className={`bg-background/50 shadow-lg fixed top-0 right-0 left-[280px] mt-2 ml-[300px] mr-[300px] z-50`}
    >
      <CardBody
        className={`flex items-center flex-row gap-4 py-3 backdrop-blur-sm`}
      >
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
        <div className="flex items-center gap-2">
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
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onClick={handleClose}
            className="text-default-400 hover:text-default-600"
          >
            <FiX className="w-4 h-4" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
