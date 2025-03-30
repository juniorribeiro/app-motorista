import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { tripService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const tripSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  distance: z.string().min(1, "Distância é obrigatória"),
  fuelConsumption: z.string().min(1, "Consumo de combustível é obrigatório"),
  fuelPrice: z.string().min(1, "Preço do combustível é obrigatório"),
  startTime: z.string().min(1, "Horário de início é obrigatório"),
  endTime: z.string().min(1, "Horário de término é obrigatório"),
  earnings: z.string().min(1, "Ganhos são obrigatórios"),
});

type TripFormData = z.infer<typeof tripSchema>;

const RegisterTrip = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
  });

  const onSubmit = async (data: TripFormData) => {
    try {
      const tripData = {
        ...data,
        distance: Number(data.distance),
        fuelConsumption: Number(data.fuelConsumption),
        fuelPrice: Number(data.fuelPrice),
        earnings: Number(data.earnings),
      };

      await tripService.addTrip(tripData);
      toast({
        title: "Sucesso",
        description: "Viagem registrada com sucesso!",
      });
      navigate("/history");
    } catch (error) {
      console.error("Erro ao registrar viagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a viagem.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Registrar Viagem</h2>
        <p className="text-muted-foreground">
          Preencha os dados da sua viagem
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Viagem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  {...register("date")}
                />
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance">Distância (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  {...register("distance")}
                />
                {errors.distance && (
                  <p className="text-sm text-red-500">{errors.distance.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelConsumption">Consumo (km/l)</Label>
                <Input
                  id="fuelConsumption"
                  type="number"
                  step="0.1"
                  {...register("fuelConsumption")}
                />
                {errors.fuelConsumption && (
                  <p className="text-sm text-red-500">{errors.fuelConsumption.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelPrice">Preço do Combustível (R$/l)</Label>
                <Input
                  id="fuelPrice"
                  type="number"
                  step="0.01"
                  {...register("fuelPrice")}
                />
                {errors.fuelPrice && (
                  <p className="text-sm text-red-500">{errors.fuelPrice.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Horário de Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register("startTime")}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500">{errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Horário de Término</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register("endTime")}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500">{errors.endTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="earnings">Ganhos (R$)</Label>
                <Input
                  id="earnings"
                  type="number"
                  step="0.01"
                  {...register("earnings")}
                />
                {errors.earnings && (
                  <p className="text-sm text-red-500">{errors.earnings.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/history")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Registrando..." : "Registrar Viagem"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterTrip; 