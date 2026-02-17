/**
 * shadcn/ui – Badge
 */
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-500",
        warning: "border-transparent bg-amber-50 text-amber-800 dark:bg-amber-500/20 dark:text-amber-500",
        info: "border-transparent bg-sky-50 text-sky-800 dark:bg-sky-500/20 dark:text-sky-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
