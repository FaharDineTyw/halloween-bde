import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Showcase from "@/components/Showcase";
import Intro from "@/components/Intro";
import Catalogue from "@/components/Catalogue";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Ambiance from "@/components/Ambiance";
import BloodRiver from "@/components/BloodRiver";

export default function Page() {
  return (
    <>
      {/* Fond interactif fixe, derrière tout le contenu */}
      <Ambiance />
      <div className="relative z-10">
        {/* Sang qui coule le long de la page, posé dans les marges */}
        <BloodRiver />
        <Header />
        <main id="haut">
          <Hero />
          <Showcase />
          <Intro />
          <Catalogue />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
}
