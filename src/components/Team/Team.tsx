import React from "react";

export const Team = () => {
  return (
    <div className="bg-background rounded-lg pb-4">
      <div className="border-b px-4 mb-4 mt-2 pb-4 border-divider">
        <div className="flex items-center justify-between p-0.5">
          <div>
            <span className="text-sm font-bold block">Team Management</span>
            <span className="text-xs block text-default-500">
              Manage your team members and roles
            </span>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="bg-default-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Team Members</h2>
          <p className="text-default-500">No team members added yet.</p>
        </div>
      </div>
    </div>
  );
};
