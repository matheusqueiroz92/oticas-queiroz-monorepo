import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface VisionSectionProps {
  type: "near" | "far";
  eye: "left" | "right";
  title: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  form: any;
}

export default function VisionSection({
  type,
  eye,
  title,
  form,
}: VisionSectionProps) {
  const basePath = `prescriptionData.${eye}Eye.${type}`;

  return (
    <div className="border rounded-md p-4 mb-4">
      <h4 className="text-md font-medium mb-2">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FormField
          control={form.control}
          name={`${basePath}.sph`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>SPH</FormLabel>
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
              <FormLabel>CYL</FormLabel>
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
              <FormLabel>AXIS</FormLabel>
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

        <FormField
          control={form.control}
          name={`${basePath}.pd`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>PD</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.5"
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
