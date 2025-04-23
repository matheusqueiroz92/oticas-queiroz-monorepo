"use client";

import { usePayments } from "@/hooks/usePayments";
import { PaymentForm } from "@/components/Payments/PaymentForm";

export default function NewPaymentPage() {
  const { usePaymentForm } = usePayments();
  
  const {
    form,
    currentStep,
    isCashRegisterOpen,
    isLoadingCashRegister,
    cashRegister,
    isSubmitting,
    customers,
    isLoadingCustomers,
    legacyClients,
    isLoadingLegacyClients,
    clientOrders,
    isLoadingOrders,
    customerSearch,
    orderSearch,
    legacyClientSearch,
    selectedEntityType,
    showInstallments,
    showCheckFields,
    setShowCheckFields,
    setCustomerSearch,
    setOrderSearch,
    setLegacyClientSearch,
    onClientSelect,
    onLegacyClientSelect,
    onOrderSelect,
    onEntityTypeSelect,
    onNext,
    onPrev,
    onSubmit,
    onCancel,
    fetchAllCustomers
  } = usePaymentForm();

  return (
    <PaymentForm
      form={form}
      currentStep={currentStep}
      isCashRegisterOpen={isCashRegisterOpen}
      isLoadingCashRegister={isLoadingCashRegister}
      cashRegister={cashRegister}
      isSubmitting={isSubmitting}
      customers={customers}
      isLoadingCustomers={isLoadingCustomers}
      legacyClients={legacyClients}
      isLoadingLegacyClients={isLoadingLegacyClients}
      clientOrders={clientOrders}
      isLoadingOrders={isLoadingOrders}
      customerSearch={customerSearch}
      orderSearch={orderSearch}
      legacyClientSearch={legacyClientSearch}
      selectedEntityType={selectedEntityType}
      showInstallments={showInstallments}
      showCheckFields={showCheckFields}
      onShowCheckFields={setShowCheckFields}
      onCustomerSearchChange={setCustomerSearch}
      onOrderSearchChange={setOrderSearch}
      onLegacyClientSearchChange={setLegacyClientSearch}
      onEntityTypeSelect={onEntityTypeSelect}
      onClientSelect={onClientSelect}
      onLegacyClientSelect={onLegacyClientSelect}
      onOrderSelect={onOrderSelect}
      onNext={onNext}
      onPrev={onPrev}
      onSubmit={onSubmit}
      onCancel={onCancel}
      fetchAllCustomers={fetchAllCustomers}
    />
  );
}