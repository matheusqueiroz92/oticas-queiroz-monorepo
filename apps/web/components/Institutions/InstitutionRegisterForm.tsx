"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createInstitutionForm, InstitutionFormData } from "@/schemas/institution-schema";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/app/_services/authService";
import { useToast } from "@/hooks/useToast";
import { Building, Mail, Phone, Home, Calendar, FileImage, CreditCard, Key, CheckCircle2, ChevronRight, Loader2, User, Briefcase } from "lucide-react";

interface InstitutionFormProps {
  title: string;
  description: string;
}

const steps = [
  { id: "institutional", label: "Dados Institucionais" },
  { id: "contact", label: "Contato" },
  { id: "security", label: "Segurança" },
];

export function InstitutionRegisterForm({ title, description }: InstitutionFormProps) {
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
  
  const form = createInstitutionForm();

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
      onSubmit(form.getValues() as InstitutionFormData);
    }
  };

  const onSubmit = async (data: InstitutionFormData) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "image" && key !== "confirmPassword" && 
            key !== "email" && key !== "phone" && key !== "address" &&
            key !== "cpf") {
          formData.append(key, String(value));
        }
      });
      
      formData.set("email", emailValue);
      formData.set("phone", phoneValue);
      formData.set("address", addressValue);
      formData.set("role", "institution");

      if (selectedFile) {
        formData.set("userImage", selectedFile);
      }
      
      const response = await api.post("/api/auth/register", formData);
      
      if (response.status === 201 || response.status === 200) {
        setIsSuccess(true);
        toast({
          title: "Instituição cadastrada com sucesso",
          description: "A instituição foi cadastrada com sucesso no sistema.",
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
    router.push("/institutions");
  };

  const nextStep = () => {
    if (currentStep === 0) {
      form.trigger(['name', 'cnpj', 'businessName', 'tradeName']).then((isValid) => {
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
          !!form.getValues("cnpj");
        break;
      case 1:
        canContinue = true;
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
                    <Building className="h-4 w-4 text-primary" />
                    Nome da Instituição*
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da instituição" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4 text-primary" />
                    CNPJ*
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Apenas números (14 dígitos)" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                      maxLength={14}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-primary" />
                    Razão Social
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Razão social" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tradeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-primary" />
                    Nome Fantasia
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nome fantasia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Ramo de Atividade
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ramo de atividade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <User className="h-4 w-4 text-primary" />
                    Pessoa de Contato
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da pessoa de contato" {...field} />
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
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setPhoneValue(value);
                }}
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
              <Textarea 
                placeholder="Endereço completo" 
                value={addressValue}
                onChange={(e) => setAddressValue(e.target.value)}
                autoComplete="off"
                rows={3}
              />
              {form.formState.errors.address && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.address.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <FormLabel className="flex items-center gap-1">
                <FileImage className="h-4 w-4 text-primary" />
                Logo da Instituição
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
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Credenciais de Acesso</CardTitle>
                </div>
                <CardDescription>
                  Defina as credenciais de acesso para o sistema
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
                          Senha*
                        </FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Senha" {...field} />
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
                          Confirmar Senha*
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirme a senha"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
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
            Instituição cadastrada com sucesso no sistema.
          </p>
          <Button 
            onClick={navigateToList}
            className="w-full"
          >
            Ver Lista de Instituições
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
              <Building className="h-5 w-5 text-primary" />
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
              id="institutionForm"
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
                  `Cadastrar Instituição`
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}