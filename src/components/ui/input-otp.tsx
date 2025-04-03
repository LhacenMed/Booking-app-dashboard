import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput> & {
    showSuccessAnimation?: boolean;
    error?: boolean;
  }
>(
  (
    { className, containerClassName, showSuccessAnimation, error, ...props },
    ref
  ) => (
    <motion.div
      animate={
        error
          ? {
              x: [0, -4, 4, -2, 2, -1, 1, 0],
            }
          : {}
      }
      transition={{
        duration: 0.5,
        ease: "easeInOut",
      }}
    >
      <OTPInput
        ref={ref}
        containerClassName={cn(
          "flex items-center gap-2 has-[:disabled]:opacity-50",
          containerClassName
        )}
        className={cn("disabled:cursor-not-allowed", className)}
        {...props}
      />
    </motion.div>
  )
);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & {
    index: number;
    showSuccessAnimation?: boolean;
  }
>(({ index, className, showSuccessAnimation, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-14 w-14 items-center justify-center text-2xl shadow-sm transition-all first:rounded-l-md last:rounded-r-md overflow-hidden",
        isActive && "z-10 ring-1 ring-gray-700",
        className
      )}
      {...props}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={
          showSuccessAnimation
            ? {
                borderColor: [
                  "rgb(209 213 219)", // gray-300
                  "rgb(34 197 94)", // green-500
                  "rgb(34 197 94)", // green-500
                  "rgb(34 197 94)", // gray-300
                ],
              }
            : {}
        }
        initial={{
          borderStyle: "solid",
          borderWidth: "1px",
          borderColor: "rgb(209 213 219)",
        }}
        transition={{
          duration: 0.5,
          delay: index * 0.1,
          times: [0, 0.3, 0.6, 1],
          ease: "easeInOut",
        }}
        style={{
          // borderStyle: "solid",
          borderRadius: "inherit",
        }}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={char || "empty"}
          initial={{ y: 0 }}
          animate={
            showSuccessAnimation
              ? {
                  y: [
                    0, // start
                    -10, // move up
                    -10, // hold position
                    0, // move down
                  ],
                  transition: {
                    duration: 0.5,
                    delay: index * 0.1, // delay for moving up
                    times: [0, 0.3, 0.6, 1], // control timing of each keyframe
                    ease: "easeInOut",
                  },
                }
              : { y: 0 }
          }
          className={"text-2xl font-ot ot-regular relative z-10"}
        >
          {char}
        </motion.div>
      </AnimatePresence>
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus />
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
