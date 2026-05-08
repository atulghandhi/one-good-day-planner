import type { SketchPalette } from "../types";

export function SketchDoodles({ palette }: { palette: SketchPalette }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ color: palette.doodle }}
    >
      <svg className="absolute left-4 top-[48%] h-28 w-28" viewBox="0 0 144 144" fill="none">
        {Array.from({ length: 18 }).map((_, index) => (
          <path
            key={index}
            d={`M ${12 + (index % 5) * 21} ${10 + Math.floor(index / 5) * 24} q ${5 + (index % 3)} ${-6 + (index % 4) * 3} ${11 + (index % 2) * 3} 1`}
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.9"
          />
        ))}
      </svg>
      <svg className="absolute right-6 top-24 h-24 w-52" viewBox="0 0 208 96" fill="none">
        <path
          d="M8 54 C22 8 36 88 50 24 C64 -6 78 82 92 18 C108 -10 120 82 134 18 C148 -8 162 82 176 18 C190 -4 198 52 204 38"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg className="absolute bottom-0 -left-2 h-28 w-72" viewBox="0 0 288 112" fill="none">
        <path
          d="M2 72 C24 14 54 118 76 54 C98 -8 118 112 143 62 C168 12 180 110 205 72 C230 34 252 102 286 58"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
      <svg className="absolute bottom-12 right-8 h-48 w-48" viewBox="0 0 192 192" fill="none">
        <path
          d="M38 44 C30 26 58 18 68 40 C76 18 104 28 94 50 C84 72 58 82 38 44Z"
          fill="currentColor"
        />
        <path
          d="M116 70 C110 56 132 50 140 66 C146 50 168 58 160 76 C152 94 132 100 116 70Z"
          fill="currentColor"
        />
        {Array.from({ length: 16 }).map((_, index) => (
          <path
            key={index}
            d={`M ${28 + (index % 4) * 38} ${112 + Math.floor(index / 4) * 18} q 7 -9 14 0`}
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <svg className="absolute left-6 top-1/3 h-28 w-28" viewBox="0 0 112 112" fill="none">
        <path
          d="M56 6 C61 38 73 50 106 56 C73 62 61 74 56 106 C51 74 39 62 6 56 C39 50 51 38 56 6Z"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M86 10 V42 M70 26 H102"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
