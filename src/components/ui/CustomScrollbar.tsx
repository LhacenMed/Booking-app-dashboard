import React, { useEffect, useRef, useState } from "react";

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
}

export const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  children,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    setIsVisible(true);

    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Set new timeout to hide scrollbar
    scrollTimeout.current = setTimeout(() => {
      setIsVisible(false);
    }, 1500); // Hide after 1.5 seconds of no scrolling
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-y-auto overflow-x-hidden ${className}`}
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: isVisible
          ? "rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.1)"
          : "transparent transparent",
      }}
    >
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${isVisible ? "rgba(0, 0, 0, 0.1)" : "transparent"};
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${isVisible ? "rgba(0, 0, 0, 0.3)" : "transparent"};
            border-radius: 4px;
            transition: background 0.3s ease;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${isVisible ? "rgba(0, 0, 0, 0.5)" : "transparent"};
          }
        `}
      </style>
      <div className="custom-scrollbar h-full">{children}</div>
    </div>
  );
};
