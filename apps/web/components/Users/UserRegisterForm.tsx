import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserForm, UserFormData } from "@/schemas/user-schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/app/services/authService";
import { useToast } from "@/hooks/useToast";
import { User, Mail, Phone, Home, Calendar, FileImage, CreditCard, Key, CheckCircle2, ChevronRight, Loader2, UserPlus, ShieldCheck } from "lucide-react";

interface UserFormProps {
  userType: "customer" | "employee";
  title: string;
  description: string;
}

const steps = [
  { id: "personal", label: "Dados Pessoais" },
  { id: "contact", label: "Contato" },
  { id: "security", label: "Segurança" },
];

export function UserRegisterForm({ userType, title, description }: UserFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [emailValue, setEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [addressValue, setAddressValue] = useState("");
  
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  
  const form = createUserForm();
  
  useEffect(() => {
    if (userType === "customer") {
      const subscription = form.watch((value, { name }) => {
        if (name === "cpf") {
          const cpf = value.cpf;
          if (cpf && cpf.length >= 6) {
            const defaultPassword = cpf.slice(0, 6);
            form.setValue("password", defaultPassword);
            form.setValue("confirmPassword", defaultPassword);
          }
        }
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, userType]);

  useEffect(() => {
    if (currentStep === 1) {
      setEmailValue(form.getValues("email") || "");
      setPhoneValue(form.getValues("phone") || "");
      setAddressValue(form.getValues("address") || "");
    }
  }, [currentStep, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleButtonClick = () => {
    if (formRef.current) {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    } else {
      console.error("Form element not found");
      onSubmit(form.getValues() as UserFormData);
    }
  };

  const onSubmit = async (data: UserFormData) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "image" && key !== "confirmPassword" && 
            key !== "email" && key !== "phone" && key !== "address") {
          formData.append(key, String(value));
        }
      });
      
      formData.set("email", emailValue);
      formData.set("phone", phoneValue);
      formData.set("address", addressValue);
      formData.set("role", userType);

      if (selectedFile) {
        formData.set("userImage", selectedFile);
      }
      
      const response = await api.post("/api/auth/register", formData);
      
      if (response.status === 201 || response.status === 200) {
        setIsSuccess(true);
        toast({
          title: "Usuário cadastrado com sucesso",
          description: "O usuário foi cadastrado com sucesso no sistema.",
        });
      }
    } catch (error) {
      console.error("Erro ao submeter formulário:", error);
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: "Ocorreu um erro ao enviar os dados do formulário."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToList = () => {
    router.push(userType === "customer" ? "/customers" : "/employees");
  };

  const nextStep = () => {
    if (currentStep === 0) {
      form.trigger(['name', 'cpf', 'rg', 'birthDate']).then((isValid) => {
        if (isValid) {
          setCurrentStep(1);
          window.scrollTo(0, 0);
        }
      });
    } else if (currentStep === 1) {
      form.setValue("email", emailValue);
      form.setValue("phone", phoneValue);
      form.setValue("address", addressValue);
      form.trigger(['email', 'phone', 'address']).then((isValid) => {
        if (isValid) {
          setCurrentStep(2);
          window.scrollTo(0, 0);
        }
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const checkCanContinue = () => {
    if (!form || !form.getValues) return false;
    
    let canContinue = true;
    
    switch (currentStep) {
      case 0:
        canContinue = 
          !!form.getValues("name") && 
          !!form.getValues("cpf") &&
          !!form.getValues("birthDate");
        break;
      case 1:
        canContinue = 
          !!phoneValue && 
          !!addressValue;
        break;
      case 2:
        canContinue = 
          !!form.getValues("password") && 
          !!form.getValues("confirmPassword");
        break;
    }
    
    return canContinue;
  };

  const renderStepProgress = () => {
    return (
      <div className="w-full mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className="flex flex-col items-center"
              style={{ width: `${100/steps.length}%` }}
            >
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full 
                ${index < currentStep ? 'bg-green-500 text-white' : 
                  index === currentStep ? 'bg-primary text-white' : 
                  'bg-gray-200 text-gray-500'}
                ${index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}
              `}
              onClick={() => {
                if (index <= currentStep) {
                  setCurrentStep(index);
                }
              }}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className={`
                text-xs mt-1 text-center
                ${index === currentStep ? 'text-primary font-medium' : 'text-gray-500'}
              `}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
        <div className="relative w-full h-1 bg-gray-200 rounded-full mt-2">
          <div 
            className="absolute top-0 left-0 h-1 bg-primary rounded-full"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
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
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4 text-primary" />
                    CPF
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Apenas números (11 dígitos)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4 text-primary" />
                    RG
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Apenas números (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    Data de Nascimento
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <FormLabel className="flex items-center gap-1">
                <Mail className="h-4 w-4 text-primary" />
                Email
              </FormLabel>
              <Input 
                type="email" 
                placeholder="Email" 
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                autoComplete="off"
              />
              {form.formState.errors.email && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <FormLabel className="flex items-center gap-1">
                <Phone className="h-4 w-4 text-primary" />
                Telefone
              </FormLabel>
              <Input 
                placeholder="(00)00000-0000" 
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
                autoComplete="off"
              />
              {form.formState.errors.phone && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <FormLabel className="flex items-center gap-1">
                <Home className="h-4 w-4 text-primary" />
                Endereço
              </FormLabel>
              <Input 
                placeholder="Endereço completo" 
                value={addressValue}
                onChange={(e) => setAddressValue(e.target.value)}
                autoComplete="off"
              />
              {form.formState.errors.address && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.address.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <FormLabel className="flex items-center gap-1">
                <FileImage className="h-4 w-4 text-primary" />
                Foto do {userType === "customer" ? "Cliente" : "Funcionário"}
              </FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Arquivos suportados: JPEG, PNG, WebP
                  </p>
                </div>
                <div className="flex items-center justify-center bg-gray-50 rounded-md border h-[150px] overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm flex flex-col items-center">
                      <FileImage className="h-8 w-8 mb-2 opacity-20" />
                      <span>Nenhuma imagem selecionada</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Card className="border shadow-sm bg-gray-50 mb-4">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Credenciais de Acesso</CardTitle>
                </div>
                <CardDescription>
                  {userType === "customer" 
                    ? "A senha é preenchida automaticamente com os 6 primeiros dígitos do CPF." 
                    : "Defina a senha de acesso do funcionário ao sistema."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Key className="h-4 w-4 text-primary" />
                          Senha
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Senha" 
                            {...field} 
                            readOnly={userType === "customer"}
                            className={userType === "customer" ? "bg-gray-100" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Key className="h-4 w-4 text-primary" />
                          Confirmar Senha
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirme a senha"
                            {...field}
                            readOnly={userType === "customer"}
                            className={userType === "customer" ? "bg-gray-100" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {userType === "customer" && (
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>A senha foi gerada automaticamente usando os 6 primeiros dígitos do CPF. O cliente pode alterá-la após o primeiro acesso.</span>
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderSuccessModal = () => {
    if (!isSuccess) return null;
    
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white p-6 rounded-lg max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Cadastro Realizado!</h3>
          <p className="text-gray-600 mb-6">
            {userType === "customer" ? "Cliente" : "Funcionário"} cadastrado com sucesso no sistema.
          </p>
          <Button 
            onClick={navigateToList}
            className="w-full"
          >
            Ver Lista de {userType === "customer" ? "Clientes" : "Funcionários"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {renderSuccessModal()}
      
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50 p-4 flex flex-row items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {userType === "customer" ? (
                <User className="h-5 w-5 text-primary" />
              ) : (
                <UserPlus className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form
              id="userForm"
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              autoComplete="off"
            >
              {renderStepProgress()}
              {renderStepContent()}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div>
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
              >
                <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button 
                type="button" 
                onClick={nextStep}
                disabled={!checkCanContinue()}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                type="button" 
                disabled={isSubmitting || !checkCanContinue()}
                onClick={handleButtonClick}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  `Cadastrar ${userType === "customer" ? "Cliente" : "Funcionário"}`
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}