
import React, { useState } from "react";
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
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  FilterX,
  Filter,
} from "lucide-react";

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

const mockTrips: Trip[] = Array.from({ length: 20 }, (_, i) => {
  const day = i + 1;
  const month = 5; // May
  const date = `${day > 9 ? day : "0" + day}/05/2023`;
  const distance = Math.floor(Math.random() * 150) + 50;
  const fuelConsumption = +(Math.random() * 5 + 8).toFixed(1);
  const fuelPrice = +(Math.random() * 1 + 4.5).toFixed(2);
  const startHour = Math.floor(Math.random() * 6) + 7;
  const startTime = `${startHour < 10 ? "0" + startHour : startHour}:00`;
  const endHour = startHour + Math.floor(Math.random() * 8) + 2;
  const endTime = `${endHour < 10 ? "0" + endHour : endHour}:00`;
  const earnings = +(Math.random() * 100 + 100).toFixed(2);

  return {
    id: `trip-${i + 1}`,
    date,
    distance,
    fuelConsumption,
    fuelPrice,
    startTime,
    endTime,
    earnings,
  };
});

const TripHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterOpen, setFilterOpen] = useState(false);

  const itemsPerPage = 10;

  const filteredTrips = mockTrips.filter((trip) =>
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
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead className="hidden md:table-cell">Distância</TableHead>
                <TableHead className="hidden lg:table-cell">Horário</TableHead>
                <TableHead className="hidden md:table-cell">Combustível</TableHead>
                <TableHead>Ganho Bruto</TableHead>
                <TableHead>Ganho Líq.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrips.length > 0 ? (
                paginatedTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">{trip.date}</TableCell>
                    <TableCell className="hidden md:table-cell">{trip.distance} km</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {trip.startTime} - {trip.endTime}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {trip.fuelConsumption} km/l - R$ {trip.fuelPrice}/l
                    </TableCell>
                    <TableCell>R$ {trip.earnings.toFixed(2)}</TableCell>
                    <TableCell>R$ {calculateNetEarnings(trip).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
          {Math.min(currentPage * itemsPerPage, sortedTrips.length)} de{" "}
          {sortedTrips.length} registros
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Página anterior</span>
          </Button>
          <div className="text-sm mx-2">
            Página {currentPage} de {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Próxima página</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TripHistory;
