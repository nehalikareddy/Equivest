import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleDollarSign, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function NavBar({ children, showSignOut = true }) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="EquiVest home">
        <span className="brand-mark"><CircleDollarSign size={21} /></span>
        <span>EquiVest</span>
      </Link>
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav className={`landing-nav${menuOpen ? ' nav-open' : ''}`} aria-label="Main navigation">
        {children}
        {showSignOut && user && (
          <button className="nav-link button-link" onClick={signOut}>Sign out</button>
        )}
      </nav>
    </header>
  );
}