"use client";
import { cn } from "@/lib/utils";
import React from "react";

interface FloatingImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  animationDuration?: number;
  animationDistance?: number;
}

export const FloatingImage: React.FC<FloatingImageProps> = ({
  src,
  alt,
  width = 200,
  height = 200,
  className,
  animationDuration = 3,
  animationDistance = 20,
}) => {
  return (
    <div
      className={cn("relative", className)}
      style={{
        animation: `float ${animationDuration}s ease-in-out infinite`,
      }}
    >
      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-${animationDistance}px);
          }
        }
      `}</style>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="rounded-lg shadow-lg"
      />
    </div>
  );
};
