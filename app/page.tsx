import Banner from "./components/banner/Banner";
import Navbar from "./components/menu/Navbar";
import StorySlider from "./components/storySlider/StorySlider";

export default function Home() {
  return (
    <>
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <Banner />
      <div className="py-6 px-2">
        <StorySlider />
      </div>

      <main className="container mx-auto py-20">
        <h1 className="text-xl font-bold">صفحه اصلی</h1>
      </main>
    </>
  );
}
