"use client";

import { UserRegisterForm } from "@/components/profile/UserRegisterForm";

export default function NewEmployeePage() {
  return (
    <UserRegisterForm 
      userType="employee"
      title="Novo Funcionário"
      description="Cadastre um novo funcionário no sistema"
    />
  );
}