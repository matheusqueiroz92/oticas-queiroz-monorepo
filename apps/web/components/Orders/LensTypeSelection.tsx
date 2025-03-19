import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";

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
  form: UseFormReturn<any>;
}

export default function LensTypeSelection({ form }: LensTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState(
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
    <FormField
      control={form.control}
      name="lensType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tipo de Lente</FormLabel>
          <Select onValueChange={handleLensTypeChange} value={selectedType}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de lente" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {LENS_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}