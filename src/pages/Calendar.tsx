import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { tripService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
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

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getTripsForDay = (day: Date) => {
    return trips.filter(trip => isSameDay(new Date(trip.date), day));
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
        <CalendarIcon className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Calendário de Viagens</h1>
          <p className="text-muted-foreground">
            Visualize suas viagens em formato de calendário
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div key={day} className="text-center font-semibold p-2">
              {day}
            </div>
          ))}

          {daysInMonth.map((day, index) => {
            const dayTrips = getTripsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <div
                key={day.toString()}
                className={`min-h-[100px] p-2 border rounded-md ${
                  isCurrentMonth ? "bg-card" : "bg-muted"
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, "d")}
                </div>
                {dayTrips.map(trip => (
                  <div
                    key={trip.id}
                    className="text-xs p-1 mb-1 rounded bg-primary/10 hover:bg-primary/20 cursor-pointer"
                    title={`Ganhos: R$${trip.earnings.toFixed(2)}`}
                  >
                    {trip.startTime} - {trip.endTime}
                    <div className="font-medium">
                      R$ {trip.earnings.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
} 