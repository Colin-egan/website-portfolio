import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconSize?: number;
  textClassName?: string;
}

const ASPECT_RATIO = 2172 / 352;

export function Logo({ className, iconSize = 32 }: LogoProps) {
  const width = Math.round(iconSize * ASPECT_RATIO);

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/egan-labs-logo-dark.png"
        alt="Egan Labs"
        width={width}
        height={iconSize}
        className="object-contain dark:hidden"
        priority
      />
      <Image
        src="/egan-labs-logo-light.png"
        alt="Egan Labs"
        width={width}
        height={iconSize}
        className="object-contain hidden dark:block"
        priority
      />
    </div>
  );
}
