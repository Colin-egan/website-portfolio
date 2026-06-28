import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconSize?: number;
  textClassName?: string;
}

export function Logo({ className, iconSize = 32, textClassName }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Play-button icon: triangle + square cutout via evenodd */}
      <svg
        viewBox="0 0 130 180"
        fill="none"
        width={iconSize}
        height={Math.round(iconSize * 1.38)}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          fill="currentColor"
          d="M 0 0 L 0 180 L 130 90 Z M 29 68 L 29 104 L 65 104 L 65 68 Z"
        />
      </svg>

      {/* Text: "Egan " plain + "Labs" with SVG checkerboard glitch mask */}
      <span
        className={cn(
          "font-display font-bold tracking-tight leading-none",
          textClassName
        )}
      >
        Egan Labs
      </span>
    </div>
  );
}
