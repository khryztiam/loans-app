import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import LoansTable from "@/components/LoansTable";
import LoanRegisterModal from "@/components/LoanRegisterModal";
import LoanAgingSummary from "@/components/LoanAgingSummary";
import UserUploader from "@/components/UserUploader";

export default function MainPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);
  const [loansData, setLoansData] = useState([]);

  // --- ✅ FUNCIONES ---
  const fetchLoans = async () => {
    const { data, error } = await supabase.from("loans").select("*");
    if (!error) {
      setLoansData(data);
    } else {
      console.error("Error al obtener préstamos:", error);
    }
  };

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

  // --- ✅ EFECTOS ---
  useEffect(() => {
    // Cargar datos iniciales
    fetchLoans();

    // Configurar suscripción a cambios en tiempo real
    const loansSubscription = supabase
      .channel("loans-real-time")
      .on(
        "postgres_changes",
        {
          event: "*", // Escucha todos los eventos (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "loans",
        },
        (payload) => {
          // Manejar diferentes tipos de eventos
          switch (payload.eventType) {
            case "INSERT":
              setLoansData((current) => [...current, payload.new]);
              break;
            case "UPDATE":
              setLoansData((current) =>
                current.map((loan) =>
                  loan.id === payload.new.id ? payload.new : loan
                )
              );
              break;
            case "DELETE":
              setLoansData((current) =>
                current.filter((loan) => loan.id !== payload.old.id)
              );
              break;
            default:
              break;
          }
        }
      )
      .subscribe();

    // Limpieza al desmontar el componente
    return () => {
      supabase.removeChannel(loansSubscription);
    };
  }, []);

  useEffect(() => {
    fetchUser();
  }, [router]);

  return (
    <Layout
      user={user}
      handleLogout={handleLogout}
      sidebar={
        <div className="loan-aging-wrapper">
          <LoanAgingSummary loans={loansData} />
        </div>
      }
    >
      <div className="main-content-wrapper">
        <button className="btn-nuevo" onClick={handleOpenModal}>
          ➕ Nuevo préstamo
        </button>
        <LoansTable loans={loansData} fetchLoans={fetchLoans} />
      </div>
      <UserUploader />
      <LoanRegisterModal
        open={openModal}
        handleClose={handleCloseModal}
        mode="entrega"
      />
    </Layout>
  );
}
