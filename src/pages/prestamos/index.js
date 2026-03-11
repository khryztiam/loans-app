// pages/prestamos/index.js
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import LoansTable from "@/components/LoansTable";
import LoanRegisterModal from "@/components/LoanRegisterModal";
import LoanAgingSummary from "@/components/LoanAgingSummary";
import UserUploader from "@/components/UserUploader";

export default function PrestamosPage() {
  // Nota: La lógica de `user` y `handleLogout` DEBE estar centralizada
  // en `_app.js` o un Context si quieres usar el `Layout` correctamente,
  // pero por ahora la dejamos aquí, asumiendo que el Layout se encarga.
  const [user, setUser] = useState(null);
  const router = useRouter();

  const [openModal, setOpenModal] = useState(false);
  const [loansData, setLoansData] = useState([]);

  // 🛑 VALOR DE INVENTARIO: AJUSTA ESTE NÚMERO A TU INVENTARIO TOTAL DE LAPTOPS
  const TOTAL_INVENTORY_LAPTOPS = 10;

  // ✅ UTILIDADES CENTRALIZADAS PARA FILTRADO
  const isActiveLoan = (loan) => {
    return loan?.received_at === null || loan?.received_at === undefined || loan?.received_at === '';
  };

  const isLaptop = (loan) => {
    return loan?.tipo_equipo && loan.tipo_equipo.toLowerCase() === "laptop";
  };

  const fetchLoans = useCallback(async () => {
    try {
      // 🛑 CLÁUSULAS DE FILTRADO AGREGADAS A LA CONSULTA DE SUPABASE
      const { data, error } = await supabase
        .from("loans")
        .select(
          `id, nombre_recibe, tipo_equipo, serie, created_at, users(puesto, descripcion)`
        )
        .is("received_at", null) // El equipo aún no ha sido recibido
        .is("sapid_recepcion", null) // El campo de SAP ID de recepción es nulo (sin recibir)
        .order("created_at", { ascending: false }) // Ordenamos por fecha de creación
        .limit(100); // ✅ Límite de resultados para evitar sobrecarga

      if (error) throw error;
      setLoansData(data || []);
    } catch (error) {
      console.error("Error al obtener préstamos activos:", error);
      setLoansData([]);
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  // --- LÓGICA DE STOCK DE LAPTOPS ---

  // 1. ✅ Contar cuántas laptops están activamente prestadas usando funciones centralizadas
  const activeLaptopLoans = loansData.filter((loan) => {
    return isLaptop(loan) && isActiveLoan(loan);
  }).length;

  // 2. Calcular el stock restante
  const currentStock = TOTAL_INVENTORY_LAPTOPS - activeLaptopLoans;

  // 3. Determinar si el aviso debe mostrarse (stock <= 0)
  const showNoStockAlert = currentStock <= 0;

  // --- EFECTOS: Carga de Datos y Suscripción ---
  useEffect(() => {
    fetchLoans();

    const loansSubscription = supabase
      .channel("loans-real-time")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loans",
        },
        (payload) => {
          // Refresca la lista completa filtrada si ocurre un cambio relevante
          // Nota: Si el payload.new indica que ya fue recibido, no lo incluimos.
          fetchLoans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(loansSubscription);
    };
  }, [fetchLoans]); // Dependencia agregada para useCallback

  // ✅ fetchUser movido al useEffect para tener acceso correcto a router
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      } else {
        router.push("/");
      }
    };
    fetchUser();
  }, [router]);

  return (
    <Layout
      user={user}
      handleLogout={handleLogout}
      // Mantenemos el LoanAgingSummary en la barra lateral
      sidebar={
        <div className="loan-aging-wrapper">
          <h3 className="sidebar-title">Antigüedad de Préstamos</h3>{" "}
          {/* Nuevo título para sidebar */}
          <LoanAgingSummary loans={loansData} />
        </div>
      }
    >
        {/* 🛑 AVISO FLOTANTE CONDICIONAL AÑADIDO AQUÍ */}
            {showNoStockAlert && (
                <div className="floating-alert no-stock-alert">
                    ⚠️ ¡SIN STOCK! No quedan laptops disponibles para prestar.
                </div>
            )}

      <div className="main-content-wrapper">
        {/* 🛑 ELIMINAMOS EL BOTÓN DE NUEVO PRÉSTAMO DE AQUÍ */}

        {/* ✅ El componente LoansTable ya incluye su propio título (loan-header) */}
        <LoansTable
          loans={loansData.filter(isActiveLoan)}
          fetchLoans={fetchLoans}
        />
      </div>

      {/* 🛑 NUEVO CONTENEDOR FLOTANTE PARA EL BOTÓN DE REGISTRO */}
      <div className="floating-action-container">
        <button className="fab-button" onClick={handleOpenModal}>
          ➕ Nuevo Préstamo
        </button>
      </div>

      {/* UserUploader y Modal se mantienen */}
      <UserUploader />
      <LoanRegisterModal
        open={openModal}
        handleClose={handleCloseModal}
        mode="entrega"
      />
    </Layout>
  );
}
