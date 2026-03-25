import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  shortTitle: string;
}

interface StepperVisuelProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function StepperVisuel({ steps, currentStep, onStepClick }: StepperVisuelProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-500">Progression</span>
        <span className="font-medium text-navy">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stepper horizontal */}
      <div className="flex items-center justify-between mt-6">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isFuture = index > currentStep;
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2 cursor-pointer',
                    isCompleted && 'bg-teal border-teal text-white hover:bg-teal-light',
                    isActive && 'bg-gold border-gold text-white shadow-lg shadow-gold/30',
                    isFuture && 'bg-white border-gray-300 text-gray-500 hover:border-teal hover:text-teal'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </button>
                {/* Label - hidden on small screens */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center hidden sm:block',
                    isActive && 'text-gold font-bold',
                    isCompleted && 'text-teal',
                    isFuture && 'text-gray-500'
                  )}
                >
                  {step.shortTitle}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 h-0.5 mt-[-1.25rem] sm:mt-[-2rem]">
                  <div
                    className={cn(
                      'h-full rounded transition-colors duration-300',
                      isCompleted ? 'bg-teal' : 'bg-gray-200'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
