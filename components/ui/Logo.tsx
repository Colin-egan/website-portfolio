import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconSize?: number;
  textClassName?: string;
}

export function Logo({ className, iconSize = 32 }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/Eganlabslogo.png"
        alt="Egan Labs"
        width={Math.round(iconSize * 3.76)}
        height={iconSize}
        className="object-contain"
        priority
      />
    </div>
  );
}
