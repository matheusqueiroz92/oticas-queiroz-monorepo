import VisionSection from "./VisionSection";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import type { OrderFormReturn } from "../../app/types/form-types";

interface EyeFormSectionProps {
  eye: "left" | "right";
  title: string;
  form: OrderFormReturn;
}

export default function EyeFormSection({
  eye,
  title,
  form,
}: EyeFormSectionProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <VisionSection eye={eye} form={form} />
      </CardContent>
    </Card>
  );
}