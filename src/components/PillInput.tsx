import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  tone?: "mit" | "should" | "could" | "neutral";
  size?: "lg" | "md";
};

export const PillInput = forwardRef<HTMLInputElement, Props>(
  ({ className, tone = "neutral", size = "md", ...props }, ref) => {
    const toneRing = {
      mit: "focus-visible:ring-[color:var(--mit)]/60",
      should: "focus-visible:ring-[color:var(--should)]/60",
      could: "focus-visible:ring-[color:var(--could)]/60",
      neutral: "focus-visible:ring-primary/40",
    }[tone];

    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-full bg-card text-card-foreground placeholder:text-muted-foreground/70",
          "border border-border/60 outline-none transition-all",
          "shadow-soft focus-visible:shadow-pop focus-visible:-translate-y-[1px]",
          "focus-visible:ring-4",
          size === "lg"
            ? "px-7 py-5 text-2xl md:text-3xl font-display tracking-tight"
            : "px-5 py-3 text-base",
          toneRing,
          className,
        )}
        {...props}
      />
    );
  },
);
PillInput.displayName = "PillInput";
