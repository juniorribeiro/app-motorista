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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Calendar as CalendarIcon } from "lucide-react";
import { format, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export type CostCategory =
  | "Combustível"
  | "Alimentação"
  | "Manutenção"
  | "Lavagem"
  | "Pedágio"
  | "Estacionamento"
  | "Internet"
  | "Multa"
  | "Aluguel do Carro/Seguro"
  | "Outros";

export type PaymentMethod = "Dinheiro" | "Cartão de Crédito" | "Cartão de Débito" | "Pix";

export interface CostRecord {
  id: string;
  date: string; // ISO string format YYYY-MM-DD
  amount: number;
  category: CostCategory;
  paymentMethod: PaymentMethod;
  description: string;
}

type ViewPeriod = "day" | "week" | "month";

const CostsPage = () => {
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CostCategory>("Combustível");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Dinheiro");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceCount, setRecurrenceCount] = useState("1");
  const [records, setRecords] = useState<CostRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<CostRecord | null>(null);
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>("day");
  const { toast } = useToast();

  useEffect(() => {
    // Carregar registros do localStorage
    const savedRecords = localStorage.getItem("costsRecords");
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
  }, []);

  const saveRecords = (updatedRecords: CostRecord[]) => {
    setRecords(updatedRecords);
    localStorage.setItem("costsRecords", JSON.stringify(updatedRecords));
  };

  const handleEdit = (record: CostRecord) => {
    setEditingRecord(record);
    setDate(record.date);
    setAmount(record.amount.toString());
    setCategory(record.category);
    setPaymentMethod(record.paymentMethod);
    setDescription(record.description || "");
    setIsRecurring(false); // Ocultar recorrência ao editar
    setRecurrenceCount("1");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({ title: "Erro", description: "Insira um valor válido", variant: "destructive" });
      return;
    }

    const baseDate = parseISO(date);
    const numAmount = parseFloat(amount);
    let updatedRecords = [...records];
    const newRecords: CostRecord[] = [];

    if (editingRecord) {
      const updatedRecord: CostRecord = {
        ...editingRecord,
        date,
        amount: numAmount,
        category,
        paymentMethod,
        description,
      };
      updatedRecords = records.map((record) =>
        record.id === editingRecord.id ? updatedRecord : record
      );
    } else {
      const times = isRecurring ? parseInt(recurrenceCount, 10) : 1;
      const validTimes = isNaN(times) || times < 1 ? 1 : times;

      for (let i = 0; i < validTimes; i++) {
        const costDate = addMonths(baseDate, i);
        newRecords.push({
          id: Date.now().toString() + "-" + i,
          date: format(costDate, "yyyy-MM-dd"),
          amount: numAmount,
          category,
          paymentMethod,
          description: validTimes > 1 ? `${description} (${i + 1}/${validTimes})` : description,
        });
      }
      updatedRecords = [...records, ...newRecords];
    }

    saveRecords(updatedRecords);
    resetForm();

    toast({
      title: "Sucesso",
      description: editingRecord
        ? "Custo atualizado com sucesso!"
        : "Custo(s) registrado(s) com sucesso!",
    });
  };

  const resetForm = () => {
    setDate(format(new Date(), "yyyy-MM-dd"));
    setAmount("");
    setCategory("Combustível");
    setPaymentMethod("Dinheiro");
    setDescription("");
    setIsRecurring(false);
    setRecurrenceCount("1");
    setEditingRecord(null);
  };

  const handleDelete = (id: string) => {
    const updatedRecords = records.filter((record) => record.id !== id);
    saveRecords(updatedRecords);

    toast({
      title: "Sucesso",
      description: "Registro excluído com sucesso!",
    });
  };

  const filteredRecords = records.filter((record) => {
    const recordDate = parseISO(record.date);
    const today = new Date();

    if (viewPeriod === "day") {
      const start = startOfDay(today);
      const end = endOfDay(today);
      return isWithinInterval(recordDate, { start, end });
    }
    
    if (viewPeriod === "week") {
      const start = startOfWeek(today, { weekStartsOn: 1 }); // Segunda-feira
      const end = endOfWeek(today, { weekStartsOn: 1 });
      return isWithinInterval(recordDate, { start, end });
    }

    if (viewPeriod === "month") {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      return isWithinInterval(recordDate, { start, end });
    }

    return true;
  });

  const totalFiltered = filteredRecords.reduce((sum, record) => sum + record.amount, 0);

  const formatDatePTBR = (dateStr: string) => {
    try {
      const parsedDate = parseISO(dateStr);
      return format(parsedDate, "dd/MM/yyyy - EEEE", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registro de Custos</h1>
          <p className="text-muted-foreground">
            Gerencie todas as suas despesas operacionais
          </p>
        </div>
      </div>

      {/* Formulário */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={category} onValueChange={(value: CostCategory) => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Combustível">Combustível</SelectItem>
                  <SelectItem value="Alimentação">Alimentação</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Lavagem">Lavagem</SelectItem>
                  <SelectItem value="Pedágio">Pedágio</SelectItem>
                  <SelectItem value="Estacionamento">Estacionamento</SelectItem>
                  <SelectItem value="Internet">Internet</SelectItem>
                  <SelectItem value="Multa">Multa</SelectItem>
                  <SelectItem value="Aluguel do Carro/Seguro">Aluguel do Carro/Seguro</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Forma de Pagamento</label>
              <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Pix">Pix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">Descrição / Observação</label>
              <Input
                type="text"
                placeholder="Ex: Troca de óleo 10.000km"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Recorrência */}
          {!editingRecord && (
            <div className="flex items-center gap-4 mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                />
                <label htmlFor="recurring" className="text-sm font-medium cursor-pointer">
                  Repetir este custo (Mensalmente)
                </label>
              </div>

              {isRecurring && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">Por</label>
                  <Input
                    type="number"
                    min="2"
                    step="1"
                    className="w-20 form-input h-8"
                    value={recurrenceCount}
                    onChange={(e) => setRecurrenceCount(e.target.value)}
                  />
                  <label className="text-sm text-muted-foreground whitespace-nowrap">meses</label>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {editingRecord ? "Atualizar Custo" : "Registrar Custo"}
            </Button>
            {editingRecord && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Listagem */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-lg font-semibold">Histórico de Custos</h2>
          
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={viewPeriod === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewPeriod("day")}
              className="text-xs"
            >
              Hoje
            </Button>
            <Button
              variant={viewPeriod === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewPeriod("week")}
              className="text-xs"
            >
              Semana
            </Button>
            <Button
              variant={viewPeriod === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewPeriod("month")}
              className="text-xs"
            >
              Mês
            </Button>
          </div>
        </div>

        <div className="mb-4 bg-primary/10 text-primary p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            <span className="font-semibold">
              Total {viewPeriod === "day" ? "Hoje" : viewPeriod === "week" ? "na Semana" : "no Mês"}:
            </span>
          </div>
          <span className="text-xl font-bold">R$ {totalFiltered.toFixed(2)}</span>
        </div>

        <div className="overflow-x-auto">
          {filteredRecords.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left py-3 font-medium">Data</th>
                  <th className="text-left py-3 font-medium">Categoria / Detalhes</th>
                  <th className="text-left py-3 font-medium">Forma Pagto.</th>
                  <th className="text-right py-3 font-medium">Valor</th>
                  <th className="text-right py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => (
                  <tr key={record.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 text-sm capitalize">{formatDatePTBR(record.date)}</td>
                    <td className="py-3">
                      <div className="text-sm font-medium">{record.category}</div>
                      {record.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">{record.description}</div>
                      )}
                    </td>
                    <td className="py-3 text-sm">{record.paymentMethod}</td>
                    <td className="py-3 text-right font-medium">R$ {record.amount.toFixed(2)}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(record)} className="h-8">
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)} className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum custo registrado para este período.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CostsPage;
