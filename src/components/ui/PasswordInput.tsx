import { useState, useRef, useEffect } from "react";
import { Input } from "@heroui/react";
import lottie from "lottie-web";
import eyeAnimation from "@/assets/lottie/eye-icon-dark.json";

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function PasswordInput({
  value,
  onChange,
  error,
  disabled,
  className,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationContainer = useRef<HTMLDivElement>(null);
  const animationInstance = useRef<any>(null);

  useEffect(() => {
    if (animationContainer.current) {
      animationInstance.current = lottie.loadAnimation({
        container: animationContainer.current,
        renderer: "svg",
        loop: false,
        autoplay: false,
        animationData: eyeAnimation,
      });

      // Set animation speed (2x faster)
      animationInstance.current.setSpeed(5);

      animationInstance.current.addEventListener("complete", () => {
        setIsAnimating(false);
      });

      return () => {
        animationInstance.current?.destroy();
      };
    }
  }, []);

  const togglePasswordVisibility = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setShowPassword(!showPassword);

    if (showPassword) {
      // Play animation from frame 60 to 0 (closing eye)
      animationInstance.current?.playSegments([60, 0], true);
    } else {
      // Play animation from frame 0 to 60 (opening eye)
      animationInstance.current?.playSegments([0, 60], true);
    }
  };

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        disabled={disabled}
        isInvalid={!!error}
        errorMessage={error}
        className={className}
        variant="bordered"
        endContent={
          <button
            type="button"
            className="relative top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center focus:outline-none"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <div
              ref={animationContainer}
              className="w-6 h-6 scale-[2] translate-x-[6px]"
            />
          </button>
        }
      />
    </div>
  );
}
