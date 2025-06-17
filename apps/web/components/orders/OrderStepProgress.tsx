import { CheckCircle2 } from "lucide-react";

interface Step {
  id: string;
  label: string;
}

interface OrderStepProgressProps {
  steps: Step[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  compact?: boolean;
}

export default function OrderStepProgress({ 
  steps, 
  currentStep, 
  setCurrentStep,
  compact = false
}: OrderStepProgressProps) {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  
  return (
    <div className="w-full">
      {/* Barra de progresso principal */}
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
        
        {/* Indicadores de etapas */}
        <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center px-1">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`
                w-4 h-4 rounded-full border-2 transition-all duration-300 cursor-pointer
                ${index <= currentStep 
                  ? 'bg-blue-600 border-blue-600 scale-110' 
                  : 'bg-white border-gray-300'
                }
              `}
              onClick={() => {
                if (index <= currentStep) {
                  setCurrentStep(index);
                }
              }}
            >
              {index < currentStep && (
                <CheckCircle2 className="w-3 h-3 text-white m-0.5" />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Labels das etapas */}
      <div className="flex justify-between mt-3">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className="flex flex-col items-center"
            style={{ width: `${100/steps.length}%` }}
          >
            <span className={`
              text-xs font-medium transition-colors duration-300
              ${index === currentStep 
                ? 'text-blue-600' 
                : index < currentStep 
                  ? 'text-green-600' 
                  : 'text-gray-500'
              }
            `}>
              {step.label}
            </span>
            {index === currentStep && (
              <div className="w-2 h-0.5 bg-blue-600 rounded-full mt-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}