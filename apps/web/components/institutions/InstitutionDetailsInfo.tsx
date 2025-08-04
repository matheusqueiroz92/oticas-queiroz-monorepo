import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Institution } from "@/app/_types/institution";
import { Building, Mail, Phone, MapPin, CreditCard, User, Briefcase } from "lucide-react";

interface InstitutionDetailsInfoProps {
  institution: Institution;
  getUserImageUrl: (image?: string) => string;
}

export function InstitutionDetailsInfo({ institution, getUserImageUrl }: InstitutionDetailsInfoProps) {
  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return "-";
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  return (
    <div className="space-y-6">
      {/* Card Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={getUserImageUrl(institution.image)} 
                alt={institution.name} 
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                <Building className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{institution.name}</CardTitle>
              <CardDescription>
                Instituição cadastrada no sistema
              </CardDescription>
            </div>
            <Badge
              variant={institution.status === "active" ? "default" : "secondary"}
              className={
                institution.status === "active" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-gray-100 text-gray-800"
              }
            >
              {institution.status === "active" ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome da Instituição</label>
                <p className="text-lg font-medium">{institution.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
                <p className="font-mono">{formatCNPJ(institution.cnpj)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Razão Social</label>
                <p>{institution.businessName || "-"}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome Fantasia</label>
                <p>{institution.tradeName || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Indústria</label>
                <p>{institution.industryType || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Pessoa de Contato</label>
                <p>{institution.contactPerson || "-"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {institution.email || "-"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {institution.phone || "-"}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="whitespace-pre-line">{institution.address || "-"}</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}