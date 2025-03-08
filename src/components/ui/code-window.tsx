"use client";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../../lib/utils";

interface CodeWindowProps {
  className?: string;
  title?: string;
  code?: string;
  onCodeChange?: (code: string) => void;
}

export const CodeWindow: React.FC<CodeWindowProps> = ({
  className,
  title,
  code = 'print("Hello World!")',
  onCodeChange,
}) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [isFocused, setIsFocused] = useState(false);

  const handleCodeInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || "";
    const newCode = `print("${newText}")`;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for 1 second delay
    timeoutRef.current = setTimeout(() => {
      onCodeChange?.(newCode);
    }, 1000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "bg-[#1E1E1E] rounded-xl overflow-hidden shadow-xl w-[600px] h-[250px]",
        className
      )}
    >
      {/* Window Header */}
      <div className="flex items-center px-4 py-2 pt-[0px] bg-[#2D2D2D] ">
        {/* Window Controls */}
        <div className="flex gap-2 translate-y-2">
          <div className="w-[15px] h-[15px] rounded-full bg-[#FF5F56] cursor-pointer" />
          <div className="w-[15px] h-[15px] rounded-full bg-[#FFBD2E] cursor-pointer" />
          <div className="w-[15px] h-[15px] rounded-full bg-[#27C93F] cursor-pointer" />
        </div>
        {/* File name */}
        <div className="flex-1 mx-[180px]">
          <div className="bg-[#1E1E1E] text-white/80 text-xl font-mono rounded-t-xl py-2 mt-0 h-[40px] translate-y-3 translate-x-[-150px] relative">
            <div className="absolute inset-0 flex items-center justify-center translate-y-[-3px] select-none">
              {title}
            </div>
            {/* Close button */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                width="11"
                height="11"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white/60 hover:text-white/80 hover:cursor-pointer transition-colors"
              >
                <path
                  d="M13 1L1 13M1 1L13 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Code Content */}
      <div className="flex">
        {/* Line Numbers */}
        <div className="pl-4 pr-3 pb-[150px] pt-7 font-mono text-3xl text-gray-500 border-r border-gray-700 select-none">
          1
        </div>
        {/* Code */}
        <div className="pt-6 pl-3 font-mono text-3xl">
          <div className="flex items-center">
            <span className="text-[#9ec955]">print</span>
            <span className="text-white">(</span>
            <span className="text-[#55b5db]">"</span>
            <span
              contentEditable
              suppressContentEditableWarning
              className="text-[#55b5db] outline-none px-0.5"
              onInput={handleCodeInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            >
              {code.match(/"([^"]*)"/)?.[1] || "Hello World!"}
            </span>
            <span className="text-[#55b5db]">"</span>
            <span className="text-white">)</span>
          </div>
          {!isFocused && (
            <span className="inline-block w-[2px] h-[1em] ml-[1px] translate-y-[4px] bg-white/80 animate-blink"></span>
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
