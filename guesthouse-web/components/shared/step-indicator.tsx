import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  key: string | number;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  /** 1-indexed — matches how both migrated callers already tracked step state. */
  currentStep: number;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

// Replaces the two independently hand-rolled step-circle-and-connector
// wizards found in reservations/new (horizontal, 4 steps) and
// housekeeping/[id] (vertical, 3 steps) — component-inventory.md's own
// note that neither of those names appeared in the task brief's suggestion
// list, but the audit found the duplication anyway.
export function StepIndicator({ steps, currentStep, orientation = "horizontal", className }: StepIndicatorProps) {
  if (orientation === "vertical") {
    return (
      <div className={cn("space-y-0", className)}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isDone = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isLast = index === steps.length - 1;
          return (
            <div key={step.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <StepCircle isDone={isDone} isActive={isActive} stepNumber={stepNumber} />
                {!isLast && <div className={cn("w-0.5 flex-1 min-h-8", isDone ? "bg-success" : "bg-muted")} />}
              </div>
              <div className="pb-8">
                <p className={cn("text-sm font-bold", isActive ? "text-primary" : "text-foreground")}>{step.title}</p>
                {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <StepCircle isDone={isDone} isActive={isActive} stepNumber={stepNumber} size="sm" />
              <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn("flex-1 h-0.5 mb-4 mx-1", isDone ? "bg-primary" : "bg-muted")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepCircle({
  isDone,
  isActive,
  stepNumber,
  size = "default",
}: {
  isDone: boolean;
  isActive: boolean;
  stepNumber: number;
  size?: "default" | "sm";
}) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        isDone && "bg-success text-success-foreground",
        isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
        !isDone && !isActive && "bg-muted text-muted-foreground"
      )}
    >
      {isDone ? <Check className="h-4 w-4" aria-hidden="true" /> : stepNumber}
    </div>
  );
}
