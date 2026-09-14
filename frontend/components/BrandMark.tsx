import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  light?: boolean;
  className?: string;
};

export function BrandMark({ light = false, className }: Props) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/v-logo.png"
        alt="VectoRise"
        width={32}
        height={32}
        className="h-8 w-8 object-contain"
        priority
      />
      <p className={cn("text-[15px] font-semibold tracking-tight", light ? "text-white" : "text-[#0f1c2e]")}>
        Vecto<span className={light ? "text-white/80" : "text-[#1c7fd4]"}>Rise</span>
      </p>
    </div>
  );
}
