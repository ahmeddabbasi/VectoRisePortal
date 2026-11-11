import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  light?: boolean;
  compact?: boolean;
  className?: string;
};

export function BrandMark({ light = false, compact = false, className }: Props) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2 sm:gap-3", className)}>
      <Image
        src="/v-logo.png"
        alt="VectoRise"
        width={32}
        height={32}
        className={cn("shrink-0 object-contain", compact ? "h-7 w-7" : "h-8 w-8")}
        priority
      />
      <p className={cn(
        "truncate font-semibold tracking-tight",
        compact ? "hidden text-sm sm:block sm:text-[15px]" : "text-[15px]",
        light ? "text-white" : "text-[#0f1c2e]",
      )}>
        Vecto<span className={light ? "text-white/80" : "text-[#1c7fd4]"}>Rise</span>
      </p>
    </div>
  );
}
