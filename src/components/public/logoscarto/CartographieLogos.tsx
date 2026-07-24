import logoElche from "./Ayto Elche (6).png";
import logoLleida from "./Ayto Lleida (3).png";
import logoManosUnidas from "./Manos Unidas (4).png";
import logoDelhaize from "./c02ff4aa-3a8b-4803-b3c2-3f524af712cd (6).png";

const LOGOS = [
  { src: logoManosUnidas, alt: "Manos Unidas" },
  { src: logoElche, alt: "Ayuntamiento de Elche" },
  { src: logoLleida, alt: "Ajuntament de Lleida" },
  { src: logoDelhaize, alt: "Delhaize" },
] as const;

export function CartographieLogos() {
  return (
    <section
      className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-8"
      aria-label="Partenaires"
    >
      <ul className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
        {LOGOS.map((logo) => (
          <li key={logo.alt} className="flex items-center justify-center">
            <img
              src={logo.src}
              alt={logo.alt}
              className="h-12 w-auto max-w-[160px] object-contain sm:h-14 md:h-16 md:max-w-[200px]"
              loading="lazy"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
