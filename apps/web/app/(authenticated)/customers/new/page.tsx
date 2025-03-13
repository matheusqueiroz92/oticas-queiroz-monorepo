"use client";

import UserRegistrationForm from "../../../../components/Users/UserRegisterForm";

export default function NewCustomerPage() {
  return (
    <UserRegistrationForm
      userType="customer"
      redirectTo="/customers"
      title="Novo Cliente"
      description="Cadastre um novo cliente no sistema"
    />
  );
}
