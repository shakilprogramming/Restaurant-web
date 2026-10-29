import Image from "next/image";
import Link from "next/link";

const Offer = () => (
  <>
    <section className="story" id="story" aria-labelledby="story-title">
      <div className="story-grid">
        <div className="story-media">
          <Image className="story-main" src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=85" alt="Warm, welcoming restaurant dining room" fill sizes="(min-width: 900px) 42vw, 90vw" />
          <Image className="story-small" src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=85" alt="Fresh vegetables and ingredients" fill sizes="(min-width: 900px) 20vw, 48vw" />
        </div>
        <div className="story-copy">
          <p className="eyebrow">Our story</p>
          <h2 id="story-title">Street-food energy. Kitchen-made quality.</h2>
          <p>We bring two comfort-food icons together: the messy, juicy burger and warm, pillowy naan. Every order is made fresh, generously sauced and ready to share.</p>
          <div className="story-points">
            <article><strong>Made fresh</strong><span>Naan, patties and sauces prepared daily.</span></article>
            <article><strong>Big flavour</strong><span>Spice-led recipes with zero boring bites.</span></article>
            <article><strong>Quality first</strong><span>Carefully sourced ingredients.</span></article>
            <article><strong>Good vibes</strong><span>Fast, friendly and always satisfying.</span></article>
          </div>
          <a href="#visit" className="button-secondary">Find our kitchen <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
    <section className="deal-wrap" id="deals" aria-labelledby="deal-title">
      <div className="deal-card">
        <div className="deal-copy">
          <p className="deal-label">Limited-time combo</p>
          <h2 id="deal-title">The Big Bite Deal.</h2>
          <p>Choose any signature naan burger, loaded fries and a chilled drink. Built for hunger, priced for happiness.</p>
          <Link href="/menu" className="button-dark">Explore the menu <span aria-hidden="true">→</span></Link>
        </div>
        <div className="deal-image"><Image src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1100&q=90" alt="Fresh burger served with sides" fill sizes="(min-width: 900px) 48vw, 90vw" /></div>
      </div>
    </section>
    <section className="visit" id="visit" aria-labelledby="visit-title">
      <div className="section-heading"><p className="eyebrow">Come hungry</p><h2 id="visit-title">Find your nearest bite.</h2></div>
      <div className="visit-grid">
        <article className="visit-card"><h3>NaanBite Central</h3><p>123 Food Street<br />Your City</p><dl><div><dt>Monday–Thursday</dt><dd>11am–10pm</dd></div><div><dt>Friday–Saturday</dt><dd>11am–12am</dd></div><div><dt>Sunday</dt><dd>12pm–10pm</dd></div></dl><Link href="/menu" className="button-primary">Order online</Link></article>
        <div className="visit-photo" role="img" aria-label="Restaurant location map illustration"><span aria-hidden="true">●</span></div>
      </div>
    </section>
  </>
);

export default Offer;
