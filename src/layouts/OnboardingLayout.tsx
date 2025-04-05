import { ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useNotification } from "@/components/ui/notification";
import { Spinner } from "@heroui/react";

interface NotificationData {
  message: string;
  type: "informative" | "success" | "warning" | "danger";
  id?: number; // Make id optional since old code may not have it
}

interface OnboardingLayoutProps {
  children: ReactNode;
  notification?: NotificationData | null;
  isLoading?: boolean; // Add loading state prop
  loadingText?: string; // Optional loading text
}

export default function OnboardingLayout({
  children,
  notification,
  isLoading = false,
  loadingText = "Loading...",
}: OnboardingLayoutProps) {
  const { addNotification } = useNotification();
  const lastNotificationRef = useRef<number | undefined>();

  // Show notification when prop changes
  useEffect(() => {
    // Only show notification if it's new (different id)
    if (notification && notification.id !== lastNotificationRef.current) {
      lastNotificationRef.current = notification.id;
      addNotification({
        message: notification.message,
        type: notification.type,
        duration: 5000,
      });
    }
  }, [notification, addNotification]); // Simplified dependency array

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
      {/* Loading Overlay */}
      {isLoading ? (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-black/10 rounded-lg p-6 flex flex-col items-center gap-3">
            <Spinner size="lg" />
          </div>
        </div>
      ) : (
        <div className="relative z-10">{children}</div>
      )}
    </div>
  );
}
