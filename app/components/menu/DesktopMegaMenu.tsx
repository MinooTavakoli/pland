"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HiChevronLeft } from "react-icons/hi2";
import { MenuItem } from "./types/menu";

interface Props {
  open: boolean;
  menu: MenuItem[];
  onClose: () => void;
}

export default function DesktopMegaMenu({ open, menu }: Props) {
  const [activePath, setActivePath] = useState<MenuItem[]>([]);

  const columns = useMemo(() => {
    const result: MenuItem[][] = [menu];

    activePath.forEach((item) => {
      if (item.children?.length) {
        result.push(item.children);
      }
    });

    return result;
  }, [menu, activePath]);

  const handleHover = (item: MenuItem, level: number) => {
    setActivePath((prev) => {
      const next = prev.slice(0, level);
      next[level] = item;
      return next;
    });
  };

  if (!open) return null;

  return (
    <div className="absolute top-full right-0 z-50 bg-white shadow-xl">
      <div className="flex h-[calc(100vh-64px)] overflow-y-auto">
        {" "}
        {columns.map((items, level) => (
          <div key={level} className="w-72 shadow">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href ?? "#"}
                onMouseEnter={() => handleHover(item, level)}
                className="flex items-center justify-between px-4 py-3 hover:bg-blue-50"
              >
                <span>{item.title}</span>

                {item.children && <HiChevronLeft className="!text-blue-750" />}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
