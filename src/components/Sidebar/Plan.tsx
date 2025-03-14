import React from "react";

export const Plan = () => {
  return (
    <div className="flex sticky top-[calc(100vh_-_48px_-_16px)] flex-col h-12 border-t border-divider justify-end text-xs px-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-foreground">Enterprise</p>
          <p className="text-default-500">Pay as you go</p>
        </div>

        <button className="px-2 py-1.5 font-medium bg-content2 hover:bg-content3 transition-colors rounded">
          Support
        </button>
      </div>
    </div>
  );
};
