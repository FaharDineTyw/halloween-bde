import Header from "@/components/Header";
import Hero from "@/components/Hero";
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
        <main id="haut" className="relative">
          <Hero />
          <Catalogue />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
}
