import React from "react";
import { Card } from "@/components/ui/card";
import UserRegisterForm from "@/components/register/UserRegisterForm";

const Register = () => {
  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Criar Conta</h1>
            <p className="text-sm text-muted-foreground">
              Preencha os dados abaixo para criar sua conta
            </p>
          </div>
          <UserRegisterForm />
        </div>
      </Card>
    </div>
  );
};

export default Register;
