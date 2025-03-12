import React from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Trips } from "@/components/Trips/Trips";

export default function TripsPage() {
  return (
    <MainLayout>
      <Trips />
    </MainLayout>
  );
}
