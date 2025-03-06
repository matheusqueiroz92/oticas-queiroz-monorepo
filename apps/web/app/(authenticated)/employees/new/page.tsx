"use client";

import UserRegistrationForm from "../../../../components/forms/UserRegisterForm";

export default function NewEmployeePage() {
  return (
    <UserRegistrationForm
      userType="employee"
      redirectTo="/employees"
      title="Novo Funcionário"
      description="Cadastre um novo funcionário no sistema"
    />
  );
}
