import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconSize?: number;
  textClassName?: string;
}

const ASPECT_RATIO = 1947 / 352;

export function Logo({ className, iconSize = 32 }: LogoProps) {
  const width = Math.round(iconSize * ASPECT_RATIO);

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/egan-lab-logo-dark.png"
        alt="Egan Lab"
        width={width}
        height={iconSize}
        className="object-contain dark:hidden"
        priority
      />
      <Image
        src="/egan-lab-logo-light.png"
        alt="Egan Lab"
        width={width}
        height={iconSize}
        className="object-contain hidden dark:block"
        priority
      />
    </div>
  );
}
