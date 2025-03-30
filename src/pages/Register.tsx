
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import RegisterForm from "@/components/register/RegisterForm";

const RegisterPage = () => {
  return (
    <MainLayout>
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-6">Novo Registro</h2>
        <RegisterForm />
      </div>
    </MainLayout>
  );
};

export default RegisterPage;
