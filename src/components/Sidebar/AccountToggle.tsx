import React from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

export const AccountToggle = () => {
  return (
    <div className="border-b mb-4 mt-2 pb-4 border-divider">
      <button className="flex p-0.5 hover:bg-content2 rounded transition-colors relative gap-2 w-full items-center">
        <img
          src="https://api.dicebear.com/9.x/notionists/svg"
          alt="avatar"
          className="size-8 rounded shrink-0 bg-primary shadow-small"
        />
        <div className="text-start">
          <span className="text-sm font-bold block text-foreground">
            Tom Is Loading
          </span>
          <span className="text-xs block text-default-500">tom@hover.dev</span>
        </div>

        <FiChevronDown className="absolute right-2 top-1/2 translate-y-[calc(-50%+4px)] text-xs text-default-400" />
        <FiChevronUp className="absolute right-2 top-1/2 translate-y-[calc(-50%-4px)] text-xs text-default-400" />
      </button>
    </div>
  );
};
