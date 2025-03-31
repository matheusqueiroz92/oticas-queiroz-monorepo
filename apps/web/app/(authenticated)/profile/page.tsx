"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Key, 
  Shield, 
  ChevronRight,
  Upload,
  Save,
  UserCircle,
  ClipboardList,
  Building,
  Activity,
  DollarSign,
  Info
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import Cookies from "js-cookie";
import { PageTitle } from "@/components/PageTitle";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const profileFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone inválido")
    .optional(),
  address: z.string().min(10, "Endereço muito curto").optional(),
  image: z.instanceof(File).optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const [editMode, setEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    profile: user,
    isLoadingProfile: loading,
    isUpdatingProfile,
    handleUpdateProfile,
    refetchProfile,
    getUserImageUrl,
  } = useProfile();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      image: undefined,
    },
  });

  // Atualizar os valores do formulário quando os dados do usuário carregarem
  useEffect(() => {
    if (user && !form.getValues("name") && !editMode) {
      form.reset({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user, form, editMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue("image", file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const formData = new FormData();

      for (const [key, value] of Object.entries(data)) {
        if (key !== "image" && value !== undefined) {
          formData.append(key, String(value));
        }
      }

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        formData.append("userImage", file);
      }

      const updatedUser = await handleUpdateProfile(formData);

      if (updatedUser && updatedUser.name !== Cookies.get("name")) {
        Cookies.set("name", updatedUser.name, { expires: 1 });
      }

      setEditMode(false);
      refetchProfile();
      setPreviewImage(null);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Não foi possível carregar seu perfil. Por favor, tente novamente mais tarde.
          </AlertDescription>
          <Button className="mt-4" onClick={() => router.push("/dashboard")}>
            Voltar para o Dashboard
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <PageTitle
        title="Meu Perfil"
        description="Gerencie suas informações pessoais e configurações de segurança"
      />

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
          <Card className="shadow-sm border">
            <CardHeader className="p-6 bg-gray-50 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {user.name}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {user.email} 
                    <span className="mx-2">•</span>
                    {getRoleBadge(user.role)}
                  </CardDescription>
                </div>
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={previewImage || getUserImageUrl(user.image)}
                      alt={user.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-xl bg-primary/20 text-primary">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {editMode && (
                    <div className="absolute -bottom-2 -right-2 rounded-full bg-primary p-1 shadow-sm">
                      <Upload className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {editMode ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <User className="h-4 w-4 text-primary" />
                              Nome Completo
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo" {...field} className="h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <Mail className="h-4 w-4 text-primary" />
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Seu email"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <Phone className="h-4 w-4 text-primary" />
                              Telefone
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(00) 00000-0000" 
                                {...field} 
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field: { onChange } }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <Upload className="h-4 w-4 text-primary" />
                              Foto de Perfil
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-primary" />
                            Endereço
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Endereço completo" 
                              {...field} 
                              className="h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditMode(false);
                          setPreviewImage(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isUpdatingProfile}
                        className="gap-2"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-md font-medium mb-4 flex items-center">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      Informações Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-gray-50 p-4 rounded-md border">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          Nome
                        </h4>
                        <p className="mt-1 font-medium">{user.name}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                          <Mail className="h-4 w-4 mr-1 text-gray-400" />
                          Email
                        </h4>
                        <p className="mt-1 font-medium">{user.email}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          Telefone
                        </h4>
                        <p className="mt-1 font-medium">{user.phone || "Não informado"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                          <ClipboardList className="h-4 w-4 mr-1 text-gray-400" />
                          Função
                        </h4>
                        <p className="mt-1 font-medium capitalize">{
                          user.role === "admin" ? "Administrador" : 
                          user.role === "employee" ? "Funcionário" : 
                          user.role === "customer" ? "Cliente" : 
                          user.role
                        }</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium mb-4 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-primary" />
                      Endereço
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-md border">
                      <p className="font-medium">{user.address || "Endereço não informado"}</p>
                      {!user.address && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Adicione seu endereço para facilitar o cadastro em futuras compras.
                        </p>
                      )}
                    </div>
                  </div>

                  {user.role === "customer" && (
                    <div>
                      <h3 className="text-md font-medium mb-4 flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-primary" />
                        Atividade da Conta
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {user.cpf && (
                          <div className="bg-gray-50 p-4 rounded-md border">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                              <ClipboardList className="h-4 w-4 mr-1 text-gray-400" />
                              CPF
                            </h4>
                            <p className="mt-1 font-medium">{user.cpf}</p>
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
                    </div>
                  )}

                  <div className="flex justify-end mt-6 pt-4 border-t">
                    <Button onClick={() => setEditMode(true)} className="gap-2">
                      <User className="h-4 w-4" />
                      Editar Perfil
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="shadow-sm border">
            <CardHeader className="p-6 bg-gray-50 border-b">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                <div>
                  <CardTitle>Segurança</CardTitle>
                  <CardDescription>
                    Gerencie suas configurações de segurança e acesso
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
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
            </CardContent>
            
            <CardFooter className="p-6 bg-gray-50 border-t">
              <div className="flex items-center gap-2 w-full justify-end">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Voltar ao Dashboard
                </Button>
                <Button onClick={() => router.push("/change-password")}>
                  <Key className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}