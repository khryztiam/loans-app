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

const fetchLoans = useCallback(async () => {
        // 🛑 CLÁUSULAS DE FILTRADO AGREGADAS A LA CONSULTA DE SUPABASE
        const { data, error } = await supabase
            .from("loans")
            .select(`id, nombre_recibe, tipo_equipo, serie, created_at, users(puesto, descripcion)`)
            .is("received_at", null)    // El equipo aún no ha sido recibido
            .is("sapid_recepcion", null) // El campo de SAP ID de recepción es nulo (sin recibir)
            .order("created_at", { ascending: false }); // Ordenamos por fecha de creación

        if (!error) {
            setLoansData(data);
        } else {
            console.error("Error al obtener préstamos activos:", error);
        }
    }, []);

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

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

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

    useEffect(() => {
        fetchUser();
    }, [router]);

    return (
        <Layout
            user={user}
            handleLogout={handleLogout}
            // Mantenemos el LoanAgingSummary en la barra lateral
            sidebar={
                <div className="loan-aging-wrapper">
                    <h3 className="sidebar-title">Antigüedad de Préstamos</h3> {/* Nuevo título para sidebar */}
                    <LoanAgingSummary loans={loansData} />
                </div>
            }
        >
            <div className="main-content-wrapper">
                {/* 🛑 ELIMINAMOS EL BOTÓN DE NUEVO PRÉSTAMO DE AQUÍ */}
                
                {/* 🛑 El componente LoansTable ya incluye su propio título (loan-header) */}
                <LoansTable loans={loansData} fetchLoans={fetchLoans} />
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