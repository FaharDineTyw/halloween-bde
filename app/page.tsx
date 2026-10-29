import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Showcase from "@/components/Showcase";
import Intro from "@/components/Intro";
import Catalogue from "@/components/Catalogue";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <>
      <Header />
      <main id="haut">
        <Hero />
        <Showcase />
        <Intro />
        <Catalogue />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
