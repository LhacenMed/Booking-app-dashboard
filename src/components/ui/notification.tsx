import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert } from "@heroui/react";

interface NotificationProps {
  message: string;
  type: "informative" | "success" | "warning" | "danger";
  isVisible: boolean;
  onClose?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  isVisible,
  onClose,
}) => {
  useEffect(() => {
    if (onClose && isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto close after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [onClose, isVisible]);

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

  return (
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
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md backdrop-blur-md"
        >
          <Alert
            color={getAlertColor(type)}
            variant="flat"
            radius="lg"
            isClosable
            onClose={onClose}
            className="shadow-lg"
          >
            {message}
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
