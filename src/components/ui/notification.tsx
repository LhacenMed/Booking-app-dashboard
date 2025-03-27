import React, { useEffect, useState } from "react";
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
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (onClose && isVisible) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onClose();
        }, 300); // Wait for animation to complete
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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
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
            className="w-full max-w-md mx-4 mt-4"
          >
            <Alert
              color={getAlertColor(type)}
              variant="flat"
              radius="lg"
              isClosable
              onClose={handleClose}
              className="shadow-lg backdrop-blur-md bg-opacity-90"
            >
              {message}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
