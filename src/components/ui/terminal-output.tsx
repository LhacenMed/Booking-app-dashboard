"use client";
import React, { useState, useEffect } from "react";
import { cn } from "../../../lib/utils";

interface TerminalOutputProps {
  className?: string;
  output?: string;
  isLoading?: boolean;
}

const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  className,
  output = "Hello World!",
  isLoading = false,
}) => {
  const [spinnerFrame, setSpinnerFrame] = useState(0);

  useEffect(() => {
    let spinInterval: NodeJS.Timeout;

    if (isLoading) {
      spinInterval = setInterval(() => {
        setSpinnerFrame((prev) => (prev + 1) % spinnerFrames.length);
      }, 80);
    }

    return () => {
      if (spinInterval) {
        clearInterval(spinInterval);
      }
    };
  }, [isLoading]);

  return (
    <div
      className={cn(
        "bg-[#1E1E1E] rounded-xl overflow-hidden shadow-xl w-[300px]",
        className
      )}
    >
      {/* Terminal Header */}
      <div className="flex items-center px-4 py-2 bg-[#2D2D2D]">
        {/* Window Controls */}
        <div className="flex gap-2">
          <div className="w-[15px] h-[15px] rounded-full bg-[#FF5F56] cursor-pointer" />
          <div className="w-[15px] h-[15px] rounded-full bg-[#FFBD2E] cursor-pointer" />
          <div className="w-[15px] h-[15px] rounded-full bg-[#27C93F] cursor-pointer" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-white/60 text-sm font-mono select-none">
            Output
          </span>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 font-mono">
        <div className="flex gap-2 text-white/80">
          <span className="text-green-500 select-none">➜</span>
          <span className="text-blue-400">python</span>
          <span>app.py</span>
        </div>
        <div className="mt-2 text-white min-h-[24px] flex flex-col">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-4 text-white/80">
                {spinnerFrames[spinnerFrame]}
              </span>
              <span className="text-white/60">Running script...</span>
            </div>
          ) : (
            <>
              <div>{output}</div>
              <div className="mt-1 w-[8px] h-[18px] bg-white/80 animate-blink" />
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1.5s step-end infinite;
        }
      `}</style>
    </div>
  );
};
