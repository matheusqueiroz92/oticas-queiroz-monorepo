"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLaboratories } from "@/hooks/useLaboratories";
import { LaboratoryForm } from "@/components/laboratories/LaboratoryForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function EditLaboratoryPage() {
  const { id } = useParams<{ id: string }>();
  
  const {
    useEditLaboratory
  } = useLaboratories();
  
  const {
    form,
    currentStep,
    loggedEmployee,
    steps,
    laboratory,
    isLoading,
    error,
    isUpdating,
    streetValue,
    setStreetValue,
    numberValue,
    setNumberValue,
    complementValue,
    setComplementValue,
    neighborhoodValue,
    setNeighborhoodValue,
    cityValue,
    setCityValue,
    stateValue,
    setStateValue,
    zipCodeValue,
    setZipCodeValue,
    handleStepClick,
    nextStep,
    prevStep,
    checkCanContinue,
    onSubmit,
    navigateBack
  } = useEditLaboratory(id as string);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error || !laboratory) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados do laboratório.
          </AlertDescription>
          <Button className="mt-4" onClick={navigateBack}>
            Voltar para Laboratórios
          </Button>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={navigateBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Editar Laboratório</h1>
      </div>
      
      <LaboratoryForm
        form={form}
        currentStep={currentStep}
        steps={steps}
        loggedEmployee={loggedEmployee}
        isCreating={isUpdating}
        addressValues={{
          street: streetValue,
          number: numberValue,
          complement: complementValue,
          neighborhood: neighborhoodValue,
          city: cityValue,
          state: stateValue,
          zipCode: zipCodeValue
        }}
        onAddressChange={{
          setStreet: setStreetValue,
          setNumber: setNumberValue,
          setComplement: setComplementValue,
          setNeighborhood: setNeighborhoodValue,
          setCity: setCityValue,
          setState: setStateValue,
          setZipCode: setZipCodeValue
        }}
        onStepChange={handleStepClick}
        onNextStep={nextStep}
        onPrevStep={prevStep}
        onCheckCanContinue={checkCanContinue}
        onSubmit={onSubmit}
        onCancel={navigateBack}
      />
    </div>
  );
}