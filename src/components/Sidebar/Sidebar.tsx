import React from "react";
import { AccountToggle } from "./AccountToggle";
import { Search } from "./Search";
import { RouteSelect } from "./RouteSelect";
import { Plan } from "./Plan";

export const Sidebar = () => {
  return (
    <div>
      <div className="overflow-y-auto sticky top-4 h-[calc(100vh-32px-48px)] bg-background [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-default-300">
        <AccountToggle />
        <Search />
        <RouteSelect />
      </div>

      <Plan />
    </div>
  );
};
