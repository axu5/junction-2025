import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type SoEmptyProps = {
  info: string;
  ctaHref: string;
  cta: ReactNode;
};

export function SoEmpty({ info, ctaHref, cta }: SoEmptyProps) {
  return (
    <>
      <span className='italic text-center text-balance'>{info}</span>

      <Link
        href={ctaHref}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "flex flex-row items-center gap-x-2"
        )}>
        {cta}
      </Link>
    </>
  );
}
