"use client";

import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";

import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

import { storyData } from "./storyData";
import StoryCard from "./StoryCard";

export default function StorySlider() {
  return (
    <div className="flex items-center gap-4 py-6">
      <button className="story-prev flex h-10 w-10 items-center justify-center bg-white shadow-lg rounded-full cursor-pointer">
        <HiChevronRight />
      </button>

      <div className="flex-1 overflow-hidden">
        <Swiper
          modules={[Navigation]}
          navigation={{
            prevEl: ".story-prev",
            nextEl: ".story-next",
          }}
          spaceBetween={24}
          grabCursor
          breakpoints={{
            320: {
              slidesPerView: 2,
              spaceBetween: 16,
            },
            640: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 4,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 5,
              spaceBetween: 24,
            },
            1280: {
              slidesPerView: 7,
              spaceBetween: 24,
            },
          }}
        >
          {storyData.map((item) => (
            <SwiperSlide key={item.id}>
              <StoryCard item={item} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <button className="story-next flex h-10 w-10 items-center justify-center bg-white shadow-lg rounded-full cursor-pointer">
        <HiChevronLeft />
      </button>
    </div>
  );
}
