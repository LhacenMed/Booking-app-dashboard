import React from "react";
import { FiCalendar } from "react-icons/fi";

export const TopBar = () => {
  return (
    <div className="border-b px-4 mb-4 mt-2 pb-4 border-divider">
      <div className="flex items-center justify-between p-0.5">
        <div>
          <span className="text-sm font-bold block text-foreground">
            🚀 Good morning, Tom!
          </span>
          <span className="text-xs block text-default-500">
            Tuesday, Aug 8th 2023
          </span>
        </div>

        <button className="flex text-sm items-center gap-2 bg-default-100 transition-colors hover:bg-primary-100 hover:text-primary px-3 py-1.5 rounded">
          <FiCalendar />
          <span>Prev 6 Months</span>
        </button>
      </div>
    </div>
  );
};
