"use client";

import React, { useState } from "react";
import { FiCommand, FiSearch } from "react-icons/fi";
import { CommandMenu } from "./CommandMenu";
import { useCompanyStatus } from "@/hooks/useCompanyStatus";
import { auth } from "@/config/firebase";

export const Search = () => {
  const [open, setOpen] = useState(false);
  const userId = auth.currentUser?.uid || null;
  const { data: statusData } = useCompanyStatus(userId);
  const isPending = statusData?.status === "pending";

  return (
    <div className="px-3">
      <div
        className={`bg-content2 mb-4 relative rounded flex items-center px-2 py-1.5 text-sm ${
          isPending ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <FiSearch className="mr-2 text-default-400" />
        <input
          onFocus={(e) => {
            if (isPending) {
              e.preventDefault();
              return;
            }
            e.target.blur();
            setOpen(true);
          }}
          type="text"
          placeholder="Search"
          className={`w-full bg-transparent placeholder:text-default-400 text-foreground focus:outline-none ${
            isPending ? "cursor-not-allowed" : ""
          }`}
          disabled={isPending}
        />

        <span className="p-1 text-xs flex gap-0.5 items-center bg-content1 text-default-500 shadow-small rounded absolute right-1.5 top-1/2 -translate-y-1/2">
          <FiCommand />K
        </span>
      </div>

      <CommandMenu open={open} setOpen={setOpen} />
    </div>
  );
};
