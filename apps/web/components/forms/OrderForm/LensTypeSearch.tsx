import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UseFormReturn } from "react-hook-form";
import type { OrderFormValues } from "@/app/types/form-types";

// Definindo opções de tipo de lente para facilitar manutenção
const LENS_TYPES = [
  { value: "monofocal", label: "Monofocal" },
  { value: "bifocal", label: "Bifocal" },
  { value: "progressivo", label: "Progressivo" },
  { value: "ocupacional", label: "Ocupacional" },
  { value: "multifocal", label: "Multifocal" },
  { value: "fotocromática", label: "Fotocromática" },
  { value: "antirreflexo", label: "Antirreflexo" },
  { value: "outras", label: "Outras" },
];

interface LensTypeSelectionProps {
  form: UseFormReturn<OrderFormValues>;
}

export default function LensTypeSelection({ form }: LensTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<string>(
    form.getValues("lensType") || ""
  );

  // Manter state local sincronizado com o form
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "lensType") {
        setSelectedType(value.lensType || "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleLensTypeChange = (value: string) => {
    setSelectedType(value);
    form.setValue("lensType", value, { shouldValidate: true });
  };

  return (
    <Select value={selectedType} onValueChange={handleLensTypeChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o tipo de lente" />
      </SelectTrigger>
      <SelectContent>
        {LENS_TYPES.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            {type.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
