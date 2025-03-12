import React from "react";
import { Sidebar } from "../Sidebar/Sidebar";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="grid gap-4 p-4 grid-cols-[220px,_1fr]">
      <Sidebar />
      {children}
    </main>
  );
};
