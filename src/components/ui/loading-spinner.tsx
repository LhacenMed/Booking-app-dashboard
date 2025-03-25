import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "white";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "primary",
}) => {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClasses = {
    primary: "text-blue-600",
    white: "text-white",
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`
        ${sizeClasses[size]}
        ${colorClasses[color]}
        animate-spin
        rounded-full
        border-2
        border-current
        border-t-transparent
      `}
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};
