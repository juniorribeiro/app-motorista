import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

interface Trip {
  id: string;
  date: string;
  distance: number;
  startTime: string;
  endTime: string;
  earnings: number;
  netEarnings: number;
  fuelConsumption: number;
  fuelPrice: number;
}

const Reports = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportType, setReportType] = useState("daily");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar viagens do localStorage
    const savedTrips = localStorage.getItem("trips");
    if (savedTrips) {
      setTrips(JSON.parse(savedTrips));
    }
  }, []);

  const filterTrips = () => {
    if (!startDate || !endDate) return trips;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return trips.filter((trip) => {
      const [day, month, year] = trip.date.split("/");
      const tripDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return tripDate >= start && tripDate <= end;
    });
  };

  const generateReport = () => {
    const filteredTrips = filterTrips();
    
    if (filteredTrips.length === 0) {
      toast({
        title: "Atenção",
        description: "Nenhum dado encontrado para o período selecionado.",
        variant: "destructive",
      });
      return;
    }

    // Preparar dados para o Excel
    const data = filteredTrips.map(trip => ({
      Data: trip.date,
      Distância: `${trip.distance} km`,
      "Horário Inicial": trip.startTime,
      "Horário Final": trip.endTime,
      "Ganho Bruto": `R$ ${trip.earnings.toFixed(2)}`,
      "Ganho Líquido": `R$ ${trip.netEarnings.toFixed(2)}`,
      "Consumo Combustível": `${trip.fuelConsumption} km/l`,
      "Preço Combustível": `R$ ${trip.fuelPrice.toFixed(2)}/l`
    }));

    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 12 }, // Data
      { wch: 10 }, // Distância
      { wch: 15 }, // Horário Inicial
      { wch: 15 }, // Horário Final
      { wch: 12 }, // Ganho Bruto
      { wch: 12 }, // Ganho Líquido
      { wch: 18 }, // Consumo Combustível
      { wch: 15 }, // Preço Combustível
    ];
    ws['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");

    // Gerar nome do arquivo com data
    const fileName = `relatorio_${format(new Date(), "dd-MM-yyyy")}.xlsx`;

    // Salvar arquivo
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Gere relatórios detalhados das suas viagens
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Inicial</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Data Final</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Relatório</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <Button 
            onClick={generateReport}
            className="w-full"
            disabled={!startDate || !endDate}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Resumo do Período</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total de Viagens</p>
            <p className="text-2xl font-bold">{filterTrips().length}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Ganho Total</p>
            <p className="text-2xl font-bold">
              R$ {filterTrips().reduce((acc, trip) => acc + trip.earnings, 0).toFixed(2)}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Ganho Líquido</p>
            <p className="text-2xl font-bold">
              R$ {filterTrips().reduce((acc, trip) => acc + trip.netEarnings, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Reports; 