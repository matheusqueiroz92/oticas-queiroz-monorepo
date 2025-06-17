"use client";

import { usePayments } from "@/hooks/usePayments";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { MercadoPagoPaymentFlow } from "@/components/mercado-pago/MercadoPagoPaymentFlow";

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
    fetchAllCustomers,
    // Novas propriedades e funções para o Mercado Pago
    showMercadoPagoFlow,
    orderIdForMercadoPago,
    orderAmountForMercadoPago,
    handleSelectMercadoPago,
    handleMercadoPagoSuccess,
    handleMercadoPagoFailure,
    handleMercadoPagoCancel
  } = usePaymentForm();

  return (
    <>
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
        // Novas propriedades para o Mercado Pago
        showMercadoPagoOption={true}
        onSelectMercadoPago={handleSelectMercadoPago}
      />
      
      {/* Componente de fluxo do Mercado Pago que será exibido quando necessário */}
      {showMercadoPagoFlow && orderIdForMercadoPago && (
        <MercadoPagoPaymentFlow
          orderId={orderIdForMercadoPago}
          orderAmount={orderAmountForMercadoPago}
          orderNumber={
            clientOrders.find(order => order._id === orderIdForMercadoPago)?.serviceOrder ||
            orderIdForMercadoPago.substring(0, 8)
          }
          onPaymentSuccess={handleMercadoPagoSuccess}
          onPaymentFailure={handleMercadoPagoFailure}
          onPaymentCancel={handleMercadoPagoCancel}
        />
      )}
    </>
  );
}