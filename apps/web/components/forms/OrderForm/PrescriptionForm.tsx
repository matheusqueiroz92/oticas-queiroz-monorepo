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

interface PrescriptionFormProps {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  form: any;
}

export default function PrescriptionForm({ form }: PrescriptionFormProps) {
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="presciptionData.nd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DNP</FormLabel>
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
            name="prescriptionData.addition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adição</FormLabel>
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
        </div>
      </CardContent>
    </Card>
  );
}
