"use client";

import Image from "next/image";
import Link from "next/link";
import { StoryItem } from "./types";

interface Props {
  item: StoryItem;
}

export default function StoryCard({ item }: Props) {
  return (
    <Link
      href={item.href}
      className="flex flex-col items-center justify-center py-4"
    >
      <div className="mx-auto h-[130px] w-[130px] rounded-full border-2 border-blue-450 p-1 transition hover:scale-105">
        <div className="relative h-full w-full overflow-hidden rounded-full">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
          />
        </div>
      </div>

      <span className="mt-3 text-sm font-medium">{item.title}</span>
    </Link>
  );
}
