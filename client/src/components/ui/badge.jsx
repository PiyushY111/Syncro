import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-600 text-white shadow hover:bg-blue-600/80 dark:bg-blue-600 dark:text-white",
        secondary:
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-zinc-800 dark:text-zinc-100",
        destructive:
          "border-transparent bg-rose-500/15 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/50",
        outline: "text-slate-700 border-slate-200 dark:text-zinc-300 dark:border-zinc-700",
        success:
          "border-emerald-200 bg-emerald-500/15 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50",
        warning:
          "border-amber-200 bg-amber-500/15 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50",
        info:
          "border-sky-200 bg-sky-500/15 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
