import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, BarChart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { tripService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { DateRange } from "react-day-picker";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type Trip = {
  id: string;
  date: string;
  distance: number;
  fuelConsumption: number;
  fuelPrice: number;
  startTime: string;
  endTime: string;
  earnings: number;
};

const Analytics = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [periodType, setPeriodType] = useState<"day" | "week" | "month">("week");
  const { toast } = useToast();

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const response = await tripService.getTrips();
      if (response?.data) {
        setTrips(response.data);
      } else {
        setTrips([]);
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar viagens",
        description: "Não foi possível carregar os dados das viagens.",
        variant: "destructive",
      });
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    if (!dateRange?.from || !dateRange?.to) return true;
    const tripDate = new Date(trip.date);
    return tripDate >= dateRange.from && tripDate <= dateRange.to;
  });

  // Cálculos de métricas
  const totalEarnings = filteredTrips.reduce((sum, trip) => sum + trip.earnings, 0);
  const totalDistance = filteredTrips.reduce((sum, trip) => sum + trip.distance, 0);
  const totalFuelCost = filteredTrips.reduce((sum, trip) => sum + (trip.fuelConsumption * trip.fuelPrice), 0);
  
  const earningsPerKm = totalDistance ? (totalEarnings / totalDistance).toFixed(2) : "0";
  const fuelCostPerKm = totalDistance ? (totalFuelCost / totalDistance).toFixed(2) : "0";
  const averageFuelEfficiency = totalDistance ? ((totalDistance / filteredTrips.reduce((sum, trip) => sum + trip.fuelConsumption, 0)) || 0).toFixed(2) : "0";

  // Dados para o gráfico
  const chartData = {
    labels: filteredTrips.map(trip => format(new Date(trip.date), "dd/MM")),
    datasets: [
      {
        label: "Ganhos (R$)",
        data: filteredTrips.map(trip => trip.earnings),
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1
      },
      {
        label: "Custo Combustível (R$)",
        data: filteredTrips.map(trip => trip.fuelConsumption * trip.fuelPrice),
        borderColor: "rgb(255, 99, 132)",
        tension: 0.1
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Análises</h1>
          <p className="text-muted-foreground">
            Acompanhe suas métricas e desempenho ao longo do tempo
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={setDateRange}
          locale={ptBR}
          className="rounded-md border"
        />
        
        <Select value={periodType} onValueChange={(value: "day" | "week" | "month") => setPeriodType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Por dia</SelectItem>
            <SelectItem value="week">Por semana</SelectItem>
            <SelectItem value="month">Por mês</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={loadTrips} variant="outline">
          Atualizar dados
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Ganhos por KM</h3>
          <p className="text-2xl">R$ {earningsPerKm}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Custo de Combustível por KM</h3>
          <p className="text-2xl">R$ {fuelCostPerKm}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Eficiência Média (KM/L)</h3>
          <p className="text-2xl">{averageFuelEfficiency} km/l</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Ganhos vs. Custos</h3>
        <div className="h-[400px]">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top" as const,
                },
                title: {
                  display: false,
                }
              }
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default Analytics; 