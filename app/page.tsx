import Navbar from "./components/menu/Navbar";

export default function Home() {
  return (
    <>
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="container mx-auto py-20">
        <h1 className="text-xl font-bold">صفحه اصلی</h1>
      </main>
    </>
  );
}
