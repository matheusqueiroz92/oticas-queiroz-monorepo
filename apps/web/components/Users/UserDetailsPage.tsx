"use client";

import { useParams } from "next/navigation";
import { Loader2, Mail, Phone, MapPin, CreditCard, ShoppingBag, Briefcase, User as UserIcon } from "lucide-react";
import { UserDetailsCard } from "@/components/Users/UserDetailsCard";
import { useUsers } from "@/hooks/useUsers";
import { ErrorAlert } from "@/components/ErrorAlert";
import type { Customer } from "@/app/types/customer";
import type { Employee } from "@/app/types/employee";
import { ReactNode } from "react";

interface FieldDefinition {
  key: string;
  label: string;
  render?: (user: any) => ReactNode;
  icon?: ReactNode;
}

interface UserDetailsPageProps {
  userType: "customer" | "employee";
  title: string;
  getFields: (user: Customer | Employee) => FieldDefinition[];
  errorMessage: string;
}

export default function UserDetailsPage({
  userType,
  title,
  getFields,
  errorMessage,
}: UserDetailsPageProps) {
  const { id } = useParams();
  const { useUserQuery, getUserImageUrl } = useUsers();

  const { data: user, isLoading, error } = useUserQuery(id as string);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados do usuário...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <ErrorAlert
        message={(error as Error)?.message || errorMessage}
      />
    );
  }

  if (userType === "customer" && user.role !== "customer") {
    return (
      <ErrorAlert
        message="Usuário carregado não é um cliente."
      />
    );
  }

  if (userType === "employee" && user.role !== "employee" && user.role !== "admin") {
    return (
      <ErrorAlert
        message="Usuário carregado não é um funcionário."
      />
    );
  }

  const fields = getFields(user);

  return (
    <UserDetailsCard
      user={{ ...user, image: getUserImageUrl(user.image) }}
      title={title}
      fields={fields}
    />
  );
}