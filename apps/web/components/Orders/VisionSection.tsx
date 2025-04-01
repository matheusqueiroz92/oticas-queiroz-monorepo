import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { OrderFormReturn } from "@/app/types/form-types";

interface VisionSectionProps {
  eye: "left" | "right";
  form: OrderFormReturn;
}

export default function VisionSection({ eye, form }: VisionSectionProps) {
  // Modificação na função handleNumericInput para permitir valores vazios
  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number | undefined) => void
  ) => {
    const value = e.target.value;
    
    // Se o campo estiver vazio, definimos como undefined (em vez de 0)
    if (value === "") {
      onChange(undefined);
      return;
    }
    
    // Caso contrário, continuamos com a lógica de parsing numérico
    const numValue = Number.parseFloat(value);
    onChange(Number.isNaN(numValue) ? undefined : numValue);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <FormField
        control={form.control}
        name={`prescriptionData.${eye}Eye.sph`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Esf.</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.25"
                {...field}
                // Garantir que "0" não seja exibido como valor inicial
                value={field.value === 0 && field.value !== undefined ? "" : field.value ?? ""}
                onChange={(e) => handleNumericInput(e, field.onChange)}
                aria-label={`Esférico do olho ${eye === "left" ? "esquerdo" : "direito"}`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`prescriptionData.${eye}Eye.cyl`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cil.</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.25"
                {...field}
                // Garantir que "0" não seja exibido como valor inicial
                value={field.value === 0 && field.value !== undefined ? "" : field.value ?? ""}
                onChange={(e) => handleNumericInput(e, field.onChange)}
                aria-label={`Cilíndrico do olho ${eye === "left" ? "esquerdo" : "direito"}`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`prescriptionData.${eye}Eye.axis`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Eixo</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="180"
                {...field}
                // Garantir que "0" não seja exibido como valor inicial
                value={field.value === 0 && field.value !== undefined ? "" : field.value ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  
                  // Se o campo estiver vazio, definimos como undefined
                  if (value === "") {
                    field.onChange(undefined);
                    return;
                  }
                  
                  // Validação de min/max para o eixo
                  const numValue = Number.parseInt(value, 10);
                  if (!Number.isNaN(numValue)) {
                    const boundedValue = Math.min(180, Math.max(0, numValue));
                    field.onChange(boundedValue);
                  }
                }}
                aria-label={`Eixo do olho ${eye === "left" ? "esquerdo" : "direito"}`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`prescriptionData.${eye}Eye.pd`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>D.P.</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.5"
                min="0"
                {...field}
                // Garantir que "0" não seja exibido como valor inicial
                value={field.value === 0 && field.value !== undefined ? "" : field.value ?? ""}
                onChange={(e) => handleNumericInput(e, field.onChange)}
                aria-label={`PD do olho ${eye === "left" ? "esquerdo" : "direito"}`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}