import type React from "react";
import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
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
  count = 1,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<number>();

  useEffect(() => {
    if (!autoClose || !onClose || isHovered) {
      clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = window.setTimeout(onClose, duration);
    return () => clearTimeout(timerRef.current);
  }, [autoClose, duration, onClose, isHovered]);

  return (
    <div
      style={{
        position: "fixed",
        right: "1rem",
        zIndex: 10000,
        minWidth: "280px",
        maxWidth: "500px",
        width: "calc(100vw - 2.5rem)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Alert
        color={getAlertColor(type)}
        variant="flat"
        radius="lg"
        isClosable
        onClose={onClose}
        className={`shadow-xl backdrop-blur-md bg-opacity-90 flex items-center m-2 md:m-4 ${isHovered ? "ring-2 ring-black/5" : ""}`}
      >
        <div className="py-1.5 md:py-2 px-2 font-ot ot-medium overflow-hidden flex items-center justify-between w-full text-xs md:text-base">
          <span>{message}</span>
          {count > 1 && (
            <span className="ml-2 px-1.5 md:px-2 bg-black/10 rounded-full text-xs md:text-sm">
              {count}
            </span>
          )}
        </div>
      </Alert>
    </div>
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
  const [isAnyHovered, setIsAnyHovered] = useState(false);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const addNotification = useCallback(
    (notification: Omit<NotificationItem, "id" | "createdAt">) => {
      const id = Date.now().toString();
      const createdAt = Date.now();

      setNotifications((prev) => {
        const existingNotification = prev.find(
          (n) =>
            n.message === notification.message && n.type === notification.type
        );

        if (existingNotification) {
          return prev.map((n) =>
            n.id === existingNotification.id
              ? { ...n, count: (n.count || 1) + 1, createdAt: Date.now() }
              : n
          );
        }

        const limitedPrev = prev.slice(0, 4);
        return [{ ...notification, id, createdAt, count: 1 }, ...limitedPrev];
      });

      return id;
    },
    []
  );

  const sortedNotifications = [...notifications].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  return (
    <NotificationContext.Provider
      value={{ addNotification, removeNotification }}
    >
      {children}
      <div className="fixed right-0 top-0 z-[9999] pt-2 md:pt-4">
        <div className="relative" style={{ minHeight: "100px" }}>
          <AnimatePresence initial={false} mode="wait">
            {sortedNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ x: 50, opacity: 0, scale: 1 }}
                animate={{
                  x: -15,
                  y: index * (window.innerWidth < 768 ? 8 : 12),
                  opacity: 1,
                  scale: 1 - index * (window.innerWidth < 768 ? 0.01 : 0.02),
                }}
                exit={{ x: 50, opacity: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  scale: {
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                  },
                }}
                style={{
                  position: "absolute",
                  width: "100%",
                  top: 0,
                  zIndex: sortedNotifications.length - index,
                }}
                onMouseEnter={() => setIsAnyHovered(true)}
                onMouseLeave={() => setIsAnyHovered(false)}
              >
                <Notification
                  key={notification.id}
                  id={notification.id}
                  message={notification.message}
                  type={notification.type}
                  onClose={() => removeNotification(notification.id)}
                  duration={notification.duration}
                  index={index}
                  count={notification.count}
                  autoClose={!isAnyHovered}
                />
              </motion.div>
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
