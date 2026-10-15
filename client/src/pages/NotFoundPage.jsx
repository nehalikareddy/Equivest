import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  useEffect(() => { document.title = 'Page Not Found — EquiVest'; }, []);
  return (
    <main className="page-shell">
      <section className="empty-state">
        <h1>404</h1>
        <h2>Page not found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>
        <Link className="primary-link" to="/">Go home</Link>
      </section>
    </main>
  );
}