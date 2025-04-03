import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Notification } from "@/components/ui/notification";

interface NotificationData {
  message: string;
  type: "informative" | "success" | "warning" | "danger";
}

interface OnboardingLayoutProps {
  children: ReactNode;
  notification?: NotificationData | null;
}

export default function OnboardingLayout({
  children,
  notification,
}: OnboardingLayoutProps) {
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [activeNotification, setActiveNotification] =
    useState<NotificationData | null>(null);

  // Handle notification changes
  useEffect(() => {
    if (notification) {
      setActiveNotification(notification);
      setIsNotificationVisible(true);
    } else {
      setIsNotificationVisible(false);
    }
  }, [notification]);

  const handleCloseNotification = () => {
    setIsNotificationVisible(false);
  };

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
      {/* Notification */}
      {activeNotification && (
        <Notification
          message={activeNotification.message}
          type={activeNotification.type}
          isVisible={isNotificationVisible}
          onClose={handleCloseNotification}
        />
      )}
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
