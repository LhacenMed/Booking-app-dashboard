import type React from "react";
import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert } from "@heroui/react";

// Define the structure of a notification item
interface NotificationItem {
  id: string;
  message: string;
  type: "informative" | "success" | "warning" | "danger";
  duration?: number;
  createdAt: number;
  count?: number; // Add count for repeated messages
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
  count?: number; // Add count prop with default value
}

// Create a context for notifications
interface NotificationContextType {
  addNotification: (
    notification: Omit<NotificationItem, "id" | "createdAt">
  ) => string;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

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
  count = 1, // Add count prop with default value
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Reset the timer when count changes
  useEffect(() => {
    if (!autoClose || !onClose) return;

    const closeTimer = setTimeout(() => {
      setIsClosing(true);
      const animationTimer = setTimeout(() => {
        onClose();
      }, 300);

      return () => clearTimeout(animationTimer);
    }, duration);

    return () => clearTimeout(closeTimer);
  }, [onClose, autoClose, duration, count]); // Reset timer when count changes

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  // Modified stacking animation for right-side notifications
  const yOffset = index * 12; // Vertical stacking
  const opacity = Math.max(0.75, 1 - index * 0.15);

  return (
    <motion.div
      key={`notification-${id}`}
      initial={{ x: 100, opacity: 0 }}
      animate={{
        x: -50,
        y: yOffset,
        opacity: isClosing ? 0 : opacity,
      }}
      exit={{ x: 100, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
      className="fixed right-0 transform"
      style={{
        maxWidth: "500px", // Fixed width for notifications
        zIndex: 9999 - index, // Ensure proper stacking
      }}
    >
      <Alert
        color={getAlertColor(type)}
        variant="flat"
        radius="lg"
        isClosable
        onClose={handleClose}
        className="shadow-xl backdrop-blur-md bg-opacity-90 flex items-center m-4"
      >
        <div className="py-2 px-2 font-ot ot-medium overflow-hidden flex items-center justify-between w-full">
          <span>{message}</span>
          {count > 1 && (
            <span className="px-2 bg-black/10 rounded-full text-sm">
              {count}
            </span>
          )}
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

// Notification provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});

  // Function to remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
    
    // Clear the timer
    const timerId = activeTimers[id];
    if (timerId) {
      clearTimeout(timerId);
      setActiveTimers((prev) => {
        const newTimers = { ...prev };
        delete newTimers[id];
        return newTimers;
      });
    }
  }, [activeTimers]);

  // Function to add a new notification
  const addNotification = useCallback(
    (notification: Omit<NotificationItem, "id" | "createdAt">) => {
      const id = Date.now().toString();
      const createdAt = Date.now();

      setNotifications((prev) => {
        // Check if there's an existing notification with the same message and type
        const existingNotification = prev.find(
          (n) => n.message === notification.message && n.type === notification.type
        );

        if (existingNotification) {
          // Clear existing timer
          const existingTimerId = activeTimers[existingNotification.id];
          if (existingTimerId) {
            clearTimeout(existingTimerId);
          }

          // Set new timer
          const duration = notification.duration || 5000;
          const newTimerId = window.setTimeout(() => {
            removeNotification(existingNotification.id);
          }, duration);

          // Update timers
          setActiveTimers((prev) => ({
            ...prev,
            [existingNotification.id]: newTimerId,
          }));

          return prev.map((n) =>
            n.id === existingNotification.id
              ? { ...n, count: (n.count || 1) + 1, createdAt: Date.now() }
              : n
          );
        }

        // Set timer for new notification
        const duration = notification.duration || 5000;
        const newTimerId = window.setTimeout(() => {
          removeNotification(id);
        }, duration);

        // Store new timer
        setActiveTimers((prev) => ({
          ...prev,
          [id]: newTimerId,
        }));

        // Limit to maximum 5 visible notifications
        const limitedPrev = prev.slice(0, 4);
        return [{ ...notification, id, createdAt, count: 1 }, ...limitedPrev];
      });

      return id;
    },
    [removeNotification, activeTimers]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(activeTimers).forEach((timerId) => {
        clearTimeout(timerId);
      });
    };
  }, [activeTimers]);

  // Sort notifications by creation time (newest first)
  const sortedNotifications = [...notifications].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  return (
    <NotificationContext.Provider
      value={{ addNotification, removeNotification }}
    >
      {children}
      <div className="fixed right-0 top-0 z-50 pt-4">
        <div className="relative" style={{ minHeight: "100px" }}>
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
                count={notification.count}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification system
export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }

  return context;
};
