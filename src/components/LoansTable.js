import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import LoanRegisterModal from "./LoanRegisterModal";

export default function LoansTable() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const fetchLoans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("loans")
      .select(
        `id, nombre_recibe, tipo_equipo, serie, created_at, users(puesto, descripcion)`
      )
      .is("received_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando préstamos:", error.message);
    } else {
      setLoans(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLoans();

    const channel = supabase
      .channel("realtime-loans")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loans" },
        (payload) => {
          console.log("Cambio en loans:", payload);
          fetchLoans(); // Refresca los préstamos cada vez que cambia algo
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // Limpiar al desmontar
    };
  }, []);

  const calculateDaysDiff = (createdAt) => {
    const now = new Date();
    const createdDate = new Date(createdAt);
    createdDate.setHours(0, 0, 0, 0);
    const diffTime = now - createdDate;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleRowClick = (loan) => {
    setSelectedLoan(loan);
    setModalOpen(true);
  };

  return (
    <>
      <div className="loan-header">
        <h2 className="titulo">Historial de Préstamos</h2>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <div className="loan-grid">
          {loans.map((loan, index) => (
            <div
              key={loan.id}
              className="loan-card"
              onClick={() => handleRowClick(loan)}
            >
              <div className="card-header">
                <span className="card-id">#{loans.length - index}</span>
                <h3 className="card-usuario">{loan.nombre_recibe}</h3>
              </div>

              <div className="card-section">
                <p>
                  <strong>Equipo:</strong> {loan.tipo_equipo || "—"}
                </p>
                <p>
                  <strong>Serie:</strong> {loan.serie}
                </p>
              </div>

              <div className="card-section">
                <p>
                  <strong>Puesto:</strong> {loan.users?.puesto}
                </p>
                <p>
                  <strong>Departamento:</strong> {loan.users?.descripcion}
                </p>
              </div>

              <div className="card-footer">
                <p>
                  <strong>Fecha:</strong>{" "}
                  {new Date(loan.created_at).toLocaleDateString()}
                </p>
                <p>
                  <strong>Días:</strong> {calculateDaysDiff(loan.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <LoanRegisterModal
        open={modalOpen}
        handleClose={() => {
          setModalOpen(false);
          setSelectedLoan(null);
        }}
        mode="recepcion"
        selectedLoan={selectedLoan}
      />
    </>
  );
}
