
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import TripHistory from "@/components/history/TripHistory";

const HistoryPage = () => {
  return (
    <MainLayout>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Histórico</h2>
        <p className="text-muted-foreground mb-6">
          Visualize e gerencie seus registros anteriores
        </p>
        <TripHistory />
      </div>
    </MainLayout>
  );
};

export default HistoryPage;
