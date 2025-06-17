"use client";

import { InstitutionRegisterForm } from "@/components/institutions/InstitutionRegisterForm";

export default function NewInstitutionPage() {
  return (
    <InstitutionRegisterForm 
      title="Nova Instituição"
      description="Cadastre uma nova instituição no sistema"
    />
  );
}