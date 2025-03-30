import React from "react";
import TripHistory from "@/components/history/TripHistory";

const HistoryPage = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Histórico</h2>
      <p className="text-muted-foreground mb-6">
        Visualize e gerencie seus registros anteriores
      </p>
      <TripHistory />
    </div>
  );
};

export default HistoryPage;
