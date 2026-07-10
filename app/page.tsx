"use client";

import Image from "next/image";
import { HiOutlineUser } from "react-icons/hi2";
import { HiOutlineHeart } from "react-icons/hi2";
import { FaTelegramPlane } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";
import { FaWhatsapp, FaInstagram } from "react-icons/fa";

import { Menu } from "./components/menu/Menu";
import dastbandImg from "../public/images/sample/dastband.jpg";
import img4 from "../public/images/sample/Gallery-footer-01.jpg";
import img1 from "../public/images/sample/H1-Slider-cut-img-01.jpg";
import img2 from "../public/images/sample/H1-Slider-cut-img-02.jpg";
import img3 from "../public/images/sample/H1-Slider-cut-img-03.jpg";
import goldRingsImg from "../public/images/sample/Gold-rings-1.png";
import mainSliderImg from "../public/images/sample/Main-slider-img-1.jpg";

export default function HomePage() {
  const images = [img1, img2, img3, img4];

  return (
    <main className="w-full mx-auto">
      <div className="bg-black">
        <div className="max-w-[1780px] py-4 md:py-3 px-3 text-white flex items-center justify-between md:justify-center relative">
          <div className="text-sm md:text-base">
            ✨ به پادیمو گلد خوش آمدید - انتخاب بی‌نظیر شما! ✨
          </div>

          <div className="flex items-center gap-3 md:gap-6 md:absolute left-6">
            <FaWhatsapp
              size={19}
              className="cursor-pointer hover:text-[#f5e7d6]"
            />
            <FaInstagram
              size={19}
              className="cursor-pointer hover:text-[#f5e7d6]"
            />
            <FaTelegramPlane
              size={19}
              className="cursor-pointer hover:text-[#f5e7d6]"
            />
          </div>
        </div>
      </div>

      <div className="h-full w-full mx-auto relative">
        <Menu />
        <div className="hidden md:flex items-center absolute top-7 right-10 z-40 space-x-5">
          <HiOutlineHeart
            size={20}
            className="cursor-pointer hover:text-[#c8a97e]"
          />
          <HiOutlineUser
            size={20}
            className="cursor-pointer hover:text-[#c8a97e]"
          />
          <IoSearchOutline
            size={20}
            className="cursor-pointer hover:text-[#c8a97e]"
          />
        </div>
        <div className="grid md:grid-cols-12 md:min-h-screen">
          <div className="md:col-span-8 md:relative w-full">
            <div className="grid lg:grid-cols-2">
              <div className="md:col-span-1 flex items-center justify-center">
                <div className="w-[96%] h-full mt-12 md:mt-0 md:w-[60%] md:h-[70%] md:absolute md:top-32 md:-left-48 rounded-tl-[260px] md:rounded-tl-[350px] overflow-hidden z-40">
                  <Image
                    src={mainSliderImg}
                    alt="gallery"
                    className="overflow-hidden"
                  />
                </div>
              </div>
              <div className="hidden md:block md:col-span-1"></div>
              <div className="pt-24 pr-4 w-[70%] lg:w-full">
                <h6 className="mb-3 text-[#ce8b39]">
                  ✨ زندگی در اوجِ ظرافت و درخشش
                </h6>
                <h6 className="font-bold text-2xl mb-3">
                  درخششِ اصالت در هر لحظه از زندگی شما
                </h6>
                <p className="text-justify leading-7 text-gray-600">
                  درخششِ جاودانه در هر قطعه طلا و جواهر، ترکیبی از هنر، ظرافت و
                  اصالت که برای سلیقه‌های خاص طراحی شده است، هر محصول با دقت و
                  عشق ساخته شده تا زیبایی شما را ماندگارتر کند، مجموعه‌ای از
                  جدیدترین کالکشن‌های طلا و جواهرات لوکس که حس متفاوت بودن را به
                  شما هدیه می‌دهد، انتخابی شایسته برای لحظه‌های خاص زندگی که در
                  آن کیفیت و زیبایی در کنار هم معنا پیدا می‌کنند.
                </p>
                <div className="flex items-center justify-between">
                  <div className="rounded-t-full w-52 overflow-hidden mt-14 mr-6">
                    <Image src={dastbandImg} alt="gallery" className="" />
                  </div>
                  <div className="w-52 mt-44">
                    <Image src={goldRingsImg} alt="gallery" className="" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:col-span-4 bg-[#f5e7d6] md:flex flex-col items-end p-3 lg:p-10 relative">
            <div className="text-3xl font-bold tracking-[6px] pl-4 lg:pl-28">
              PADIMO
            </div>
            <div className="text-[#dccfc0] -rotate-90 text-4xl lg:text-8xl absolute left-[-90px] lg:left-[-300px] top-[240px] lg:top-[410px]">
              UNPARALLELED
            </div>

            <div className="flex flex-col gap-12 lg:gap-20 mt-10 ml-4 xl:ml-32">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="relative w-[74px] lg:w-[110px] h-[74px] lg:h-[110px] overflow-hidden rounded-lg"
                >
                  <Image
                    src={image}
                    alt={`gallery-${index + 1}`}
                    className="object-cover w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
