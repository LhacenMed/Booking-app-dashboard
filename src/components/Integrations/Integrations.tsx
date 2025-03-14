import React from "react";
import { DashboardTopBar } from "@/components/Dashboard/DashboardTopBar";

export const Integrations = () => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <DashboardTopBar searchPlaceholder="Search integrations..." />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="bg-content1 rounded-lg shadow">
            <div className="p-6 border-b border-divider">
              <h1 className="text-2xl font-semibold text-foreground">
                Integrations
              </h1>
              <p className="text-default-500 text-sm mt-1">
                Connect your favorite tools and services
              </p>
            </div>

            <div className="p-6">
              <div className="bg-default-100 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">
                  Available Integrations
                </h2>
                <p className="text-default-500">
                  No integrations configured yet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
