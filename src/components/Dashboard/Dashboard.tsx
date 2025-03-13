import React from "react";
import { TopBar } from "./TopBar";
import { Grid } from "./Grid";

export const Dashboard = () => {
  return (
    <div className="bg-background rounded-lg pb-4">
      <TopBar />
      <Grid />
    </div>
  );
};
