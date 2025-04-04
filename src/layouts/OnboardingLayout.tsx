import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNotification } from "@/components/ui/notification";

interface NotificationData {
  message: string;
  type: "informative" | "success" | "warning" | "danger";
  id?: number; // Make id optional since old code may not have it
}

interface OnboardingLayoutProps {
  children: ReactNode;
  notification?: NotificationData | null;
}

export default function OnboardingLayout({
  children,
  notification,
}: OnboardingLayoutProps) {
  const { isReady, addNotification } = useNotification();

  // Show notification when prop changes and system is ready
  useEffect(() => {
    if (notification && isReady) {
      addNotification({
        message: notification.message,
        type: notification.type,
        duration: 5000,
      });
    }
  }, [
    notification?.id,
    notification?.message,
    notification?.type,
    addNotification,
    isReady,
  ]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
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
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
