import Image from "next/image";
import Link from "next/link";

export default function Slider() {
  return (
    <section aria-labelledby="hero-title" className="hero-shell">
      <div className="hero-copy">
        <p className="eyebrow hero-enter hero-delay-1">Fresh ingredients, exceptional flavors</p>
        <h1 id="hero-title" className="hero-title hero-enter hero-delay-2">Every bite tells a <em>delicious</em> story.</h1>
        <p className="hero-description hero-enter hero-delay-3">Thoughtfully prepared favorites, made fresh and ready to bring everyone to the table.</p>
        <div className="hero-actions hero-enter hero-delay-4">
          <Link href="/menu" className="button-primary">Order now <span aria-hidden="true">→</span></Link>
          <Link href="#featured" className="button-secondary">Explore our dishes</Link>
        </div>
        <p className="hero-note">Made fresh at Massimo, every day.</p>
      </div>
      <div className="hero-visual hero-enter-image">
        <Image src="/slide1.png" alt="Freshly prepared pizza, served hot at Massimo" fill priority sizes="(min-width: 900px) 52vw, 100vw" className="hero-image" />
        <div className="hero-image-caption"><span className="caption-dot" /> Fresh from our kitchen</div>
      </div>
    </section>
  );
}
