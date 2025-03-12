"use client";

import React, { useState } from "react";
import { FiCommand, FiSearch } from "react-icons/fi";
import { CommandMenu } from "./CommandMenu";

export const Search = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="bg-content2 mb-4 relative rounded flex items-center px-2 py-1.5 text-sm">
        <FiSearch className="mr-2 text-default-400" />
        <input
          onFocus={(e) => {
            e.target.blur();
            setOpen(true);
          }}
          type="text"
          placeholder="Search"
          className="w-full bg-transparent placeholder:text-default-400 text-foreground focus:outline-none"
        />

        <span className="p-1 text-xs flex gap-0.5 items-center bg-content1 text-default-500 shadow-small rounded absolute right-1.5 top-1/2 -translate-y-1/2">
          <FiCommand />K
        </span>
      </div>

      <CommandMenu open={open} setOpen={setOpen} />
    </>
  );
};
