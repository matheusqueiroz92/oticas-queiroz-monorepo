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
  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number) => void
  ) => {
    const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value);
    onChange(Number.isNaN(value) ? 0 : value);
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
                onChange={(e) => {
                  const value =
                    e.target.value === ""
                      ? 0
                      : Math.min(
                          180,
                          Math.max(0, Number.parseInt(e.target.value, 10))
                        );
                  field.onChange(Number.isNaN(value) ? 0 : value);
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