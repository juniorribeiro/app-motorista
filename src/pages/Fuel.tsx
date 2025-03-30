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
import { useToast } from "@/hooks/use-toast";
import { Fuel } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type FuelType = "etanol" | "gasolina" | "outros";

interface FuelRecord {
  id: string;
  pricePerLiter: number;
  liters: number;
  fuelType: FuelType;
  totalAmount: number;
  date: string;
}

const FuelPage = () => {
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [liters, setLiters] = useState("");
  const [fuelType, setFuelType] = useState<FuelType>("etanol");
  const [totalAmount, setTotalAmount] = useState("");
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar registros do localStorage
    const savedRecords = localStorage.getItem("fuelRecords");
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
  }, []);

  // Calcular valor total automaticamente quando preço ou quantidade mudar
  useEffect(() => {
    if (pricePerLiter && liters) {
      const total = parseFloat(pricePerLiter) * parseFloat(liters);
      setTotalAmount(total.toFixed(2));
    } else {
      setTotalAmount("");
    }
  }, [pricePerLiter, liters]);

  const handleEdit = (record: FuelRecord) => {
    setEditingRecord(record);
    setPricePerLiter(record.pricePerLiter.toString());
    setLiters(record.liters.toString());
    setFuelType(record.fuelType);
    setTotalAmount(record.totalAmount.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRecord: FuelRecord = {
      id: editingRecord?.id || Date.now().toString(),
      pricePerLiter: parseFloat(pricePerLiter),
      liters: parseFloat(liters),
      fuelType,
      totalAmount: parseFloat(totalAmount),
      date: editingRecord?.date || new Date().toLocaleDateString("pt-BR"),
    };

    let updatedRecords;
    if (editingRecord) {
      updatedRecords = records.map(record => 
        record.id === editingRecord.id ? newRecord : record
      );
    } else {
      updatedRecords = [...records, newRecord];
    }

    setRecords(updatedRecords);
    localStorage.setItem("fuelRecords", JSON.stringify(updatedRecords));

    // Limpar formulário
    setPricePerLiter("");
    setLiters("");
    setFuelType("etanol");
    setTotalAmount("");
    setEditingRecord(null);

    toast({
      title: "Sucesso",
      description: editingRecord 
        ? "Abastecimento atualizado com sucesso!"
        : "Abastecimento registrado com sucesso!",
    });
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setPricePerLiter("");
    setLiters("");
    setFuelType("etanol");
    setTotalAmount("");
  };

  const handleDelete = (id: string) => {
    const updatedRecords = records.filter((record) => record.id !== id);
    setRecords(updatedRecords);
    localStorage.setItem("fuelRecords", JSON.stringify(updatedRecords));

    toast({
      title: "Sucesso",
      description: "Registro excluído com sucesso!",
    });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registro de Abastecimentos</h1>
          <p className="text-muted-foreground">
            Registre seus abastecimentos para acompanhar os gastos com combustível
          </p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor por Litro (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={pricePerLiter}
                onChange={(e) => setPricePerLiter(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade (L)</label>
              <Input
                type="number"
                step="0.01"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Combustível</label>
              <Select value={fuelType} onValueChange={(value: FuelType) => setFuelType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="etanol">Etanol</SelectItem>
                  <SelectItem value="gasolina">Gasolina</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Total (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={totalAmount}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {editingRecord ? "Atualizar Abastecimento" : "Registrar Abastecimento"}
            </Button>
            {editingRecord && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancelEdit}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Histórico de Abastecimentos</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Data</th>
                <th className="text-left py-2">Tipo</th>
                <th className="text-right py-2">Valor/L</th>
                <th className="text-right py-2">Litros</th>
                <th className="text-right py-2">Total</th>
                <th className="text-right py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b">
                  <td className="py-2">{formatDate(record.date)}</td>
                  <td className="py-2 capitalize">{record.fuelType}</td>
                  <td className="py-2 text-right">R$ {record.pricePerLiter.toFixed(2)}</td>
                  <td className="py-2 text-right">{record.liters.toFixed(2)} L</td>
                  <td className="py-2 text-right">R$ {record.totalAmount.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(record)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default FuelPage; 