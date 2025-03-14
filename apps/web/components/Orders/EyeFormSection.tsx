import VisionSection from "./VisionSection";
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
    <div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <VisionSection eye={eye} form={form} />
    </div>
  );
}
