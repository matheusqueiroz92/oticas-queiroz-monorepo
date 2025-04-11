"use client";

import { useLaboratories } from "@/hooks/useLaboratories";
import { LaboratoryForm } from "@/components/Laboratories/LaboratoryForm";

export default function NewLaboratoryPage() {
  const {
    form,
    currentStep,
    loggedEmployee,
    steps,
    isCreating,
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
  } = useLaboratories().useCreateLaboratory();
  
  return (
    <LaboratoryForm
      form={form}
      currentStep={currentStep}
      steps={steps}
      loggedEmployee={loggedEmployee}
      isCreating={isCreating}
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
  );
}