import { useState } from "react";
import LoanRegisterModal from "./LoanRegisterModal";

export default function LoansTable({ loans, fetchLoans }) { 
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [message, setMessage] = useState("");

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

  if (!loans || loans.length === 0) {
        return <div className="loading">No hay préstamos activos.</div>;
    }

return (
        <>
            <div className="loan-header">
                <h2 className="titulo">Préstamos Activos</h2> 
            </div>
            {message && <div className="success-message">{message}</div>}
            
            <div className="loan-grid">
                {loans.map((loan, index) => (
                    // ... (Mapeo de loan-card se mantiene) ...
                    <div
                        key={loan.id}
                        className="loan-card"
                        onClick={() => handleRowClick(loan)}
                    >
                        {/* ... (Contenido de la tarjeta se mantiene) ... */}
                        <div className="card-header">
                            <span className="card-id">#{loans.length - index}</span>
                            <h3 className="card-usuario">{loan.nombre_recibe}</h3>
                        </div>

                        <div className="card-section">
                            <p><strong>Equipo:</strong> {loan.tipo_equipo || "—"}</p>
                            <p><strong>Serie:</strong> {loan.serie}</p>
                        </div>
                        
                        <div className="card-section">
                            <p><strong>Puesto:</strong> {loan.users?.puesto}</p>
                            <p><strong>Departamento:</strong> {loan.users?.descripcion}</p>
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

            <LoanRegisterModal
                open={modalOpen}
                handleClose={() => {
                    setModalOpen(false);
                    setSelectedLoan(null);
                }}
                mode="recepcion"
                selectedLoan={selectedLoan}
                onSuccess={() => {
                    setMessage("Recepción registrada correctamente");
                    fetchLoans(); // 🛑 Llamada a fetchLoans del padre para refrescar
                    setTimeout(() => setMessage(""), 3000);
                }}
            />
        </>
    );
}
