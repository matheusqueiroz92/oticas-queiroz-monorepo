import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import EyeFormSection from "./EyeFormSection";
import type { OrderFormReturn } from "../../app/types/form-types";

interface PrescriptionFormProps {
  form: OrderFormReturn;
}

export default function PrescriptionForm({ form }: PrescriptionFormProps) {
  // Armazenar os valores de input como strings para manter comportamento consistente
  const [ndInput, setNdInput] = useState<string>("");
  const [ocInput, setOcInput] = useState<string>("");
  const [additionInput, setAdditionInput] = useState<string>("");

  // Inicializar os valores dos inputs baseados nos valores do formulário
  useEffect(() => {
    // Só inicializar se não for 0 ou undefined
    const nd = form.getValues("prescriptionData.nd");
    if (nd !== 0 && nd !== undefined) {
      setNdInput(nd.toString());
    }

    const oc = form.getValues("prescriptionData.oc");
    if (oc !== 0 && oc !== undefined) {
      setOcInput(oc.toString());
    }

    const addition = form.getValues("prescriptionData.addition");
    if (addition !== 0 && addition !== undefined) {
      setAdditionInput(addition.toString());
    }
  }, [form]);

  // Função para lidar com inputs numéricos de forma consistente
  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number | undefined) => void,
    setInputState: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const inputValue = e.target.value;
    setInputState(inputValue);
    
    // Se o campo estiver vazio, definimos como undefined
    if (inputValue === "") {
      onChange(undefined);
      return;
    }
    
    // Caso contrário, convertemos para número
    const numValue = Number.parseFloat(inputValue);
    if (!Number.isNaN(numValue)) {
      onChange(numValue);
    }
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
                    type="text"
                    inputMode="decimal"
                    value={ndInput}
                    onChange={(e) => 
                      handleNumericInput(e, field.onChange, setNdInput)
                    }
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
                    type="text"
                    inputMode="decimal"
                    value={ocInput}
                    onChange={(e) => 
                      handleNumericInput(e, field.onChange, setOcInput)
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
                    type="text"
                    inputMode="decimal"
                    value={additionInput}
                    onChange={(e) => 
                      handleNumericInput(e, field.onChange, setAdditionInput)
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