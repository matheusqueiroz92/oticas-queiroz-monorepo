"use client";

import UserRegisterForm from "@/components/Users/UserRegisterForm";

export default function NewCustomerPage() {
  return (
    <UserRegisterForm 
      userType="customer"
      title="Novo Cliente"
      description="Cadastre um novo cliente no sistema"
    />
  );
}