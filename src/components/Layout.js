import Link from "next/link";
// Es necesario usar useRouter en NavigationBar para manejar el estado activo del enlace
import { useRouter } from "next/router";

function NavigationBar() {
  const router = useRouter();
  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/prestamos", label: "Préstamos Activos" },
    { href: "/asignacion", label: "Nueva Asignación" },
    /*{ href: "/busqueda", label: "Historial/Búsqueda" },*/
  ];

  return (
    <nav className="layout-navbar">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          // 🛑 Clase activa para resaltar el enlace actual
          className={`layout-nav-link ${
            router.pathname === link.href ? "active" : ""
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export default function Layout({ children, sidebar, user, handleLogout }) {
  // 🛑 1. Define la clase condicional para el layout
  const contentClass = sidebar
    ? "layout-content layout-has-sidebar"
    : "layout-content";

  return (
    <div className="layout-container">
      {/* 1. HEADER - Contiene Título y Sección de Usuario */}
      <header className="layout-header">
        {/* Sección Izquierda: Título */}
        <h1 className="layout-title">Gestión de Activos IT</h1>

        {/* Sección Derecha: Usuario y Logout (Siempre al final) */}
        <div className="layout-user-section">
          {user && (
            <div className="layout-user">
              <span className="user-email-text">Bienvenido, {user.email}</span>
              <button onClick={handleLogout} className="logout-button">
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. BARRA DE NAVEGACIÓN - Separada, centrada y bajo el header */}
      <div className="layout-nav-wrapper">
        <NavigationBar />
      </div>

      {/* 3. CONTENIDO Y BARRA LATERAL */}
      {/* 🛑 2. Aplica la clase condicional */}
      <div className={contentClass}>
        {/* 3. El Sidebar SÓLO se renderiza si existe */}
        {sidebar && <aside className="layout-sidebar">{sidebar}</aside>}

        <main className="layout-main">{children}</main>
      </div>
    </div>
  );
}
