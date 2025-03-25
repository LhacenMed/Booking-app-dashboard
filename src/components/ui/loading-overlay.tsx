import React from "react";
import { LoadingSpinner } from "./loading-spinner";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  blur?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = "Loading...",
  blur = true,
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-white/80 ${blur ? "backdrop-blur-sm" : ""}`}
      ></div>
      <div className="relative z-10 text-center">
        <LoadingSpinner size="lg" />
        {message && <p className="mt-4 text-gray-600 font-medium">{message}</p>}
      </div>
    </div>
  );
};
