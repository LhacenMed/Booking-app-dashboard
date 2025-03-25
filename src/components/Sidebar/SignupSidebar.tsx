"use client";

import type React from "react";
import { motion } from "framer-motion";

interface SignupSidebarProps {
  currentStep: number;
}

export const SignupSidebar: React.FC<SignupSidebarProps> = ({
  currentStep,
}) => {
  // Calculate progress percentage based on current step
  const getProgress = () => {
    if (currentStep === 1 || currentStep === 1.5) return 0;
    if (currentStep === 2) return 0.33;
    if (currentStep === 3) return 0.66;
    if (currentStep === 4) return 1;
    return 0;
  };

  // Checkmark path drawing animation
  const pathVariants = {
    hidden: { pathLength: 0, pathOffset: 0 },
    visible: {
      pathLength: 1,
      pathOffset: 0,
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="fixed top-0 left-0 h-screen w-96 border-r border-gray-200 p-8 bg-gray-50 overflow-hidden">
      <div className="flex items-center mb-12">
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-2">
          <span className="text-white text-sm">U</span>
        </div>
        <span className="font-medium text-lg">Untitled UI</span>
      </div>

      <div className="space-y-6 relative">
        {/* Animated Progress Line */}
        <motion.div
          className="absolute left-[11px] top-[28px] w-0.5 bg-blue-600 origin-top"
          initial={{ scaleY: 0 }}
          animate={{
            scaleY: getProgress(),
            transition: {
              type: "spring",
              stiffness: 100,
              damping: 30,
              mass: 1,
              velocity: 0,
              delay: currentStep === 2 ? 0.2 : 0, // Add delay when reaching step 2
            },
          }}
          style={{ height: "calc(100% - 48px)" }}
        />

        {/* Step 1 */}
        <div className="flex items-start relative z-10">
          <motion.div
            className="mt-1 w-6 h-6 rounded-full flex items-center justify-center mr-3"
            initial={{
              backgroundColor: currentStep >= 1 ? "#2563EB" : "#EFF6FF",
              borderColor: "#BFDBFE",
              borderWidth: currentStep >= 1 ? 0 : 1,
            }}
            animate={{
              backgroundColor: currentStep >= 1 ? "#2563EB" : "#EFF6FF",
              borderColor: "#BFDBFE",
              borderWidth: currentStep >= 1 ? 0 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            {currentStep > 1 && currentStep !== 1.5 ? (
              <motion.svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.2,
                  delay: currentStep === 2 ? 0.2 : 0,
                }}
              >
                <motion.path
                  d="M4 12L9 17L20 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  variants={pathVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                    delay: currentStep === 2 ? 0.2 : 0,
                  }}
                />
              </motion.svg>
            ) : (
              <span
                className={`text-sm ${currentStep === 1 || currentStep === 1.5 ? "text-white" : "text-blue-600"}`}
              >
                1
              </span>
            )}
          </motion.div>
          <div>
            <p
              className={`font-medium ${currentStep === 1 || currentStep === 1.5 ? "text-gray-900" : "text-gray-500"}`}
            >
              Your details
            </p>
            <p
              className={`text-sm ${currentStep === 1 || currentStep === 1.5 ? "text-gray-500" : "text-gray-400"}`}
            >
              Please provide your name and email
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start relative z-10">
          <motion.div
            className="mt-1 w-6 h-6 rounded-full flex items-center justify-center mr-3"
            initial={{
              backgroundColor: currentStep >= 2 ? "#2563EB" : "#EFF6FF",
              borderColor: "#BFDBFE",
              borderWidth: currentStep >= 2 ? 0 : 1,
            }}
            animate={{
              backgroundColor: currentStep >= 2 ? "#2563EB" : "#EFF6FF",
              borderColor: "#BFDBFE",
              borderWidth: currentStep >= 2 ? 0 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            {currentStep > 2 ? (
              <motion.svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.path
                  d="M4 12L9 17L20 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  variants={pathVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                  }}
                />
              </motion.svg>
            ) : (
              <span
                className={`text-sm ${currentStep === 2 ? "text-white" : "text-blue-600"}`}
              >
                2
              </span>
            )}
          </motion.div>
          <div>
            <p
              className={`font-medium ${currentStep === 2 ? "text-gray-900" : "text-gray-500"}`}
            >
              Choose a password
            </p>
            <p
              className={`text-sm ${currentStep === 2 ? "text-gray-500" : "text-gray-400"}`}
            >
              Must be at least 8 characters
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-start relative z-10">
          <motion.div
            className="mt-1 w-6 h-6 rounded-full flex items-center justify-center mr-3"
            initial={{
              backgroundColor: currentStep >= 3 ? "#2563EB" : "#EFF6FF",
              borderColor: "#BFDBFE",
              borderWidth: currentStep >= 3 ? 0 : 1,
            }}
            animate={{
              backgroundColor: currentStep >= 3 ? "#2563EB" : "#EFF6FF",
              borderColor: "#BFDBFE",
              borderWidth: currentStep >= 3 ? 0 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            {currentStep > 3 ? (
              <motion.svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.path
                  d="M4 12L9 17L20 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  variants={pathVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                  }}
                />
              </motion.svg>
            ) : (
              <span
                className={`text-sm ${currentStep === 3 ? "text-white" : "text-blue-600"}`}
              >
                3
              </span>
            )}
          </motion.div>
          <div>
            <p
              className={`font-medium ${currentStep === 3 ? "text-gray-900" : "text-gray-500"}`}
            >
              Company Details
            </p>
            <p
              className={`text-sm ${currentStep === 3 ? "text-gray-500" : "text-gray-400"}`}
            >
              Tell us about your company
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex items-start relative z-10">
          <motion.div
            className="mt-1 w-6 h-6 rounded-full flex items-center justify-center mr-3"
            initial={{
              backgroundColor: currentStep >= 4 ? "#2563EB" : "#EFF6FF",
              borderColor: "#BFDBFE",
              borderWidth: currentStep >= 4 ? 0 : 1,
            }}
            animate={{
              backgroundColor: currentStep >= 4 ? "#2563EB" : "#EFF6FF",
              borderColor: "#BFDBFE",
              borderWidth: currentStep >= 4 ? 0 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            {currentStep > 4 ? (
              <motion.svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.path
                  d="M4 12L9 17L20 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  variants={pathVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                  }}
                />
              </motion.svg>
            ) : (
              <span
                className={`text-sm ${currentStep === 4 ? "text-white" : "text-blue-600"}`}
              >
                4
              </span>
            )}
          </motion.div>
          <div>
            <p
              className={`font-medium ${currentStep === 4 ? "text-gray-900" : "text-gray-500"}`}
            >
              Add your socials
            </p>
            <p
              className={`text-sm ${currentStep === 4 ? "text-gray-500" : "text-gray-400"}`}
            >
              Share posts to your social accounts
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 p-6 w-96">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div>© Untitled UI 2077</div>
          <div>help@untitledui.com</div>
        </div>
      </div>
    </div>
  );
};
