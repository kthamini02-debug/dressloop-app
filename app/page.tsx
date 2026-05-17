import Navbar from "../components/Navbar";
import NGOSection from "../components/NGOSection";
import Testimonials from "../components/Testimonials";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-pink-50 flex flex-col items-center justify-center text-center p-10">
        <h1 className="text-5xl font-bold text-pink-600 mb-6">
          DressLoop
        </h1>

        <p className="text-lg text-gray-700 max-w-2xl">
          Donate unused clothes and help people in need through NGOs.
          Sustainable fashion starts with sharing ❤️
        </p>

        <button className="mt-8 bg-pink-600 text-white px-6 py-3 rounded-xl hover:bg-pink-700 transition">
          Donate Now
        </button>
      </main>

      <NGOSection />

      <Testimonials />

      <Footer />
    </>
  );
}