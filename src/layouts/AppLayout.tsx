import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar/Sidebar";

export const AppLayout = () => {
  return (
    <div className="flex">
      <div className="w-64 shrink-0 border-r border-divider">
        <Sidebar />
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};
