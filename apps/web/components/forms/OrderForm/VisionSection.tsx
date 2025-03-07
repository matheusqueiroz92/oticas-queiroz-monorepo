import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface VisionSectionProps {
  eye: "left" | "right";
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  form: any;
}

export default function VisionSection({ eye, form }: VisionSectionProps) {
  const basePath = `prescriptionData.${eye}`;

  return (
    <div className="border rounded-md p-4 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FormField
          control={form.control}
          name={`${basePath}.sph`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Esf.</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.25"
                  {...field}
                  onChange={(e) =>
                    field.onChange(Number.parseFloat(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${basePath}.cyl`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cil.</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.25"
                  {...field}
                  onChange={(e) =>
                    field.onChange(Number.parseFloat(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${basePath}.axis`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eixo</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) =>
                    field.onChange(Number.parseFloat(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
