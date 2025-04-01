import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import EyeFormSection from "./EyeFormSection";
import type { OrderFormReturn } from "../../app/types/form-types";

interface PrescriptionFormProps {
  form: OrderFormReturn;
}

export default function PrescriptionForm({ form }: PrescriptionFormProps) {
  // Função para lidar com inputs numéricos, permitindo valores vazios
  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number | undefined) => void
  ) => {
    const value = e.target.value;
    
    // Se o campo estiver vazio, definimos como undefined
    if (value === "") {
      onChange(undefined);
      return;
    }
    
    // Caso contrário, convertemos para número
    const numValue = Number.parseFloat(value);
    onChange(Number.isNaN(numValue) ? undefined : numValue);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da Receita</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="prescriptionData.doctorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Médico</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do médico" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prescriptionData.clinicName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Clínica</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da clínica" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prescriptionData.appointmentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Consulta</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <EyeFormSection eye="left" title="Olho Esquerdo" form={form} />
        <EyeFormSection eye="right" title="Olho Direito" form={form} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="prescriptionData.nd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>D.N.P.</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.25"
                    {...field}
                    // Garantir que "0" não seja exibido como valor inicial
                    value={field.value === 0 && field.value !== undefined ? "" : field.value ?? ""}
                    onChange={(e) => handleNumericInput(e, field.onChange)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="prescriptionData.oc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>C.O.</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.25"
                    {...field}
                    // Garantir que "0" não seja exibido como valor inicial
                    value={field.value === 0 && field.value !== undefined ? "" : field.value ?? ""}
                    onChange={(e) => handleNumericInput(e, field.onChange)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prescriptionData.addition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adição</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.25"
                    {...field}
                    // Garantir que "0" não seja exibido como valor inicial
                    value={field.value === 0 && field.value !== undefined ? "" : field.value ?? ""}
                    onChange={(e) => handleNumericInput(e, field.onChange)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}