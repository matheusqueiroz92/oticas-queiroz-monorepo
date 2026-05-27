import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center rounded-full border px-2.5 py-0.5",
    "text-xs font-semibold transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: [
          "border-green-200 bg-green-100 text-green-800",
          "dark:border-green-800/60 dark:bg-green-900/30 dark:text-green-400",
        ].join(" "),
        warning: [
          "border-amber-200 bg-amber-100 text-amber-800",
          "dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-400",
        ].join(" "),
        info: [
          "border-blue-200 bg-blue-100 text-blue-800",
          "dark:border-blue-800/60 dark:bg-blue-900/30 dark:text-blue-400",
        ].join(" "),
        purple: [
          "border-purple-200 bg-purple-100 text-purple-800",
          "dark:border-purple-800/60 dark:bg-purple-900/30 dark:text-purple-400",
        ].join(" "),
        neutral: [
          "border-gray-200 bg-gray-100 text-gray-700",
          "dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
