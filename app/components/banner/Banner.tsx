"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import BannerSlide from "./BannerSlide";
import { bannerData } from "./bannerData";

export default function Banner() {
  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      slidesPerView={1}
      loop
    //   navigation
      pagination={{
        clickable: true,
      }}
      autoplay={{
        delay: 5000,
        disableOnInteraction: false,
      }}
    //   className="rounded-2xl"
    >
      {bannerData.map((item) => (
        <SwiperSlide key={item.id}>
          <BannerSlide item={item} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
