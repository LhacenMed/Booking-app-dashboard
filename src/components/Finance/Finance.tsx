import React from "react";

export const Finance = () => {
  return (
    <div className="bg-white rounded-lg pb-4 shadow">
      <div className="border-b px-4 mb-4 mt-2 pb-4 border-stone-200">
        <div className="flex items-center justify-between p-0.5">
          <div>
            <span className="text-sm font-bold block">Finance</span>
            <span className="text-xs block text-stone-500">
              Manage your financial data and reports
            </span>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="bg-default-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Financial Overview</h2>
          <p className="text-default-500">No financial data available.</p>
        </div>
      </div>
    </div>
  );
};
