import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { OrderFormReturn } from "../../../app/types/form-types";
interface VisionSectionProps {
  eye: "left" | "right";
  form: OrderFormReturn;
}

export default function VisionSection({ eye, form }: VisionSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 border rounded-md bg-gray-50">
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
                placeholder="0.00"
                {...field}
                onChange={(e) => {
                  // Garantir que mesmo se o campo estiver vazio, um valor válido é definido
                  const value =
                    e.target.value === ""
                      ? 0
                      : Number.parseFloat(e.target.value);
                  field.onChange(value);
                }}
                value={field.value === undefined ? "0" : field.value.toString()}
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
                placeholder="0.00"
                {...field}
                onChange={(e) => {
                  const value =
                    e.target.value === ""
                      ? 0
                      : Number.parseFloat(e.target.value);
                  field.onChange(value);
                }}
                value={field.value === undefined ? "0" : field.value.toString()}
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
                step="1"
                min="0"
                max="180"
                placeholder="0"
                {...field}
                onChange={(e) => {
                  const value =
                    e.target.value === ""
                      ? 0
                      : Number.parseInt(e.target.value, 10);
                  field.onChange(value);
                }}
                value={field.value === undefined ? "0" : field.value.toString()}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
