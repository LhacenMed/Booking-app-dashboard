import React from "react";
import { DashboardTopBar } from "@/components/Dashboard/DashboardTopBar";

export const Finance = () => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <DashboardTopBar searchPlaceholder="Search transactions..." />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="bg-content1 rounded-lg shadow">
            <div className="p-6 border-b border-divider">
              <h1 className="text-2xl font-semibold text-foreground">
                Finance
              </h1>
              <p className="text-default-500 text-sm mt-1">
                Manage your financial data and reports
              </p>
            </div>

            <div className="p-6">
              <div className="bg-default-100 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">
                  Financial Overview
                </h2>
                <p className="text-default-500">No financial data available.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
