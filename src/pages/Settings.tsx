import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

interface UserSettings {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  currency: "BRL" | "USD" | "EUR";
  distanceUnit: "km" | "mi";
  language: "pt-BR" | "en-US" | "es";
  dailyGoal?: number;
  weeklyGoal?: number;
  monthlyGoal?: number;
}

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    theme: "system",
    notifications: true,
    currency: "BRL",
    distanceUnit: "km",
    language: "pt-BR",
    dailyGoal: 0,
    weeklyGoal: 0,
    monthlyGoal: 0,
  });

  const { toast } = useToast();

  useEffect(() => {
    // Carregar configurações do localStorage se existirem
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Erro ao carregar configurações", e);
      }
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("userSettings", JSON.stringify(settings));
    toast({
      title: "Configurações salvas",
      description: "Suas preferências e metas foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Personalize sua experiência no aplicativo e defina suas metas
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Metas Financeiras (Faturamento)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyGoal">Meta Diária (R$)</Label>
              <Input
                id="dailyGoal"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 250.00"
                value={settings.dailyGoal || ""}
                onChange={(e) =>
                  setSettings({ ...settings, dailyGoal: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weeklyGoal">Meta Semanal (R$)</Label>
              <Input
                id="weeklyGoal"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 1500.00"
                value={settings.weeklyGoal || ""}
                onChange={(e) =>
                  setSettings({ ...settings, weeklyGoal: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyGoal">Meta Mensal (R$)</Label>
              <Input
                id="monthlyGoal"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 6000.00"
                value={settings.monthlyGoal || ""}
                onChange={(e) =>
                  setSettings({ ...settings, monthlyGoal: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Essas metas serão usadas posteriormente para gerar estatísticas e acompanhar seu progresso no dashboard.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Aparência</h2>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="theme">Tema</Label>
              <Select
                value={settings.theme}
                onValueChange={(value: "light" | "dark" | "system") =>
                  setSettings({ ...settings, theme: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Preferências</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações</Label>
                <p className="text-sm text-muted-foreground">
                  Receba alertas sobre suas viagens
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notifications: checked })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select
                value={settings.currency}
                onValueChange={(value: "BRL" | "USD" | "EUR") =>
                  setSettings({ ...settings, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar (US$)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="distanceUnit">Unidade de Distância</Label>
              <Select
                value={settings.distanceUnit}
                onValueChange={(value: "km" | "mi") =>
                  setSettings({ ...settings, distanceUnit: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="km">Quilômetros (km)</SelectItem>
                  <SelectItem value="mi">Milhas (mi)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="language">Idioma</Label>
              <Select
                value={settings.language}
                onValueChange={(value: "pt-BR" | "en-US" | "es") =>
                  setSettings({ ...settings, language: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings}>
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}