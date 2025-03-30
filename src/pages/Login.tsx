import React from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

const formSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleAuth, isAuthenticated } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await authService.login(data.email, data.password);
      if (response.token) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Você será redirecionado para o dashboard.",
        });
        handleAuth();
      } else {
        throw new Error("Token não recebido");
      }
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      toast({
        title: "Erro ao fazer login",
        description: error.response?.data?.message || "Email ou senha incorretos. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Se já estiver autenticado, redireciona para o dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">DriverDash</h1>
          <p className="text-muted-foreground">Faça login para continuar</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Entrar
            </Button>

            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Não tem uma conta?{" "}
                <a href="/register-user" className="text-primary hover:underline">
                  Registre-se
                </a>
              </p>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage; 