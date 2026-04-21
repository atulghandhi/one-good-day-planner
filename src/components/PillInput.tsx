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

    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-full bg-card text-card-foreground placeholder:text-muted-foreground/70",
          "border border-border/60 outline-none transition-all",
          "shadow-soft focus-visible:shadow-pop focus-visible:-translate-y-[1px]",
          "focus-visible:ring-4",
          size === "lg"
            ? "px-5 py-3 my-6 text-base font-display tracking-tight placeholder:font-sans placeholder:tracking-normal"
            : "px-5 py-3 text-base",
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
