import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  UserCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Building, 
  Info, 
  Activity, 
  ClipboardList, 
  DollarSign, 
  Key,
  ChevronRight,
  ShoppingBag
} from "lucide-react";
import { InfoSection } from "@/components/Users/InfoSection";
import { InfoField } from "@/components/Users/InfoField";
import { ProfileSection } from "@/components/Users/ProfileSection";

interface ProfileViewProps {
  user: any;
  getUserImageUrl: (path?: string) => string;
  onStartEdit: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  getUserImageUrl,
  onStartEdit
}) => {
  const router = useRouter();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Shield className="h-3.5 w-3.5 mr-1" />
            Administrador
          </Badge>
        );
      case "employee":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Building className="h-3.5 w-3.5 mr-1" />
            Funcionário
          </Badge>
        );
      case "customer":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <User className="h-3.5 w-3.5 mr-1" />
            Cliente
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <User className="h-3.5 w-3.5 mr-1" />
            {role}
          </Badge>
        );
    }
  };

  return (
    <Tabs defaultValue="info" className="mt-6">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="info" className="flex items-center gap-2">
          <UserCircle className="h-4 w-4" />
          Informações Pessoais
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Segurança
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <ProfileSection 
          title={user.name}
          description={user.email}
          titleIcon={<User />}
          actions={[
            {
              text: "Editar Perfil",
              icon: <User className="h-4 w-4" />,
              onClick: onStartEdit
            }
          ]}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={getUserImageUrl(user.image)}
                  alt={user.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-xl bg-primary/20 text-primary">
                  {user.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.email}</span>
                  <span className="mx-2">•</span>
                  {getRoleBadge(user.role)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <InfoSection title="Informações Pessoais" icon={<Info />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-gray-50 p-4 rounded-md border">
                <InfoField 
                  label="Telefone" 
                  value={user.phone} 
                  icon={<Phone />} 
                />
                <InfoField 
                  label="Função" 
                  value={user.role === "admin" ? "Administrador" : 
                        user.role === "employee" ? "Funcionário" : 
                        user.role === "customer" ? "Cliente" : 
                        user.role} 
                  icon={<ClipboardList />} 
                />
                <InfoField 
                  label="Endereço" 
                  value={user.address} 
                  icon={<MapPin />} 
                />
              </div>
            </InfoSection>

            <InfoSection title="Atividade" icon={<Activity />}>
              <div className="bg-gray-50 p-4 rounded-md border">
                {user.sales.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    Nenhuma venda realizada.
                  </p>
                ) : <div className="grid grid-cols-1 md:grid-cols-2">
                  <InfoField 
                    label="Vendas realidas" 
                    value={user.sales.length} 
                    icon={<ShoppingBag />} 
                  />
                  <InfoField 
                    label="Valor total em vendas" 
                    value={user.sales.length} 
                    icon={<DollarSign />} 
                  />
                </div>}
              </div>
            </InfoSection>

            {user.role === "customer" && (
              <InfoSection title="Atividade da Conta" icon={<Activity />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.cpf && (
                    <div className="bg-gray-50 p-4 rounded-md border">
                      <InfoField 
                        label="CPF" 
                        value={user.cpf} 
                        icon={<ClipboardList />} 
                      />
                    </div>
                  )}
                  
                  {user.debts !== undefined && (
                    <div className="bg-gray-50 p-4 rounded-md border">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                        Débitos
                      </h4>
                      <p className={`mt-1 font-medium ${user.debts > 0 ? "text-red-600" : "text-green-600"}`}>
                        R$ {user.debts.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </InfoSection>
            )}
          </div>
        </ProfileSection>
      </TabsContent>

      <TabsContent value="security">
        <ProfileSection
          title="Segurança"
          description="Gerencie suas configurações de segurança e acesso"
          titleIcon={<Shield />}
        >
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium flex items-center">
                    <Key className="h-4 w-4 mr-2 text-primary" />
                    Alterar Senha
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recomendamos alterar sua senha regularmente para manter sua conta segura
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/change-password")}
                  className="h-8 gap-1"
                >
                  Alterar
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-primary" />
                    Atividade da Conta
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verifique o histórico de acesso à sua conta
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="h-8 gap-1"
                >
                  Visualizar
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Shield className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-800">Dicas de Segurança</h3>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      Use senhas fortes com pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      Não compartilhe suas credenciais de acesso com outras pessoas
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      Altere sua senha regularmente para maior segurança
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ProfileSection>
      </TabsContent>
    </Tabs>
  );
};