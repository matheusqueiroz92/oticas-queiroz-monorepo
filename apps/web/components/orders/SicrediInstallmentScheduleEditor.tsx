"use client";

import { useEffect } from "react";
import type { OrderFormReturn } from "@/app/_types/order";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/app/_utils/formatters";
import {
  buildEqualInstallmentSchedule,
  validateScheduleSum,
  type SicrediInstallmentsPlan,
} from "@/app/_utils/sicrediInstallmentUtils";

interface SicrediInstallmentScheduleEditorProps {
  form: OrderFormReturn;
}

export default function SicrediInstallmentScheduleEditor({
  form,
}: SicrediInstallmentScheduleEditorProps) {
  const finalPrice = form.watch("finalPrice") || 0;
  const paymentEntry = form.watch("paymentEntry") || 0;
  const installments = form.watch("installments") || 1;
  const deliveryDate = form.watch("deliveryDate");
  const schedulePlan = form.watch("sicrediInstallments") as SicrediInstallmentsPlan | undefined;
  const remaining = Math.max(0, finalPrice - paymentEntry);

  useEffect(() => {
    if (installments < 1 || remaining <= 0) return;
    const firstDue =
      deliveryDate ||
      form.getValues("orderDate") ||
      new Date().toISOString().split("T")[0];
    const current = form.getValues("sicrediInstallments") as SicrediInstallmentsPlan | undefined;
    if (
      !current ||
      current.total !== installments ||
      current.schedule.length !== installments
    ) {
      form.setValue(
        "sicrediInstallments",
        buildEqualInstallmentSchedule(remaining, installments, firstDue),
        { shouldDirty: true }
      );
    }
  }, [installments, remaining, deliveryDate, form]);

  if (remaining <= 0 || installments < 1) {
    return null;
  }

  const schedule = schedulePlan?.schedule ?? [];
  const sumValid = validateScheduleSum(remaining, schedule);

  const updateScheduleItem = (
    index: number,
    field: "dueDate" | "amount",
    value: string
  ) => {
    const plan = form.getValues("sicrediInstallments") as SicrediInstallmentsPlan;
    if (!plan?.schedule?.[index]) return;
    const next = {
      ...plan,
      schedule: plan.schedule.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "amount" ? Number.parseFloat(value) || 0 : value,
            }
          : item
      ),
    };
    form.setValue("sicrediInstallments", next, { shouldDirty: true });
  };

  return (
    <div className="space-y-2 rounded border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
      <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
        Cronograma de boletos SICREDI ({installments}x · saldo {formatCurrency(remaining)})
      </p>
      <div className="space-y-2">
        {schedule.map((item, index) => (
          <div key={index} className="grid grid-cols-3 gap-2 items-center text-xs">
            <span className="font-medium">Parcela {index + 1}</span>
            <Input
              type="date"
              value={item.dueDate}
              onChange={(e) => updateScheduleItem(index, "dueDate", e.target.value)}
              className="h-8 text-xs col-span-1"
            />
            <Input
              type="number"
              step="0.01"
              min={0}
              value={item.amount}
              onChange={(e) => updateScheduleItem(index, "amount", e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        ))}
      </div>
      {!sumValid && (
        <p className="text-xs text-destructive">
          A soma das parcelas deve ser igual ao saldo ({formatCurrency(remaining)}).
        </p>
      )}
    </div>
  );
}
