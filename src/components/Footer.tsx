import Link from "next/link";

export default function Footer() {
  return <footer className="site-footer"><div><Link href="/" className="footer-brand">NaanBite.</Link><p>Bold burgers. Warm naan. No weak flavours.</p></div><nav aria-label="Footer navigation"><Link href="/menu">Menu</Link><a href="/#story">Our Story</a><a href="/#deals">Deals</a><a href="/#visit">Locations</a></nav><small>© {new Date().getFullYear()} NaanBite. All rights reserved.</small></footer>;
}
