"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { FiSearch } from "react-icons/fi";
import { AiOutlineShoppingCart } from "react-icons/ai";

import Backdrop from "./Backdrop";
import Input from "../input/Input";
import DesktopMegaMenu from "./DesktopMegaMenu";
import logo from "../../../public/logo/logo.png";
import { navbarItems, menuData } from "./data/menu";

interface FormValues {
  search: string;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const { control } = useForm<FormValues>();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [open]);

  return (
    <>
      <Backdrop open={open} onClose={() => setOpen(false)} />

      <header className="relative z-50 border-b bg-white">
        <div className="bg-blue-450 py-2.5 flex items-center justify-center text-white text-xl font-bold">
          ✨ به دنیای قطعات کامپیوتری پی‌لند خوش آمدید ✨
        </div>
        <div className="container mx-auto">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-5">
              <Link href="/">
                <Image src={logo} alt="logo" width={46} />
              </Link>
              <div className="w-[40vw]">
                <Input
                  control={control}
                  name="search"
                  leftIcon={<FiSearch size={20} />}
                  placeholder="جستجو کنید ..."
                  variant="filled"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/sign-in"
                className="border border-gray-400 py-1.5 px-4 rounded-lg"
              >
                ورود و ثبت نام
              </Link>
              <Link href="/cart">
                <AiOutlineShoppingCart size={25} />
              </Link>
            </div>
          </div>
          <ul className="flex h-16 items-center gap-10 text-sm">
            {navbarItems?.map((item) => {
              return (
                <li key={item?.id}>
                  {item?.megaMenu ? (
                    <div
                      onClick={() => setOpen((prev) => !prev)}
                      className="font-semibold transition hover:text-blue-750 cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        {item?.icon && item.icon}
                        <span>{item.title}</span>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href!}
                      className="transition hover:text-blue-750"
                    >
                      <div className="flex items-center gap-1">
                        {item?.icon && item.icon}
                        <span>{item.title}</span>
                      </div>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <DesktopMegaMenu
          open={open}
          menu={menuData}
          onClose={() => setOpen(false)}
        />
      </header>
    </>
  );
}
