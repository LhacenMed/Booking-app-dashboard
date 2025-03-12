import React from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Invoices } from "@/components/Invoices/Invoices";

export default function InvoicesPage() {
  return (
    <MainLayout>
      <Invoices />
    </MainLayout>
  );
}
