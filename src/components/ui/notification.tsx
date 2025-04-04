import type React from "react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert } from "@heroui/react";

// Define the structure of a notification item
interface NotificationItem {
  id: string;
  message: string;
  type: "informative" | "success" | "warning" | "danger";
  duration?: number;
  createdAt: number;
}

interface NotificationProps {
  message: string;
  type: "informative" | "success" | "warning" | "danger";
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  id: string;
  index: number;
  total: number;
}

// Individual notification component
export const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  onClose,
  autoClose = true,
  duration = 5000,
  id,
  index,
  total,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    let closeTimer: NodeJS.Timeout;
    let animationTimer: NodeJS.Timeout;

    if (autoClose && onClose) {
      closeTimer = setTimeout(() => {
        setIsClosing(true);
        animationTimer = setTimeout(() => {
          onClose();
        }, 300); // Wait for animation to complete
      }, duration);
    }

    // Cleanup timers on unmount or when dependencies change
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(animationTimer);
    };
  }, [onClose, autoClose, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for animation to complete
  };

  // Enhanced stacking animation with 3D effect
  const scale = Math.max(0.9, 1 - index * 0.03);
  const opacity = Math.max(0.75, 1 - index * 0.15);
  const yOffset = index * 12; // Increased vertical staggering
  const zOffset = index * -5; // 3D depth effect

  return (
    <motion.div
      key={`notification-${id}`}
      initial={{ y: -50, opacity: 0, scale: 0.8, rotateX: 20 }}
      animate={{
        y: yOffset,
        opacity: isClosing ? 0 : opacity,
        scale: isClosing ? 0.8 : scale,
        rotateX: isClosing ? 20 : 0,
        z: zOffset,
        zIndex: total - index, // Higher z-index for newer notifications
      }}
      exit={{ y: -50, opacity: 0, scale: 0.8, rotateX: 20 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.6,
      }}
      className="absolute left-1/2 transform -translate-x-1/2"
      style={{
        minWidth: "500px", // Increased minimum width
        maxWidth: "60%", // Increased maximum width
        width: "fit-content",
        transformOrigin: "top center",
        perspective: "1000px",
      }}
    >
      <Alert
        color={getAlertColor(type)}
        variant="flat"
        radius="lg"
        isClosable
        onClose={handleClose}
        className="shadow-xl backdrop-blur-md bg-opacity-90 flex items-center"
      >
        <div
          className="py-2 px-2 overflow-hidden" // Increased padding
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
          }}
        >
          {message}
        </div>
      </Alert>
    </motion.div>
  );
};

// Map notification types to Hero UI Alert colors
const getAlertColor = (type: NotificationProps["type"]) => {
  switch (type) {
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    case "informative":
    default:
      return "primary";
  }
};

// Notification container component to manage multiple notifications
export const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Function to add a new notification
  const addNotification = useCallback(
    (notification: Omit<NotificationItem, "id" | "createdAt">) => {
      const id = Date.now().toString();
      const createdAt = Date.now();

      setNotifications((prev) => {
        // Limit to maximum 5 visible notifications to prevent overcrowding
        const limitedPrev = prev.slice(0, 4);
        return [{ ...notification, id, createdAt }, ...limitedPrev];
      });

      // Auto-remove notification after duration
      const duration = notification.duration || 5000;
      setTimeout(() => {
        removeNotification(id);
      }, duration);

      return id;
    },
    []
  );

  // Function to remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  // Export methods to window for global access
  useEffect(() => {
    // @ts-ignore
    window.notificationSystem = {
      addNotification,
      removeNotification,
    };
  }, [addNotification, removeNotification]);

  // Sort notifications by creation time (newest first)
  const sortedNotifications = [...notifications].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-6">
      <div
        className="relative w-full flex justify-center"
        style={{ height: "150px", perspective: "1200px" }}
      >
        <AnimatePresence mode="sync">
          {sortedNotifications.map((notification, index) => (
            <Notification
              key={notification.id}
              id={notification.id}
              message={notification.message}
              type={notification.type}
              onClose={() => removeNotification(notification.id)}
              duration={notification.duration}
              index={index}
              total={sortedNotifications.length}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Custom hook to use notification system
export const useNotification = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // @ts-ignore
    setIsReady(!!window.notificationSystem);
  }, []);

  return {
    isReady,
    addNotification: (
      notification: Omit<NotificationItem, "id" | "createdAt">
    ) => {
      // @ts-ignore
      if (window.notificationSystem) {
        // @ts-ignore
        return window.notificationSystem.addNotification(notification);
      }
      return null;
    },
    removeNotification: (id: string) => {
      // @ts-ignore
      if (window.notificationSystem) {
        // @ts-ignore
        window.notificationSystem.removeNotification(id);
      }
    },
  };
};
