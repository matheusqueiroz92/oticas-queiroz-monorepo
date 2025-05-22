"use client";

import { useState } from "react";
import { usePayments } from "@/hooks/usePayments";
import {
  translatePaymentType,
  translatePaymentMethod,
  translatePaymentStatus,
  getPaymentTypeClass,
  getPaymentStatusClass,
} from "@/app/_utils/formatters";
import { PaymentsList } from "@/components/Payments/PaymentsList";
import { PageTitle } from "@/components/PageTitle";
import { customBadgeStyles } from "@/app/_utils/custom-badge-styles";
import { PaymentStatus, PaymentType } from "@/app/_types/payment";

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | PaymentType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>("all");

  const {
    payments,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalPayments,
    setCurrentPage,
    updateFilters,
    handleCancelPayment,
    navigateToPaymentDetails,
    navigateToCreatePayment,
  } = usePayments();

  const applySearch = () => {
    const filters: Record<string, unknown> = { search };

    if (typeFilter !== "all") {
      filters.type = typeFilter;
    }

    if (statusFilter !== "all") {
      filters.status = statusFilter;
    }

    updateFilters(filters);
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    updateFilters({});
  };

  const showEmptyState = !isLoading && !error && payments.length === 0;

  return (
    <>
      <style jsx global>{customBadgeStyles}</style>
      
      <div className="space-y-2 max-w-auto mx-auto p-1 md:p-2">
        <PageTitle
          title="Pagamentos"
          description="Lista de pagamentos da loja"
        />

        <PaymentsList 
          payments={payments}
          isLoading={isLoading}
          error={error ? error.toString() : null}
          search={search}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalPayments}
          pageSize={payments.length}
          showEmptyState={showEmptyState}
          setSearch={setSearch}
          setTypeFilter={setTypeFilter}
          setStatusFilter={setStatusFilter}
          applySearch={applySearch}
          clearFilters={clearFilters}
          cancelPayment={handleCancelPayment}
          navigateToPaymentDetails={navigateToPaymentDetails}
          navigateToNewPayment={navigateToCreatePayment}
          setCurrentPage={setCurrentPage}
          translatePaymentType={translatePaymentType}
          translatePaymentMethod={translatePaymentMethod}
          translatePaymentStatus={translatePaymentStatus}
          getPaymentTypeClass={getPaymentTypeClass}
          getPaymentStatusClass={getPaymentStatusClass}
        />
      </div>
    </>
  );
}