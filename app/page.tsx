import { Hero } from "@/components/sections/Hero";
import { BrandGallery } from "@/components/sections/BrandGallery";
import { Services } from "@/components/sections/Services";
import { Process } from "@/components/sections/Process";
import { Work } from "@/components/sections/Work";
import { Team } from "@/components/sections/Team";
import { Testimonials } from "@/components/sections/Testimonials";
import { Pricing } from "@/components/sections/Pricing";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <>
      <Hero />
      <BrandGallery />
      <Services />
      <Process />
      <Work />
      <Team />
      {/* <Testimonials /> */}
      <Pricing />
      <Contact />
      <Footer />
    </>
  );
}
