import { CheckCircle2 } from "lucide-react";

interface Step {
  id: string;
  label: string;
}

interface OrderStepProgressProps {
  steps: Step[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export default function OrderStepProgress({ 
  steps, 
  currentStep, 
  setCurrentStep 
}: OrderStepProgressProps) {
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div 
            key={step.id} 
            className="flex flex-col items-center"
            style={{ width: `${100/steps.length}%` }}
          >
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full 
              ${index < currentStep ? 'bg-green-500 text-white' : 
                index === currentStep ? 'bg-primary text-white' : 
                'bg-gray-200 text-gray-500'}
              ${index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}
            `}
            onClick={() => {
              if (index <= currentStep) {
                setCurrentStep(index);
              }
            }}
            >
              {index < currentStep ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className={`
              text-xs mt-1 text-center
              ${index === currentStep ? 'text-primary font-medium' : 'text-gray-500'}
            `}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      <div className="relative w-full h-1 bg-gray-200 rounded-full mt-2">
        <div 
          className="absolute top-0 left-0 h-1 bg-primary rounded-full"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}