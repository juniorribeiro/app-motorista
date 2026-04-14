import React, { useEffect, useState } from "react";
import StatCard from "./StatCard";
import RecentTrips from "./RecentTrips";
import EarningsChart from "./EarningsChart";
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Receipt,
  PiggyBank
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

  // Calcular estatísticas da semana atual
  const getCurrentWeekStats = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekTrips = trips.filter(trip => {
      const [day, month, year] = trip.date.split("/").map(Number);
      const tripDate = new Date(year, month - 1, day);
      return tripDate >= startOfWeek && tripDate <= today;
    });

    const weekCosts = costs.filter(cost => {
      const [year, month, day] = cost.date.split("-").map(Number);
      const costDate = new Date(year, month - 1, day);
      return costDate >= startOfWeek && costDate <= today;
    });

    const totalEarnings = weekTrips.reduce((sum, trip) => sum + trip.earnings, 0);
    const totalDistance = weekTrips.reduce((sum, trip) => sum + trip.distance, 0);
    const totalCostsAmount = weekCosts.reduce((sum, cost) => sum + cost.amount, 0);

    // Lucro Líquido = Faturamento Total - Custos Totais da tela de Custos
    const netEarnings = totalEarnings - totalCostsAmount;

    // Calcular horas trabalhadas
    const totalHours = weekTrips.reduce((sum, trip) => {
      const [startHour, startMinute] = trip.startTime.split(":").map(Number);
      const [endHour, endMinute] = trip.endTime.split(":").map(Number);
      const duration = (endHour - startHour) + (endMinute - startMinute) / 60;
      return sum + duration;
    }, 0);

    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    return {
      earnings: totalEarnings,
      netEarnings,
      distance: totalDistance,
      hours: `${hours}h ${minutes}m`,
      costs: totalCostsAmount,
    };
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

  // Preparar viagens recentes
  const getRecentTrips = () => {
    return trips
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split("/").map(Number);
        const [dayB, monthB, yearB] = b.date.split("/").map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 4)
      .map(trip => ({
        id: trip.id,
        date: trip.date,
        distance: trip.distance,
        earnings: trip.earnings,
        hours: `${trip.startTime} - ${trip.endTime}`,
        // Esse campo mantido apenas para compatibilidade visual na listagem de viagens se existir lá
        fuelCost: (trip.distance / trip.fuelConsumption) * trip.fuelPrice,
      }));
  };

  const stats = getCurrentWeekStats();
  const chartData = getChartData();
  const recentTrips = getRecentTrips();

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
          value={`R$ ${stats.earnings.toFixed(2)}`}
          icon={DollarSign}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title="Lucro Líquido (Semana)"
          value={`R$ ${stats.netEarnings.toFixed(2)}`}
          icon={PiggyBank}
          trend={{ value: 5.1, isPositive: true }}
        />
        <StatCard
          title="Custos (Semana)"
          value={`R$ ${stats.costs.toFixed(2)}`}
          icon={Receipt}
          trend={{ value: 2.1, isPositive: false }}
        />
        <StatCard
          title="Km Rodados (Semana)"
          value={`${stats.distance.toFixed(1)} km`}
          icon={TrendingUp}
          trend={{ value: 4.3, isPositive: true }}
        />
        <StatCard
          title="Horas Trabalhadas"
          value={stats.hours}
          icon={Clock}
          trend={{ value: 2.1, isPositive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Ganhos e Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <EarningsChart data={chartData} />
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Viagens Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTrips trips={recentTrips} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
