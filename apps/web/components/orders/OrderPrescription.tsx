import type { Product } from "@/app/_types/product";
import type { OrderFormReturn } from "@/app/_types/form-types";
import PrescriptionForm from "@/components/orders/PrescriptionForm";
import OrderSummary from "./OrderSummary";

interface OrderPrescriptionProps {
  form: OrderFormReturn;
  selectedProducts: Product[];
}

export default function OrderPrescription({ form, selectedProducts }: OrderPrescriptionProps) {
  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      <div className="col-span-9">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--primary-blue)] border-b pb-1">
            Informações de Prescrição
          </h3>
          <PrescriptionForm form={form} />
        </div>
      </div>
      
      <div className="col-span-3">
        <OrderSummary form={form} selectedProducts={selectedProducts} />
      </div>
    </div>
  );
}