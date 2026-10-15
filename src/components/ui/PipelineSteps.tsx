import React from "react";

export interface PipelineStep {
  id: number;
  name: string;
}

export const DEFAULT_PIPELINE_STEPS: PipelineStep[] = [
  { id: 1, name: "Reading documents" },
  { id: 2, name: "Checking the math" },
  { id: 3, name: "Understanding entries" },
  { id: 4, name: "Matching bank ↔ books" },
  { id: 5, name: "Checking invoices" },
  { id: 6, name: "Preparing questions" },
];

interface PipelineStepsProps {
  activeStep?: number; // 0 = idle, 1-6 = running step, 7+ = all done
  steps?: PipelineStep[];
  className?: string;
}

export function PipelineSteps({
  activeStep = 0,
  steps = DEFAULT_PIPELINE_STEPS,
  className = "",
}: PipelineStepsProps) {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {steps.map((step) => {
        const isCurrent = activeStep === step.id;
        const isDone = activeStep > step.id;

        return (
          <span
            key={step.id}
            className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold rounded-full px-3 py-1 transition-all duration-300 border ${
              isCurrent
                ? "text-[#4338CA] border-[#DCD9F8] bg-[#EEEDFB]"
                : isDone
                ? "text-[#188A54] bg-[#E7F5EE] border-[#CBE6D8]"
                : "text-[#A8A296] bg-[#FAF9F6] border-[#F1EFE9]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                isCurrent
                  ? "bg-[#4F46E5] animate-[blink_1s_infinite]"
                  : isDone
                  ? "bg-[#188A54]"
                  : "bg-[#D8D3C9]"
              }`}
            />
            <span>{step.name}</span>
          </span>
        );
      })}
    </div>
  );
}

export default PipelineSteps;
