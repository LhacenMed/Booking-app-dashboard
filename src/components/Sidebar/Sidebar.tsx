// import React from "react";
// import { AccountToggle } from "./AccountToggle";
import { Plan } from "./Plan";
import { SidebarHeader } from "./SidebarHeader";
import SidebarBody from "./SidebarBody";

export const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-content1 border-r border-divider">
      <SidebarHeader />
      <div className="overflow-y-auto sticky top-4 h-[calc(100vh-130px)] bg-background [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-default-300">
        <SidebarBody />
      </div>
      <Plan />
    </aside>
  );
};
