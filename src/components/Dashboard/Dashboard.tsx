import { DashboardTopBar } from "./DashboardTopBar";
import { Grid } from "./Grid";
import { FiCalendar } from "react-icons/fi";
import { Button } from "@heroui/react";

export const Dashboard = () => {
  const dateSelector = (
    <Button
      variant="light"
      className="flex items-center gap-2"
      startContent={<FiCalendar />}
    >
      Prev 6 Months
    </Button>
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      <DashboardTopBar rightContent={dateSelector} />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Grid />
        </div>
      </div>
    </div>
  );
};
