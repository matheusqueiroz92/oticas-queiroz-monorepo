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
import type { OrderFormReturn } from "../../app/_types/form-types";

interface PrescriptionFormProps {
  form: OrderFormReturn;
}

export default function PrescriptionForm({ form }: PrescriptionFormProps) {
  const [ndInput, setNdInput] = useState<string>("");
  const [ocInput, setOcInput] = useState<string>("");
  const [additionInput, setAdditionInput] = useState<string>("");
  const [bridgeInput, setBridgeInput] = useState<string>("");
  const [rimInput, setRimInput] = useState<string>("");
  const [avInput, setAvInput] = useState<string>("");
  const [amInput, setAmInput] = useState<string>("");

  useEffect(() => {
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

  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number | undefined) => void,
    setInputState: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const inputValue = e.target.value;
    setInputState(inputValue);
    
    if (inputValue === "") {
      onChange(undefined);
      return;
    }
    
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="prescriptionData.bridge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ponte</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={bridgeInput}
                    onChange={(e) => 
                      handleNumericInput(e, field.onChange, setBridgeInput)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prescriptionData.rim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aro</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={rimInput}
                    onChange={(e) => 
                      handleNumericInput(e, field.onChange, setRimInput)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prescriptionData.vh"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AV</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={avInput}
                    onChange={(e) => 
                      handleNumericInput(e, field.onChange, setAvInput)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prescriptionData.sh"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AM</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={amInput}
                    onChange={(e) => 
                      handleNumericInput(e, field.onChange, setAmInput)
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