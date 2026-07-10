/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import starSvg from "../../../public/icons/star.svg";

import { HiChevronLeft } from "react-icons/hi";
import { MdKeyboardArrowDown } from "react-icons/md";

export const Menu = () => {
  const menuItems = [
    {
      title: "فروشگاه",
      children: [
        {
          title: "انگشتر",
          children: ["انگشتر طلا", "انگشتر نقره"],
        },
        {
          title: "گردنبند",
          children: ["گردنبند زنانه", "گردنبند مردانه"],
        },
        {
          title: "دستبند",
        },
      ],
    },
    {
      title: "تماس با ما",
    },
    {
      title: "درباره ما",
      children: [{ title: "تاریخچه" }, { title: "تیم ما" }],
    },
    {
      title: "بلاگ",
      children: [{ title: "مقالات" }, { title: "اخبار" }],
    },
  ];

  return (
    <div className="hidden md:flex items-center justify-evenly w-1/2 absolute top-4 left-1/2 -translate-x-1/2 z-50">
      {menuItems.map((item) => (
        <div key={item.title} className="group relative">
          {/* MAIN ITEM (UNCHANGED) */}
          <div className="flex items-center gap-2 cursor-pointer py-2">
            <Image
              src={starSvg}
              alt="star"
              className="
                w-4
                opacity-0
                translate-x-3
                transition-all
                duration-300
                group-hover:opacity-100
                group-hover:translate-x-0
              "
            />

            <span className="transition-colors duration-300 group-hover:text-[#c8a97e]">
              <div className="flex items-center">
                <div>{item.title}</div>
                {item?.children && <MdKeyboardArrowDown className="mr-1" />}
              </div>
            </span>
          </div>

          {/* LEVEL 1 DROPDOWN */}
          {item.children && (
            <div
              className="absolute top-full right-0 min-w-[220px]
            opacity-0 invisible translate-y-2
            transition-all duration-200
            group-hover:opacity-100
            group-hover:visible
            group-hover:translate-y-0
            bg-[#fff9f4] shadow-xl
            border-t border-t-[#ac805d]"
            >
              {item.children.map((subItem: any) => (
                <div
                  key={subItem.title}
                  className="group/item relative cursor-pointer"
                >
                  <div className="flex items-center justify-between px-2 py-3">
                    {/* LEFT CONTENT */}
                    <div className="flex items-center">
                      {/* STAR FIXED SLOT */}
                      <div className="w-3 h-3 relative flex-shrink-0">
                        <Image
                          src={starSvg}
                          alt="star"
                          className="
                            absolute inset-0
                            w-3 h-3
                            opacity-0 scale-75 translate-x-1
                            transition-all duration-300 ease-out
                            group-hover/item:opacity-100
                            group-hover/item:scale-100
                            group-hover/item:translate-x-0
                          "
                        />
                      </div>

                      {/* TEXT PUSH EFFECT */}
                      <span
                        className="
                          transition-all duration-300 ease-out
                          group-hover/item:-translate-x-2
                          group-hover/item:text-[#c8a97e]
                          group-hover/item:delay-75
                        "
                      >
                        {subItem.title}
                      </span>
                    </div>

                    {/* arrow */}
                    {subItem.children && (
                      <HiChevronLeft size={16} className="text-gray-400" />
                    )}
                  </div>

                  {/* LEVEL 2 DROPDOWN */}
                  {subItem.children && (
                    <div
                      className="
                        absolute -top-[1px] right-full mr-0.5
                        min-w-[200px]
                        bg-[#fff9f4]
                        shadow-xl
                        border-t border-t-[#ac805d]
                        opacity-0 invisible translate-x-2
                        transition-all duration-200
                        group-hover/item:opacity-100
                        group-hover/item:visible
                        group-hover/item:translate-x-0
                      "
                    >
                      {subItem.children.map((child: any) => (
                        <div
                          key={child}
                          className="group/sub px-2 py-3 cursor-pointer"
                        >
                          <div className="flex items-center">
                            {/* STAR FIXED SLOT */}
                            <div className="w-3 h-3 relative flex-shrink-0">
                              <Image
                                src={starSvg}
                                alt="star"
                                className="
                                  absolute inset-0
                                  w-3 h-3
                                  opacity-0 scale-75 translate-x-1
                                  transition-all duration-300 ease-out
                                  group-hover/sub:opacity-100
                                  group-hover/sub:scale-100
                                  group-hover/sub:translate-x-0
                                "
                              />
                            </div>

                            {/* TEXT PUSH EFFECT */}
                            <span
                              className="
                                transition-all duration-300 ease-out
                                group-hover/sub:-translate-x-2
                                group-hover/sub:text-[#c8a97e]
                                group-hover/sub:delay-75
                              "
                            >
                              {child}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
