"use client";

import Image from "next/image";
// import Link from "next/link";
import { BannerItem } from "./types";

interface Props {
  item: BannerItem;
}

export default function BannerSlide({ item }: Props) {
  return (
    <div
      //   href={item.href}
      className="relative block h-[500px] w-full overflow-hidden"
    >
      <Image
        src={item.image}
        alt={item.title}
        fill
        priority
        className="object-cover"
      />
    </div>
  );
}
