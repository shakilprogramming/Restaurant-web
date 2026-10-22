import Link from "next/link";

export default function Footer() {
  return <footer className="site-footer"><Link href="/" className="brand-mark">MASSIMO</Link><p>© {new Date().getFullYear()} MASSIMO. ALL RIGHTS RESERVED.</p><Link href="/menu">Browse the menu <span aria-hidden="true">→</span></Link></footer>;
}
