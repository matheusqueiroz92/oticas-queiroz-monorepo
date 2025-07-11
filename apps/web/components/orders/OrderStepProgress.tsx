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
  // compact = false
}: OrderStepProgressProps) {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  
  return (
    <div className="w-full">
      {/* Barra de progresso principal */}
      <div className="relative w-full h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-full overflow-hidden shadow-sm">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-800 via-blue-700 to-blue-900 rounded-full transition-all duration-500 ease-out shadow-md"
          style={{ width: `${progressPercentage}%` }}
        />
        {/* Indicadores de etapas */}
        <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center px-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`
                w-7 h-7 flex items-center justify-center rounded-full border-2 transition-all duration-300 cursor-pointer shadow-md
                ${index < currentStep 
                  ? 'bg-blue-800 border-blue-800 scale-110' 
                  : index === currentStep
                    ? 'bg-blue-900 border-blue-900 scale-110'
                    : 'bg-white border-gray-300'
                }
              `}
              onClick={() => {
                if (index <= currentStep) {
                  setCurrentStep(index);
                }
              }}
            >
              {index < currentStep ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <span className={`text-xs font-bold ${index === currentStep ? 'text-white' : 'text-gray-400'}`}>{index + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Labels das etapas */}
      <div className="flex justify-between mt-4">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className="flex flex-col items-center"
            style={{ width: `${100/steps.length}%` }}
          >
            <span className={`
              text-sm font-semibold transition-colors duration-300
              ${index === currentStep 
                ? 'text-blue-900' 
                : index < currentStep 
                  ? 'text-blue-800' 
                  : 'text-gray-400'
              }
            `}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}