"use client";

import { usePaymentForm } from "@/hooks/usePaymentForm";
import { PaymentForm } from "@/components/Payments/PaymentForm";

export default function NewPaymentPage() {
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
    orders,
    isLoadingOrders,
    customerSearch,
    orderSearch,
    legacyClientSearch,
    selectedEntityType,
    showInstallments,
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
      cashRegister={cashRegister ?? null}
      isSubmitting={isSubmitting}
      customers={customers}
      isLoadingCustomers={isLoadingCustomers}
      legacyClients={legacyClients}
      isLoadingLegacyClients={isLoadingLegacyClients}
      orders={orders}
      isLoadingOrders={isLoadingOrders}
      customerSearch={customerSearch}
      orderSearch={orderSearch}
      legacyClientSearch={legacyClientSearch}
      selectedEntityType={selectedEntityType}
      showInstallments={showInstallments}
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