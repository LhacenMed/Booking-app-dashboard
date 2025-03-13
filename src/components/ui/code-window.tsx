"use client";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../../lib/utils";
import { Tooltip } from "@heroui/react";

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
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [displayText, setDisplayText] = useState("Hello World!");
  const isFirstMount = useRef(true);
  const MAX_LENGTH = 20;

  // Initial load effect
  useEffect(() => {
    if (isFirstMount.current) {
      // Simulate initial loading with default text
      timeoutRef.current = setTimeout(() => {
        onCodeChange?.(`print("${displayText}");`);
        setIsRefreshing(false);
      }, 1000);
      isFirstMount.current = false;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Run only on mount

  // Update display text when code prop changes, but only after first mount
  useEffect(() => {
    if (!isFirstMount.current) {
      const newText = code.match(/"([^"]*)"/)?.[1] || "";
      setDisplayText(newText);
    }
  }, [code]);

  const handleCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;

    // Prevent input if max length is exceeded
    if (newText.length > MAX_LENGTH) {
      e.target.value = newText.slice(0, MAX_LENGTH);
      e.target.blur();
      return;
    }

    setDisplayText(newText);
    const newCode = `print("${newText}")`;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsRefreshing(true);
    // Set new timeout for 1 second delay
    timeoutRef.current = setTimeout(() => {
      onCodeChange?.(newCode);
      setIsRefreshing(false);
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
        "bg-codeBackground rounded-xl overflow-hidden shadow-xl w-[600px] h-[250px]",
        className
      )}
    >
      {/* Window Header */}
      <div className="flex items-center px-4 py-2 pt-[0px] bg-content2">
        {/* Window Controls */}
        <div className="flex gap-2 translate-y-2">
          <div className="w-[15px] h-[15px] rounded-full bg-[#FF5F56] cursor-pointer" />
          <div className="w-[15px] h-[15px] rounded-full bg-[#FFBD2E] cursor-pointer" />
          <div className="w-[15px] h-[15px] rounded-full bg-[#27C93F] cursor-pointer" />
        </div>
        {/* File name */}
        <div className="flex-1 mx-[180px]">
          <div className="bg-codeBackground text-foreground/80 text-xl font-mono rounded-t-xl py-2 mt-0 h-[40px] translate-y-3 translate-x-[-150px] relative">
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
                className="text-foreground/60 hover:text-foreground/80 hover:cursor-pointer transition-colors"
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
        <div className="pl-4 pr-3 pb-[150px] pt-7 font-mono text-3xl text-foreground/40 border-r border-foreground/20 select-none">
          1
        </div>
        {/* Code */}
        <div className="pt-6 pl-3 font-mono text-3xl">
          <div className="flex items-center">
            <span className="text-success">print</span>
            <span className="text-foreground">(</span>
            <span className="text-primary">"</span>
            <Tooltip
              content={`${isRefreshing ? "Refreshing output..." : `Edit the string (max ${MAX_LENGTH} chars)`}`}
              placement="bottom"
              delay={0}
              closeDelay={500}
              showArrow={true}
              color={isRefreshing ? "default" : "default"}
              className="select-none"
            >
              <input
                type="text"
                value={displayText}
                maxLength={MAX_LENGTH}
                className="text-primary bg-transparent outline-none p-0 border-none w-auto font-inherit text-inherit"
                style={{
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  caretColor: "currentColor",
                  minWidth: "1ch",
                  width: `${displayText.length}ch`,
                }}
                onChange={handleCodeInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </Tooltip>
            <span className="text-primary">"</span>
            <span className="text-foreground">);</span>
          </div>
          {!isFocused && (
            <span className="inline-block w-[1px] h-[1em] ml-[1px] translate-y-[4px] bg-foreground/80 animate-blink"></span>
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
