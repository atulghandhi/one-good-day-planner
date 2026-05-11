import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  tone?: "mit" | "should" | "could" | "neutral";
  size?: "lg" | "md";
  done?: boolean;
};

export const PillInput = forwardRef<HTMLInputElement, Props>(
  ({ className, tone = "neutral", size = "md", done = false, ...props }, ref) => {
    const toneRing = {
      mit: "focus-visible:ring-[color:var(--mit)]/60",
      should: "focus-visible:ring-[color:var(--should)]/60",
      could: "focus-visible:ring-[color:var(--could)]/60",
      neutral: "focus-visible:ring-primary/40",
    }[tone];

    const toneText = {
      mit: "text-[color:var(--mit-foreground)] placeholder:text-[color:color-mix(in_oklab,var(--mit-foreground)_55%,transparent)]",
      should:
        "text-[color:var(--should-foreground)] placeholder:text-[color:color-mix(in_oklab,var(--should-foreground)_55%,transparent)]",
      could:
        "text-[color:var(--could-foreground)] placeholder:text-[color:color-mix(in_oklab,var(--could-foreground)_55%,transparent)]",
      neutral: "text-card-foreground placeholder:text-muted-foreground/70",
    }[tone];

    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-full bg-card",
          "border border-border/60 outline-none transition-all",
          "shadow-soft focus-visible:shadow-pop focus-visible:-translate-y-[1px]",
          "focus-visible:ring-4",
          "font-sans",
          size === "lg"
            ? "px-5 py-3 my-6 text-lg font-medium tracking-tight"
            : "px-5 py-3 text-base",
          toneText,
          toneRing,
          done && "line-through text-muted-foreground/70 bg-muted/40 shadow-none",
          className,
        )}
        {...props}
      />
    );
  },
);
PillInput.displayName = "PillInput";
