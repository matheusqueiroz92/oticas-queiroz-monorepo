import VisionSection from "./VisionSection";

interface EyeFormSectionProps {
  eye: "left" | "right";
  title: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  form: any;
}

export default function EyeFormSection({
  eye,
  title,
  form,
}: EyeFormSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <VisionSection eye={eye} title="Visão de Perto" form={form} />
    </div>
  );
}
