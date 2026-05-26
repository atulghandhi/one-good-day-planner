import { forwardRef, useCallback, useEffect, useRef, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

type PillTone = "mit" | "should" | "could" | "neutral";
type PillSize = "lg" | "md";

function pillToneClasses(tone: PillTone) {
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

  return { toneRing, toneText };
}

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  tone?: PillTone;
  size?: PillSize;
  done?: boolean;
};

export const PillInput = forwardRef<HTMLInputElement, Props>(
  ({ className, tone = "neutral", size = "md", done = false, ...props }, ref) => {
    const { toneRing, toneText } = pillToneClasses(tone);

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

type TextAreaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> & {
  tone?: PillTone;
  size?: PillSize;
  done?: boolean;
  maxLines?: number;
  onMaxLinesExceeded?: () => void;
};

export const PillTextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      tone = "neutral",
      size = "md",
      done = false,
      value,
      onInput,
      onChange,
      maxLines,
      onMaxLinesExceeded,
      ...props
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const { toneRing, toneText } = pillToneClasses(tone);

    const lineCapHeight = useCallback(
      (element: HTMLTextAreaElement) => {
        if (!maxLines) return Number.POSITIVE_INFINITY;
        const style = window.getComputedStyle(element);
        const lineHeight = Number.parseFloat(style.lineHeight) || 24;
        const paddingTop = Number.parseFloat(style.paddingTop) || 0;
        const paddingBottom = Number.parseFloat(style.paddingBottom) || 0;
        return lineHeight * maxLines + paddingTop + paddingBottom;
      },
      [maxLines],
    );

    const resize = useCallback(
      (element = innerRef.current) => {
        if (!element) return;
        element.style.height = "auto";
        element.style.height = `${Math.min(element.scrollHeight, lineCapHeight(element))}px`;
      },
      [lineCapHeight],
    );

    const exceedsLineCap = useCallback(
      (element: HTMLTextAreaElement) =>
        maxLines ? element.scrollHeight > lineCapHeight(element) + 1 : false,
      [lineCapHeight, maxLines],
    );

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      const element = event.currentTarget;
      resize(element);
      if (exceedsLineCap(element)) {
        element.value = typeof value === "string" ? value : String(value ?? "");
        resize(element);
        onMaxLinesExceeded?.();
        return;
      }
      onChange?.(event);
    };

    useEffect(() => resize(), [resize, value]);

    return (
      <textarea
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        value={value}
        rows={1}
        onInput={(event) => {
          resize();
          onInput?.(event);
        }}
        onChange={handleChange}
        className={cn(
          "w-full resize-none rounded-[1.45rem] bg-card",
          "border border-border/60 outline-none transition-all",
          "shadow-soft focus-visible:shadow-pop focus-visible:-translate-y-[1px]",
          "focus-visible:ring-4",
          "font-sans leading-6 overflow-hidden",
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
PillTextArea.displayName = "PillTextArea";
