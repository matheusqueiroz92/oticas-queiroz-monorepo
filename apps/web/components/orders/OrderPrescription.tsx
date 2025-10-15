import type { Product } from "@/app/_types/product";
import type { OrderFormReturn } from "@/app/_types/form-types";
import PrescriptionForm from "@/components/orders/PrescriptionForm";
import OrderSummary from "./OrderSummary";
import { Badge } from "@/components/ui/badge";

interface OrderPrescriptionProps {
  form: OrderFormReturn;
  selectedProducts: Product[];
}

export default function OrderPrescription({ form, selectedProducts }: OrderPrescriptionProps) {
  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      <div className="col-span-9">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-1">
            <h3 className="text-sm font-medium text-[var(--primary-blue)]">
              Informações de Prescrição
            </h3>
            <Badge variant="outline" className="text-xs text-gray-500">
              Opcional
            </Badge>
          </div>
          <PrescriptionForm form={form} />
        </div>
      </div>
      
      <div className="col-span-3">
        <OrderSummary form={form} selectedProducts={selectedProducts} />
      </div>
    </div>
  );
}