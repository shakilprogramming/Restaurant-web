import Link from "next/link";
import Menu from "./Menu";
import CartIcon from "./CartIcon";
import UserLinks from "./UserLinks";

const Navbar = () => (
  <header className="site-header">
    <Link href="/" className="brand-mark" aria-label="NaanBite home"><span className="brand-icon">N</span><span>NaanBite</span></Link>
    <nav className="desktop-nav" aria-label="Main navigation"><a href="/#story">Our Story</a><a href="/#deals">Deals</a><a href="/#visit">Visit Us</a></nav>
    <div className="header-actions"><Link href="/menu" className="button-primary button-small">Order now <span aria-hidden="true">→</span></Link><div className="account-links"><UserLinks /></div><div className="cart-link"><CartIcon /></div></div>
    <div className="mobile-nav"><Menu /></div>
  </header>
);

export default Navbar;
