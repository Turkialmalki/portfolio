import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import BentoGrid from "@/components/sections/BentoGrid";
import Metrics from "@/components/sections/Metrics";
import Projects from "@/components/sections/Projects";
import FAQ from "@/components/sections/FAQ";
import Blog from "@/components/sections/Blog";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BentoGrid />
        <Metrics />
        <Projects />
        <FAQ />
        <Blog />
      </main>
      <Footer />
    </>
  );
}
