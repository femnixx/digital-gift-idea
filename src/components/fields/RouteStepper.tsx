'use client'

interface RouteStepperProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export function RouteStepper({
  currentStep,
  totalSteps,
  stepLabels,
}: RouteStepperProps) {
  return (
    <div
      role="navigation"
      aria-label="Builder progress"
      className="relative mb-8"
    >
      <svg
        className="absolute inset-0 -z-10 w-full h-[2px] bg-stripe opacity-40 pointer-events-none"
        preserveAspectRatio="none"
      >
        <path
          d="M0 1 Q 50 0 100 1"
          fill="none"
          stroke="currentColor"
          strokeDasharray="8 4"
        />
      </svg>
      <div className="flex items-end justify-between gap-1">
        {stepLabels.map((label, i) => {
          const done = i + 1 < currentStep
          const active = i + 1 === currentStep
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={i + 1 > currentStep}
                aria-label={`Step ${i + 1}: ${label}`}
                className={`relative w-10 h-10 rounded-full border border-line flex items-center justify-center text-xs font-mono font-medium transition-all ${
                  done
                    ? 'bg-accent text-white border-accent shadow-btn'
                    : active
                      ? 'bg-surface-2 text-accent-text border-accent shadow-btn'
                      : 'bg-surface text-text-muted border-line'
                }`}
              >
                {i + 1}
                {active && (
                  <span className="absolute -top-2 -right-2 w-2 h-2 rounded-full bg-accent shadow-btn" />
                )}
              </button>
              <span className="font-mono text-[10px] uppercase tracking-wider">
                {done ? 'done' : active ? 'current' : label.toUpperCase().slice(0, 3)}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-2 font-mono text-xs text-text-muted text-center">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  )
}
