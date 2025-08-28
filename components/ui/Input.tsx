import { cva, type VariantProps } from "class-variance-authority"
import { forwardRef } from "react"
import { twMerge } from "tailwind-merge"

const input = cva(
  [
    "w-full",
    "rounded-xl",
    "border",
    "px-4",
    "py-3",
    "text-sm",
    "transition-colors",
    "placeholder:text-gray-400",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-offset-2",
    "disabled:cursor-not-allowed",
    "disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        default: ["border-gray-300", "bg-white", "text-gray-900", "focus:border-blue-400", "focus:ring-blue-400/20"],
        error: ["border-red-400", "bg-red-50", "text-gray-900", "focus:border-red-400", "focus:ring-red-400/20"],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const label = cva(["block", "text-sm", "font-medium", "text-gray-700", "mb-1"])

const errorMessage = cva(["text-red-600", "text-xs", "mt-1"])

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof input> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, label: labelText, error, ...props }, ref) => {
    const hasError = Boolean(error)
    const inputVariant = hasError ? "error" : variant

    return (
      <div className="space-y-1">
        {labelText && (
          <label htmlFor={props.id} className={label()}>
            {labelText}
            {props.required && (
              <span className="ml-1 text-red-500" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          className={twMerge(input({ variant: inputVariant }), className)}
          aria-invalid={hasError}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${props.id}-error`} role="alert" className={errorMessage()}>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"
