import React, { createContext, useContext, useState } from "react";
import type { Customer } from "@/app/_types/customer";
import type { Product } from "@/app/_types/product";
import { OrderFormValues } from "@/app/_types/form-types";

interface OrderDialogContextProps {
  selectedProducts: Product[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  selectedCustomer: Customer | null;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;
  selectedResponsible: Customer | null;
  setSelectedResponsible: React.Dispatch<React.SetStateAction<Customer | null>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  submittedOrder: any;
  setSubmittedOrder: React.Dispatch<React.SetStateAction<any>>;
  resetOrderDialog: () => void;
}

const OrderDialogContext = createContext<OrderDialogContextProps | undefined>(undefined);

export const useOrderDialog = () => {
  const ctx = useContext(OrderDialogContext);
  if (!ctx) throw new Error("useOrderDialog deve ser usado dentro de OrderDialogProvider");
  return ctx;
};

export const OrderDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedResponsible, setSelectedResponsible] = useState<Customer | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [submittedOrder, setSubmittedOrder] = useState<any>(null);

  const resetOrderDialog = () => {
    setSelectedProducts([]);
    setSelectedCustomer(null);
    setSelectedResponsible(null);
    setCurrentStep(0);
    setSubmittedOrder(null);
  };

  return (
    <OrderDialogContext.Provider
      value={{
        selectedProducts,
        setSelectedProducts,
        selectedCustomer,
        setSelectedCustomer,
        selectedResponsible,
        setSelectedResponsible,
        currentStep,
        setCurrentStep,
        submittedOrder,
        setSubmittedOrder,
        resetOrderDialog,
      }}
    >
      {children}
    </OrderDialogContext.Provider>
  );
}; 