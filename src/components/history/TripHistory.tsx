import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  FilterX,
  Filter,
} from "lucide-react";
import { tripService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const tripSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  distance: z.string().min(1, "Distância é obrigatória"),
  fuelConsumption: z.string().min(1, "Consumo é obrigatório"),
  fuelPrice: z.string().min(1, "Preço do combustível é obrigatório"),
  startTime: z.string().min(1, "Horário inicial é obrigatório"),
  endTime: z.string().min(1, "Horário final é obrigatório"),
  earnings: z.string().min(1, "Ganhos são obrigatórios"),
});

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

const TripHistory = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof tripSchema>>({
    resolver: zodResolver(tripSchema),
  });

  const itemsPerPage = 10;

  useEffect(() => {
    loadTrips();
  }, []);

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
        description: "Não foi possível carregar o histórico de viagens.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    form.reset({
      date: trip.date,
      distance: trip.distance.toString(),
      fuelConsumption: trip.fuelConsumption.toString(),
      fuelPrice: trip.fuelPrice.toString(),
      startTime: trip.startTime,
      endTime: trip.endTime,
      earnings: trip.earnings.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (values: z.infer<typeof tripSchema>) => {
    if (!editingTrip) return;

    try {
      const [day, month, year] = values.date.split('/');
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      const updatedTrip = {
        ...editingTrip,
        date: formattedDate,
        distance: parseFloat(values.distance),
        fuelConsumption: parseFloat(values.fuelConsumption),
        fuelPrice: parseFloat(values.fuelPrice),
        startTime: values.startTime,
        endTime: values.endTime,
        earnings: parseFloat(values.earnings),
      };

      await tripService.updateTrip(editingTrip.id, updatedTrip);
      toast({
        title: "Sucesso",
        description: "Viagem atualizada com sucesso.",
      });
      setIsEditDialogOpen(false);
      loadTrips();
    } catch (error) {
      console.error("Erro ao atualizar viagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a viagem.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tripService.deleteTrip(id);
      toast({
        title: "Sucesso",
        description: "Viagem excluída com sucesso.",
      });
      loadTrips();
    } catch (error) {
      console.error("Erro ao excluir viagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a viagem.",
        variant: "destructive",
      });
    }
  };

  const filteredTrips = trips.filter((trip) =>
    trip.date.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedTrips = [...filteredTrips].sort((a, b) => {
    if (sortField === "date") {
      const dateA = new Date(
        parseInt(a.date.split("/")[2]),
        parseInt(a.date.split("/")[1]) - 1,
        parseInt(a.date.split("/")[0])
      );
      const dateB = new Date(
        parseInt(b.date.split("/")[2]),
        parseInt(b.date.split("/")[1]) - 1,
        parseInt(b.date.split("/")[0])
      );
      return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    }
    
    const fieldA = a[sortField as keyof Trip];
    const fieldB = b[sortField as keyof Trip];
    
    if (typeof fieldA === "number" && typeof fieldB === "number") {
      return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
    }
    
    return 0;
  });

  const paginatedTrips = sortedTrips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedTrips.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const calculateNetEarnings = (trip: Trip) => {
    const litersUsed = trip.distance / trip.fuelConsumption;
    const fuelCost = litersUsed * trip.fuelPrice;
    return trip.earnings - fuelCost;
  };

  const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayOfWeek = format(date, "EEEE", { locale: ptBR });
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    return (
      <span className={isWeekend ? "text-red-500" : ""}>
        {dateStr} - {dayOfWeek}
      </span>
    );
  };

  const calculateTotalHours = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por data..."
            className="pl-8 w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            {filterOpen ? <FilterX className="h-4 w-4 mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
            {filterOpen ? "Limpar Filtros" : "Filtrar"}
          </Button>
          
          <Select
            value={sortField}
            onValueChange={(value) => handleSort(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="distance">Distância</SelectItem>
              <SelectItem value="earnings">Ganhos</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>
      
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Data</TableHead>
                <TableHead className="hidden md:table-cell">Distância</TableHead>
                <TableHead className="hidden lg:table-cell">Horário</TableHead>
                <TableHead>Valor/Hora</TableHead>
                <TableHead>Valor/km</TableHead>
                <TableHead>Ganho Bruto</TableHead>
                <TableHead>Ganho Líq.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrips.length > 0 ? (
                paginatedTrips.map((trip) => {
                  const totalHours = calculateTotalHours(trip.startTime, trip.endTime);
                  const [hours] = totalHours.split('h').map(Number);
                  const hourlyRate = hours > 0 ? trip.earnings / hours : 0;
                  const kmRate = trip.distance > 0 ? trip.earnings / trip.distance : 0;

                  return (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">{formatDate(trip.date)}</TableCell>
                      <TableCell className="hidden md:table-cell">{trip.distance} km</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div>{trip.startTime} - {trip.endTime}</div>
                        <div className="text-sm text-muted-foreground">
                          Total: {totalHours}
                        </div>
                      </TableCell>
                      <TableCell>R$ {hourlyRate.toFixed(2)}</TableCell>
                      <TableCell>R$ {kmRate.toFixed(2)}</TableCell>
                      <TableCell>R$ {trip.earnings.toFixed(2)}</TableCell>
                      <TableCell>R$ {calculateNetEarnings(trip).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(trip)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(trip.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Nenhuma viagem encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Viagem</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" placeholder="DD/MM/YYYY" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="distance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distância (km)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fuelConsumption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumo (km/l)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fuelPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço do Combustível (R$)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Inicial</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Final</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="earnings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ganhos (R$)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripHistory;
