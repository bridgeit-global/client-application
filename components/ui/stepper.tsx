"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
    id: string
    title: string
    description: string
    status: "complete" | "current" | "upcoming"
}

interface StepperProps {
    steps: Step[]
    currentStep: number
    onStepClick?: (stepIndex: number) => void
    className?: string
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
    return (
        <nav aria-label="Progress" className={cn("w-full", className)}>
            <ol className="flex items-center justify-between w-full">
                {steps.map((step, stepIdx) => (
                    <li key={step.id} className={cn("relative flex-1", stepIdx !== steps.length - 1 ? "pr-2 sm:pr-8" : "")}>
                        {/* Connector line */}
                        {stepIdx !== steps.length - 1 && (
                            <div
                                className="absolute inset-0 flex items-center"
                                aria-hidden="true"
                            >
                                <div
                                    className={cn(
                                        "h-0.5 w-full",
                                        step.status === "complete" ? "bg-green-600" : "bg-gray-200"
                                    )}
                                />
                            </div>
                        )}

                        {/* Step content */}
                        <div
                            className={cn(
                                "relative flex h-8 w-8 items-center justify-center rounded-full border-2 mx-auto",
                                step.status === "complete"
                                    ? "border-green-600 bg-green-600"
                                    : step.status === "current"
                                        ? "border-blue-600 bg-white"
                                        : "border-gray-200 bg-white",
                                onStepClick && step.status !== "upcoming"
                                    ? "cursor-pointer hover:border-blue-500"
                                    : ""
                            )}
                            onClick={() => onStepClick && step.status !== "upcoming" && onStepClick(stepIdx)}
                        >
                            {step.status === "complete" ? (
                                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            ) : (
                                <span
                                    className={cn(
                                        "text-xs sm:text-sm font-medium",
                                        step.status === "current" ? "text-blue-600" : "text-gray-500"
                                    )}
                                >
                                    {stepIdx + 1}
                                </span>
                            )}
                        </div>

                        {/* Step title and description */}
                        <div className="mt-2 text-center px-1">
                            <p
                                className={cn(
                                    "text-xs sm:text-sm font-medium leading-tight",
                                    step.status === "current" ? "text-blue-600" : "text-gray-900"
                                )}
                            >
                                {step.title}
                            </p>
                            <p className="text-xs text-gray-500 leading-tight hidden sm:block">{step.description}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    )
}
