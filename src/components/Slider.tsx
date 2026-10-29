import Link from "next/link";

export default function Slider() {
  return (
    <>
      <section aria-labelledby="hero-title" className="hero-shell" id="home">
        <div className="hero-copy">
          <p className="eyebrow hero-enter hero-delay-1"><span aria-hidden="true">🔥</span> Freshly grilled. Made to crave.</p>
          <h1 id="hero-title" className="hero-title hero-enter hero-delay-2">Burgers with a <em>naan twist.</em></h1>
          <p className="hero-description hero-enter hero-delay-3">Juicy smashed patties, warm handmade naan, crunchy toppings and bold house sauces—stacked fresh for serious flavour.</p>
          <div className="hero-actions hero-enter hero-delay-4">
            <Link href="/menu" className="button-primary">Explore menu <span aria-hidden="true">→</span></Link>
            <a href="#story" className="button-secondary">Why NaanBite?</a>
          </div>
        </div>
      </section>
      <div className="ticker" aria-hidden="true"><div className="ticker-track"><span>Fresh Naan ✦ Big Burgers ✦ House Sauces ✦ Halal Friendly ✦ Loaded Fries ✦</span><span>Fresh Naan ✦ Big Burgers ✦ House Sauces ✦ Halal Friendly ✦ Loaded Fries ✦</span></div></div>
    </>
  );
}
