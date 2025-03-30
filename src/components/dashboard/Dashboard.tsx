
import React from "react";
import StatCard from "./StatCard";
import RecentTrips from "./RecentTrips";
import EarningsChart from "./EarningsChart";
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Droplets, 
  Calendar as CalendarIcon 
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const dummyTrips = [
  {
    id: "1",
    date: "22/05/2023",
    distance: 120,
    earnings: 180.0,
    hours: "6h 30m",
    fuelCost: 45.0,
  },
  {
    id: "2",
    date: "21/05/2023",
    distance: 95,
    earnings: 145.0,
    hours: "5h 15m",
    fuelCost: 38.0,
  },
  {
    id: "3",
    date: "20/05/2023",
    distance: 150,
    earnings: 200.0,
    hours: "7h 45m",
    fuelCost: 60.0,
  },
  {
    id: "4",
    date: "19/05/2023",
    distance: 85,
    earnings: 130.0,
    hours: "4h 45m",
    fuelCost: 34.0,
  },
];

const chartData = [
  { date: "16/05", earnings: 120, expenses: 45 },
  { date: "17/05", earnings: 145, expenses: 50 },
  { date: "18/05", earnings: 160, expenses: 55 },
  { date: "19/05", earnings: 130, expenses: 34 },
  { date: "20/05", earnings: 200, expenses: 60 },
  { date: "21/05", earnings: 145, expenses: 38 },
  { date: "22/05", earnings: 180, expenses: 45 },
];

const Dashboard = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Acompanhe seu desempenho e ganhos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ganho Total (Semana)"
          value="R$ 655,00"
          icon={DollarSign}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title="Km Rodados (Semana)"
          value="450 km"
          icon={TrendingUp}
          trend={{ value: 4.3, isPositive: true }}
        />
        <StatCard
          title="Horas Trabalhadas"
          value="24h 15m"
          icon={Clock}
          description="Esta semana"
        />
        <StatCard
          title="Custo Combustível"
          value="R$ 177,00"
          icon={Droplets}
          trend={{ value: 2.1, isPositive: false }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <EarningsChart data={chartData} className="md:col-span-5" />
        <Card className={cn("card-hover md:col-span-2")}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Calendário</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>

      <RecentTrips trips={dummyTrips} />
    </div>
  );
};

export default Dashboard;
