"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Building, User, Mail, Phone, MapPin, Home, Hash, FileText, MapPinned, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { type UseFormReturn } from "react-hook-form";
import { type LaboratoryFormData } from "@/schemas/laboratory-schema";

interface LaboratoryFormProps {
  form: UseFormReturn<LaboratoryFormData>;
  currentStep: number;
  steps: { id: string; label: string }[];
  loggedEmployee: { id: string; name: string; email: string; role: string } | null;
  isCreating: boolean;
  
  addressValues: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  onAddressChange: {
    setStreet: (value: string) => void;
    setNumber: (value: string) => void;
    setComplement: (value: string) => void;
    setNeighborhood: (value: string) => void;
    setCity: (value: string) => void;
    setState: (value: string) => void;
    setZipCode: (value: string) => void;
  };
  
  onStepChange: (index: number) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onCheckCanContinue: () => boolean;
  onSubmit: (data: LaboratoryFormData) => void;
  onCancel: () => void;
}

export function LaboratoryForm({
  form,
  currentStep,
  steps,
  loggedEmployee,
  isCreating,
  addressValues,
  onAddressChange,
  onStepChange,
  onNextStep,
  onPrevStep,
  onCheckCanContinue,
  onSubmit,
  onCancel,
}: LaboratoryFormProps) {
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
                  onStepChange(index);
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
                    Nome do Laboratório
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do laboratório" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <User className="h-4 w-4 text-primary" />
                    Nome do Contato
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome da pessoa de contato"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="Email de contato"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        placeholder="Telefone (somente números)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="space-y-1">
                  <FormLabel className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    Rua
                  </FormLabel>
                  <Input 
                    placeholder="Rua" 
                    value={addressValues.street}
                    onChange={(e) => onAddressChange.setStreet(e.target.value)}
                  />
                  {form.formState.errors.address?.street && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.address.street.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="space-y-1">
                  <FormLabel className="flex items-center gap-1">
                    <Hash className="h-4 w-4 text-primary" />
                    Número
                  </FormLabel>
                  <Input 
                    placeholder="Número" 
                    value={addressValues.number}
                    onChange={(e) => onAddressChange.setNumber(e.target.value)}
                  />
                  {form.formState.errors.address?.number && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.address.number.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <FormLabel className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-primary" />
                Complemento
              </FormLabel>
              <Input
                placeholder="Complemento (opcional)"
                value={addressValues.complement}
                onChange={(e) => onAddressChange.setComplement(e.target.value)}
              />
              {form.formState.errors.address?.complement && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.address.complement.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <FormLabel className="flex items-center gap-1">
                <Home className="h-4 w-4 text-primary" />
                Bairro
              </FormLabel>
              <Input 
                placeholder="Bairro" 
                value={addressValues.neighborhood}
                onChange={(e) => onAddressChange.setNeighborhood(e.target.value)}
              />
              {form.formState.errors.address?.neighborhood && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.address.neighborhood.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <div className="space-y-1">
                  <FormLabel className="flex items-center gap-1">
                    <MapPinned className="h-4 w-4 text-primary" />
                    Cidade
                  </FormLabel>
                  <Input 
                    placeholder="Cidade" 
                    value={addressValues.city}
                    onChange={(e) => onAddressChange.setCity(e.target.value)}
                  />
                  {form.formState.errors.address?.city && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.address.city.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <FormLabel className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  Estado
                </FormLabel>
                <Input 
                  placeholder="UF" 
                  maxLength={2} 
                  value={addressValues.state}
                  onChange={(e) => onAddressChange.setState(e.target.value)}
                />
                {form.formState.errors.address?.state && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.address.state.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <FormLabel className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  CEP
                </FormLabel>
                <Input
                  placeholder="CEP (somente números)"
                  value={addressValues.zipCode}
                  onChange={(e) => onAddressChange.setZipCode(e.target.value)}
                />
                {form.formState.errors.address?.zipCode && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.address.zipCode.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50 p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building className="h-5 w-5 text-[var(--secondary-red)]" />
            </div>
            <div>
              <CardTitle className="text-xl text-[var(--secondary-red)]">Novo Laboratório</CardTitle>
              <CardDescription>Cadastre um novo laboratório parceiro</CardDescription>
            </div>
          </div>
          {loggedEmployee && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="h-4 w-4" /> Vendedor: {loggedEmployee.name}
            </p>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form id="laboratoryForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                onClick={onPrevStep}
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
              onClick={onCancel}
            >
              Cancelar
            </Button>
            
            {currentStep < steps.length - 1 ? (
            <Button 
              type="button" 
              onClick={onNextStep}
              disabled={!onCheckCanContinue()}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              type="button"
              disabled={isCreating || !onCheckCanContinue()}
              onClick={() => {
                form.setValue("address.street", addressValues.street);
                form.setValue("address.number", addressValues.number);
                form.setValue("address.complement", addressValues.complement);
                form.setValue("address.neighborhood", addressValues.neighborhood);
                form.setValue("address.city", addressValues.city);
                form.setValue("address.state", addressValues.state);
                form.setValue("address.zipCode", addressValues.zipCode);
                form.handleSubmit(onSubmit)();
              }}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Cadastrar Laboratório"
              )}
            </Button>
          )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}