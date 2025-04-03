import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Grid Background */}
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:50px_50px]",
          "[background-image:linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)]",
        )}
      />

      {/* Radial gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
