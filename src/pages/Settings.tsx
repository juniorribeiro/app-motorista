import { useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
}

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    theme: "system",
    notifications: true,
    currency: "BRL",
    distanceUnit: "km",
    language: "pt-BR",
  });

  const { toast } = useToast();

  const handleSaveSettings = () => {
    // Aqui você implementaria a lógica para salvar as configurações
    localStorage.setItem("userSettings", JSON.stringify(settings));
    toast({
      title: "Configurações salvas",
      description: "Suas preferências foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Personalize sua experiência no aplicativo
          </p>
        </div>
      </div>

      <div className="grid gap-6">
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