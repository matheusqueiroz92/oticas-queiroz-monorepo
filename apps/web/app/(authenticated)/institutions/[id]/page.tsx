"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2, Mail, Phone, MapPin, Building, User, CreditCard, Briefcase } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { ErrorAlert } from "@/components/ErrorAlert";
import { PageTitle } from "@/components/PageTitle";
import { UserInfoCard } from "@/components/Profile/UserInfoCard";
import { InfoSection } from "@/components/Profile/InfoSection";
import { InfoField } from "@/components/Profile/InfoField";
import { Institution } from "@/app/_types/institution";

export default function InstitutionDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { useUserQuery, getUserImageUrl } = useUsers();

  const { data: institution, isLoading, error } = useUserQuery(id as string);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados da instituição...</p>
      </div>
    );
  }

  if (error || !institution) {
    return (
      <ErrorAlert
        message={(error as Error)?.message || "Erro ao carregar dados da instituição"}
      />
    );
  }

  if (institution.role !== "institution") {
    return (
      <ErrorAlert
        message="O usuário carregado não é uma instituição."
      />
    );
  }

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return "-";
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const handleEditClick = () => {
    router.push(`/institutions/${institution._id}/edit`);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <PageTitle
        title="Detalhes da Instituição"
        description="Visualizando dados da instituição"
      />

      <div className="mt-6">
        <UserInfoCard
          user={{ 
            ...institution, 
            image: getUserImageUrl(institution.image)
          }}
          title="Detalhes da Instituição"
          description="Informações completas da instituição"
          showEditButton={true}
          onEditClick={handleEditClick}
        >
          <div className="space-y-8 mt-4">
            <InfoSection
              title="Informações Básicas"
              icon={<Building />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-gray-50 p-4 rounded-md border">
                <InfoField
                  label="Nome"
                  value={institution.name}
                  icon={<Building />}
                />
                <InfoField
                  label="CNPJ"
                  value={formatCNPJ((institution as Institution).cnpj)}
                  icon={<CreditCard />}
                />
                <InfoField
                  label="Razão Social"
                  value={(institution as Institution).businessName || "-"}
                  icon={<Building />}
                />
                <InfoField
                  label="Nome Fantasia"
                  value={(institution as Institution).tradeName || "-"}
                  icon={<Building />}
                />
                <InfoField
                  label="Ramo de Atividade"
                  value={(institution as Institution).industryType || "-"}
                  icon={<Briefcase />}
                />
                <InfoField
                  label="Pessoa de Contato"
                  value={(institution as Institution).contactPerson || "-"}
                  icon={<User />}
                />
              </div>
            </InfoSection>

            <InfoSection
              title="Contato"
              icon={<Mail />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-gray-50 p-4 rounded-md border">
                <InfoField
                  label="Email"
                  value={institution.email || "-"}
                  icon={<Mail />}
                />
                <InfoField
                  label="Telefone"
                  value={institution.phone || "-"}
                  icon={<Phone />}
                />
                <InfoField
                  label="Endereço"
                  value={institution.address || "-"}
                  icon={<MapPin />}
                />
              </div>
            </InfoSection>
          </div>
        </UserInfoCard>
      </div>
    </div>
  );
}