import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert } from "@heroui/react";

interface NotificationProps {
  message: string;
  type: "informative" | "success" | "warning" | "danger";
  isVisible: boolean;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Reset closing state when visibility changes
    if (isVisible) {
      setIsClosing(false);
    }
  }, [isVisible]);

  useEffect(() => {
    let closeTimer: NodeJS.Timeout;
    let animationTimer: NodeJS.Timeout;

    if (autoClose && onClose && isVisible) {
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
  }, [onClose, isVisible, autoClose, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for animation to complete
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center">
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key="notification"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.5,
            }}
            className="mt-4"
            style={{
              minWidth: "240px",
              maxWidth: "40%",
              width: "fit-content",
            }}
          >
            <Alert
              color={getAlertColor(type)}
              variant="flat"
              radius="lg"
              isClosable
              onClose={handleClose}
              className="shadow-lg backdrop-blur-md bg-opacity-90 flex items-center"
            >
              <div
                className="py-1 px-2 overflow-hidden"
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
        )}
      </AnimatePresence>
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
