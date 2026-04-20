import React, { useEffect, useState } from "react";
import StatCard from "./StatCard";
import EarningsChart from "./EarningsChart";
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Receipt,
  PiggyBank
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tripService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

type Trip = {
  id: string;
  date: string; // Formato DD/MM/YYYY
  distance: number;
  fuelConsumption: number;
  fuelPrice: number;
  startTime: string;
  endTime: string;
  earnings: number;
};

type Cost = {
  id: string;
  date: string; // Formato YYYY-MM-DD
  amount: number;
  category: string;
};

const Dashboard = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTrips();
    loadCosts();
  }, []);

  const loadCosts = () => {
    const savedCosts = localStorage.getItem("costsRecords");
    if (savedCosts) {
      setCosts(JSON.parse(savedCosts));
    }
  };

  const loadTrips = async () => {
    try {
      setIsLoading(true);
      const data = await tripService.getTrips();
      const formattedTrips = data.map((trip: any) => ({
        ...trip,
        distance: Number(trip.distance),
        fuelConsumption: Number(trip.fuelConsumption),
        fuelPrice: Number(trip.fuelPrice),
        earnings: Number(trip.earnings),
      }));
      setTrips(formattedTrips);
    } catch (error) {
      console.error("Erro ao carregar viagens:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseTripDate = (dateString: string) => {
    const [day, month, year] = dateString.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  const parseCostDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const getTripDurationInHours = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    const durationInMinutes = Math.max(endInMinutes - startInMinutes, 0);
    return durationInMinutes / 60;
  };

  const getWeekRange = (referenceDate: Date, weekOffset: number) => {
    const start = new Date(referenceDate);
    start.setDate(referenceDate.getDate() - referenceDate.getDay() + weekOffset * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const getWeekStats = (weekOffset: number) => {
    const today = new Date();
    const { start, end } = getWeekRange(today, weekOffset);

    const weekTrips = trips.filter((trip) => {
      const tripDate = parseTripDate(trip.date);
      return tripDate >= start && tripDate <= end;
    });

    const weekCosts = costs.filter((cost) => {
      const costDate = parseCostDate(cost.date);
      return costDate >= start && costDate <= end;
    });

    const earnings = weekTrips.reduce((sum, trip) => sum + trip.earnings, 0);
    const distance = weekTrips.reduce((sum, trip) => sum + trip.distance, 0);
    const costsAmount = weekCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const netEarnings = earnings - costsAmount;
    const hoursValue = weekTrips.reduce(
      (sum, trip) => sum + getTripDurationInHours(trip.startTime, trip.endTime),
      0
    );

    return {
      earnings,
      netEarnings,
      costs: costsAmount,
      distance,
      hoursValue,
    };
  };

  const formatHours = (totalHours: number) => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }
    return (Math.abs(current - previous) / Math.abs(previous)) * 100;
  };

  // Preparar dados do gráfico
  const getChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    return last7Days.map(date => {
      const dayTrips = trips.filter(trip => {
        const [day, month, year] = trip.date.split("/").map(Number);
        const tripDate = new Date(year, month - 1, day);
        return tripDate.toDateString() === date.toDateString();
      });

      const dayCosts = costs.filter(cost => {
        const [year, month, day] = cost.date.split("-").map(Number);
        const costDate = new Date(year, month - 1, day);
        return costDate.toDateString() === date.toDateString();
      });

      const earnings = dayTrips.reduce((sum, trip) => sum + trip.earnings, 0);
      const expenses = dayCosts.reduce((sum, cost) => sum + cost.amount, 0);

      return {
        date: `${date.getDate()}/${date.getMonth() + 1}`,
        earnings,
        expenses,
      };
    });
  };

  const currentWeekStats = getWeekStats(0);
  const previousWeekStats = getWeekStats(-1);
  const chartData = getChartData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Acompanhe seu desempenho e ganhos
        </p>
      </div>

      {/* Grid responsivo com 5 cards: Faturamento, Lucro Líquido, Custos, Km, Horas */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Faturamento Bruto (Semana)"
          value={`R$ ${currentWeekStats.earnings.toFixed(2)}`}
          icon={DollarSign}
          trend={{
            value: getPercentageChange(currentWeekStats.earnings, previousWeekStats.earnings),
            isPositive: currentWeekStats.earnings >= previousWeekStats.earnings,
          }}
        />
        <StatCard
          title="Lucro Líquido (Semana)"
          value={`R$ ${currentWeekStats.netEarnings.toFixed(2)}`}
          icon={PiggyBank}
          trend={{
            value: getPercentageChange(currentWeekStats.netEarnings, previousWeekStats.netEarnings),
            isPositive: currentWeekStats.netEarnings >= previousWeekStats.netEarnings,
          }}
        />
        <StatCard
          title="Custos (Semana)"
          value={`R$ ${currentWeekStats.costs.toFixed(2)}`}
          icon={Receipt}
          trend={{
            value: getPercentageChange(currentWeekStats.costs, previousWeekStats.costs),
            isPositive: currentWeekStats.costs <= previousWeekStats.costs,
          }}
        />
        <StatCard
          title="Km Rodados (Semana)"
          value={`${currentWeekStats.distance.toFixed(1)} km`}
          icon={TrendingUp}
          trend={{
            value: getPercentageChange(currentWeekStats.distance, previousWeekStats.distance),
            isPositive: currentWeekStats.distance >= previousWeekStats.distance,
          }}
        />
        <StatCard
          title="Horas Trabalhadas"
          value={formatHours(currentWeekStats.hoursValue)}
          icon={Clock}
          trend={{
            value: getPercentageChange(currentWeekStats.hoursValue, previousWeekStats.hoursValue),
            isPositive: currentWeekStats.hoursValue >= previousWeekStats.hoursValue,
          }}
        />
      </div>

      <div className="grid gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Ganhos e Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <EarningsChart data={chartData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
