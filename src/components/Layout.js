export default function Layout({ children, sidebar, user, handleLogout }) {
  return (
    <div className="layout-container">
      <header className="layout-header">
        <h1 className="layout-title">Sistema de Préstamos</h1>
        {user && (
          <div className="layout-user">
            <span>Bienvenido, {user.email}</span>
            <button onClick={handleLogout}>Cerrar sesión</button>
          </div>
        )}
      </header>

      <div className="layout-content">
        {" "}
        {/* Este es el nuevo contenedor */}
        <main className="layout-main">{children}</main>
        <aside className="layout-sidebar">{sidebar}</aside>
      </div>
    </div>
  );
}
