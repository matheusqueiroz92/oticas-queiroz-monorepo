"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2, Info } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { ErrorAlert } from "@/components/ErrorAlert";
import { PageTitle } from "@/components/PageTitle";
import { UserInfoCard } from "@/components/Users/UserInfoCard";
import { InfoSection } from "@/components/Users/InfoSection";
import { InfoField } from "@/components/Users/InfoField";
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
  description?: string;
  getFields: (user: any) => FieldDefinition[];
  getSections?: (user: any) => {
    title: string;
    icon: ReactNode;
    fields: FieldDefinition[];
  }[];
  errorMessage: string;
}

export default function UserDetailsPage({
  userType,
  title,
  description,
  getFields,
  getSections,
  errorMessage,
}: UserDetailsPageProps) {
  const { id } = useParams();
  const router = useRouter();
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
  const sections = getSections ? getSections(user) : [
    {
      title: "Informações Pessoais",
      icon: <Info />,
      fields: fields
    }
  ];
  
  const handleEditClick = () => {
    router.push(`/users/${user._id}/edit`);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <PageTitle
        title={title}
        description={description || `Visualizando dados ${userType === "customer" ? "do cliente" : "do funcionário"}`}
      />

      <div className="mt-6">
        <UserInfoCard
          user={{ 
            ...user, 
            image: getUserImageUrl(user.image)
          }}
          title={title}
          description={description}
          showEditButton={true}
          onEditClick={handleEditClick}
        >
          <div className="space-y-8 mt-4">
            {sections.map((section, index) => (
              <InfoSection
                key={index}
                title={section.title}
                icon={section.icon}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-gray-50 p-4 rounded-md border">
                  {section.fields.map((field) => (
                    <InfoField
                      key={field.key}
                      label={field.label}
                      value={field.render ? field.render(user) : user[field.key as keyof typeof user]?.toString()}
                      icon={field.icon}
                    />
                  ))}
                </div>
              </InfoSection>
            ))}
          </div>
        </UserInfoCard>
      </div>
    </div>
  );
}