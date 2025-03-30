
import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
  distance: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Distância deve ser um número positivo.",
  }),
  fuelConsumption: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    {
      message: "Consumo de combustível deve ser um número positivo.",
    }
  ),
  fuelPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Preço do combustível deve ser um número positivo.",
  }),
  startTime: z.string().min(1, "Horário inicial é obrigatório."),
  endTime: z.string().min(1, "Horário final é obrigatório."),
  earnings: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Ganhos devem ser um número positivo ou zero.",
  }),
});

type FormData = z.infer<typeof formSchema>;

const RegisterForm = () => {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      distance: "",
      fuelConsumption: "",
      fuelPrice: "",
      startTime: "",
      endTime: "",
      earnings: "",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Form data:", data);

    // Calcular valores
    const distance = parseFloat(data.distance);
    const fuelConsumption = parseFloat(data.fuelConsumption);
    const fuelPrice = parseFloat(data.fuelPrice);
    const earnings = parseFloat(data.earnings);

    // Calcular litros usados e custo combustível
    const litersUsed = distance / fuelConsumption;
    const fuelCost = litersUsed * fuelPrice;

    // Calcular tempo trabalhado
    const startTime = data.startTime.split(":");
    const endTime = data.endTime.split(":");
    const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
    const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
    const workedMinutes = endMinutes >= startMinutes 
      ? endMinutes - startMinutes 
      : (24 * 60) - startMinutes + endMinutes;
    
    const workedHours = Math.floor(workedMinutes / 60);
    const remainingMinutes = workedMinutes % 60;
    const timeWorked = `${workedHours}h ${remainingMinutes}m`;

    // Calcular ganho líquido
    const netEarnings = earnings - fuelCost;

    // Calcular ganho por km e por hora
    const earningsPerKm = netEarnings / distance;
    const earningsPerHour = netEarnings / (workedMinutes / 60);

    toast({
      title: "Registro salvo com sucesso!",
      description: (
        <div className="mt-2 text-sm">
          <p>Tempo trabalhado: {timeWorked}</p>
          <p>Custo combustível: R$ {fuelCost.toFixed(2)}</p>
          <p>Ganho líquido: R$ {netEarnings.toFixed(2)}</p>
          <p>Ganho por km: R$ {earningsPerKm.toFixed(2)}</p>
          <p>Ganho por hora: R$ {earningsPerHour.toFixed(2)}</p>
        </div>
      ),
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
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
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
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
                    <FormLabel>Consumo médio (km/l)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Quantos km seu veículo faz por litro
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuelPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço do combustível (R$/L)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário inicial</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
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
                    <FormLabel>Horário final</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="earnings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ganho bruto (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor total ganho no dia
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full">
              Salvar Registro
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterForm;
