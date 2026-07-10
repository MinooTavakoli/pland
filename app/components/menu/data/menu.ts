import { MenuItem, NavbarItem } from "../types/menu";

export const navbarItems: NavbarItem[] = [
  {
    id: "categories",
    title: "دسته بندی محصولات",
    megaMenu: true,
  },
  {
    id: "installment",
    title: "خرید سازمانی",
    href: "/origin",
  },
  {
    id: "installment",
    title: "خرید اقساطی",
    href: "/installment",
  },
  {
    id: "contact",
    title: "تماس با ما",
    href: "/contact",
  },
  {
    id: "about",
    title: "درباره ما",
    href: "/about",
  },
  {
    id: "blog",
    title: "مقالات",
    href: "/blog",
  },
];

export const menuData: MenuItem[] = [
  {
    id: "1",
    title: "گوشی و موبایل و تجهیزات",
    href: "/category/mobile",
    children: [
      {
        id: "1-1",
        title: "موبایل",
        href: "/category/mobile/phones",
        children: [
          {
            id: "1-1-1",
            title: "آیفون",
            href: "/category/mobile/iphone",
            children: [
              {
                id: "1-1-1-1",
                title: "iPhone 16 Pro Max",
                href: "/products/iphone-16-pro-max",
              },
              {
                id: "1-1-1-2",
                title: "iPhone 16 Pro",
                href: "/products/iphone-16-pro",
              },
              {
                id: "1-1-1-3",
                title: "iPhone 15",
                href: "/products/iphone-15",
              },
            ],
          },
          {
            id: "1-1-2",
            title: "سامسونگ",
            href: "/category/mobile/samsung",
            children: [
              {
                id: "1-1-2-1",
                title: "Galaxy S25",
                href: "/products/galaxy-s25",
              },
              {
                id: "1-1-2-2",
                title: "Galaxy A56",
                href: "/products/galaxy-a56",
              },
            ],
          },
          {
            id: "1-1-3",
            title: "شیائومی",
            href: "/category/mobile/xiaomi",
          },
        ],
      },
      {
        id: "1-2",
        title: "تبلت",
        href: "/category/tablet",
      },
      {
        id: "1-3",
        title: "ساعت هوشمند",
        href: "/category/smart-watch",
      },
    ],
  },
  {
    id: "2",
    title: "قطعات کامپیوتر",
    href: "/category/computer-parts",
    children: [
      {
        id: "2-1",
        title: "پردازنده",
        href: "/category/cpu",
      },
      {
        id: "2-2",
        title: "رم",
        href: "/category/ram",
      },
      {
        id: "2-3",
        title: "مادربرد",
        href: "/category/motherboard",
      },
      {
        id: "2-4",
        title: "کارت گرافیک",
        href: "/category/gpu",
      },
    ],
  },
  {
    id: "3",
    title: "مانیتور",
    href: "/category/monitor",
  },
  {
    id: "4",
    title: "لپ تاپ",
    href: "/category/laptop",
  },
  {
    id: "5",
    title: "هدفون",
    href: "/category/headphone",
  },
];
