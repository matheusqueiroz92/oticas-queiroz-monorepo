import type { Product } from "@/app/_types/product";
import type { OrderFormReturn } from "@/app/_types/form-types";
import PrescriptionForm from "@/components/Orders/PrescriptionForm";
import OrderSummary from "./OrderSummary";

interface OrderPrescriptionProps {
  form: OrderFormReturn;
  selectedProducts: Product[];
}

export default function OrderPrescription({ form, selectedProducts }: OrderPrescriptionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium border-b pb-1">Informações de Prescrição</h3>
          <PrescriptionForm form={form} />
        </div>
      </div>
      
      <div className="lg:col-span-1">
        <OrderSummary form={form} selectedProducts={selectedProducts} />
      </div>
    </div>
  );
}