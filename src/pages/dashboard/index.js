// pages/dashboard/index.js
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
// Aquí ya NO importamos LoansTable ni LoanAgingSummary

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  // 🛑 NUEVO ESTADO PARA LAS MÉTRICAS
  const [metrics, setMetrics] = useState({
    weeklyLoans: 0,
    activeLoans: 0,
    overdueLoans: 0,
    loading: true,
  });

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
    } else {
      router.push("/");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // 🛑 FUNCIÓN PARA OBTENER MÉTRICAS (Enfoque en Préstamos)
  const fetchMetrics = async () => {
    setMetrics((prev) => ({ ...prev, loading: true }));
    try {
      const today = new Date();

      // --- 1. Préstamos Activos (received_at IS NULL) ---
      const { count: activeLoans } = await supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .is("received_at", null);

      // --- 2. Préstamos Vencidos (Calculado en el cliente por simplicidad) ---
      const { data: activeLoansData } = await supabase
        .from("loans")
        .select("created_at, dias_prestamo")
        .is("received_at", null);

      let overdueCount = 0;
      if (activeLoansData) {
        activeLoansData.forEach((loan) => {
          const deadline = new Date(loan.created_at);
          deadline.setDate(deadline.getDate() + loan.dias_prestamo);
          if (today > deadline) {
            overdueCount++;
          }
        });
      }

      // --- 3. Préstamos Registrados esta Semana ---
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);

      const { count: weeklyLoans } = await supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo.toISOString());

      setMetrics({
        activeLoans: activeLoans || 0,
        overdueLoans: overdueCount || 0,
        weeklyLoans: weeklyLoans || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      setMetrics((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchUser();
    fetchMetrics();
  }, [router]);

  if (!user)
    return (
      <Layout user={null} sidebar={null}>
        <div>Cargando...</div>
      </Layout>
    );

  // Usamos el layout pero con el sidebar vacío (null)
  return (
    <Layout user={user} handleLogout={handleLogout} sidebar={null}>
      <div className="dashboard-content-wrapper">
        <h2>Panel de Control Principal 🛠️</h2>

        {/* 🛑 ZONA SUPERIOR: KPI CARDS */}
        {metrics.loading ? (
          <p>Cargando métricas...</p>
        ) : (
          <div className="kpi-cards-grid">
            <KPICard
              title="Préstamos esta Semana"
              value={metrics.weeklyLoans}
              icon="📅"
              color="#387e41" // Verde para actividad reciente
              description="Total de equipos prestados en los últimos 7 días."
              onClick={() => router.push("/prestamos")}
            />
            <KPICard
              title="Préstamos Activos"
              value={metrics.activeLoans}
              icon="🔗"
              color="#1976d2"
              description="Equipos temporalmente fuera de oficina IT."
              onClick={() => router.push("/prestamos")}
            />
            <KPICard
              title="Préstamos Vencidos"
              value={metrics.overdueLoans}
              icon="⚠️"
              color={metrics.overdueLoans > 0 ? "#d32f2f" : "#2e7d32"} // Rojo si hay vencidos
              description="Equipos con fecha de devolución expirada."
              onClick={() => router.push("/prestamos")}
            />
          </div>
        )}

        {/* 🛑 ZONA INFERIOR: ACCIONES CON MEJOR DISEÑO */}
        <h3>Acciones Rápidas</h3>
        <div className="quick-actions-grid">
          <ActionCard
            title="Registrar Asignación"
            icon="📝"
            description="Crear un nuevo registro de asignación permanente de equipo."
            onClick={() => router.push("/asignacion")}
          />
          <ActionCard
            title="Gestión de Préstamos"
            icon="📅"
            description="Ver el listado de préstamos activos y la antigüedad."
            onClick={() => router.push("/prestamos")}
          />
          <ActionCard
            title="Consultar Asignaciones"
            icon="🔎"
            description="Revisar la tabla de asignaciones permanentes para edición."
            onClick={() => router.push("/asignacion")}
          />
        </div>
      </div>
    </Layout>
  );
}

// 🛑 Componente Helper para KPI
const KPICard = ({ title, value, icon, color, description, onClick }) => (
  <div
    className="kpi-card"
    style={{ backgroundColor: color }}
    onClick={onClick}
  >
    <div className="kpi-header">
      <span className="kpi-icon">{icon}</span>
      <h4 className="kpi-title">{title}</h4>
    </div>
    <div className="kpi-value">{value}</div>
    <p className="kpi-description">{description}</p>
  </div>
);

// 🛑 Componente Helper para Acciones
const ActionCard = ({ title, icon, description, onClick }) => (
  <div className="action-card" onClick={onClick}>
    <span className="action-icon">{icon}</span>
    <h4 className="action-title">{title}</h4>
    <p className="action-description">{description}</p>
  </div>
);
