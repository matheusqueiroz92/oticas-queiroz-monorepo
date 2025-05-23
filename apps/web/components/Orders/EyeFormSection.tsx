import VisionSection from "./VisionSection";
import type { OrderFormReturn } from "../../app/_types/form-types";

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
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 border-b pb-1">
        {title}
      </h4>
      <VisionSection eye={eye} form={form} />
    </div>
  );
}