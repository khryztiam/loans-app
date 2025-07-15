import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function LoanRegisterModal({
  open,
  handleClose,
  mode = "entrega",
  selectedLoan = null,
  onSuccess,
}) {
  const [sapid, setSapid] = useState("");
  const [nombreRecibe, setNombreRecibe] = useState("");
  const [diasPrestamo, setDiasPrestamo] = useState("");
  const [tipoEquipo, setTipoEquipo] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userNotFound, setUserNotFound] = useState(false);
  const sapidInputRef = useRef(null);
  const isEntrega = mode === "entrega";
  const isRecepcion = mode === "recepcion";

  const resetForm = () => {
    setSapid("");
    setNombreRecibe("");
    setDiasPrestamo("");
    setTipoEquipo("");
    setTag("");
    setError("");
    setUserNotFound(false);
  };

  const handleSapidEnter = async (e) => {
    if (e.key === "Enter") {
      const cleaned = sapid.trim();

      // Validación simple
      if (!/^\d{8}$/.test(cleaned)) {
        setError("El SAP ID debe tener exactamente 8 dígitos numéricos");
        setNombreRecibe("");
        setUserNotFound(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("nombre")
          .eq("sapid", cleaned)
          .single();

        if (error || !data) {
          setNombreRecibe("Usuario no registrado");
          setUserNotFound(true);
        } else {
          setNombreRecibe(data.nombre);
          setUserNotFound(false);
        }
      } catch (err) {
        console.error("Error al buscar usuario:", err);
        setError("Error al buscar el usuario");
      }
    }
  };
  // Maneja el envío del formulario
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const cleanedSapid = sapid.trim();

    try {
      if (isEntrega) {
        const { error } = await supabase.from("loans").insert([
          {
            sapid_usuario: cleanedSapid,
            nombre_recibe: nombreRecibe || "Usuario no registrado",
            dias_prestamo: parseInt(diasPrestamo),
            tipo_equipo: tipoEquipo,
            serie: tag,
          },
        ]);

        if (error) throw error;

        resetForm();
        if (onSuccess) onSuccess();
        handleClose();
      } else if (isRecepcion && selectedLoan) {
        const { error } = await supabase
          .from("loans")
          .update({
            received_at: new Date().toISOString(),
            sapid_recepcion: cleanedSapid,
            nombre_entrega: nombreRecibe || "Usuario no registrado",
          })
          .eq("id", selectedLoan.id);

        if (error) throw error;

        resetForm();
        if (onSuccess) onSuccess();
        handleClose();
      }
    } catch (error) {
      setError(
        isEntrega
          ? "Error al registrar el préstamo"
          : "Error al registrar la recepción"
      );
      console.error("Error en el formulario:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCloseAndReset();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCloseAndReset = () => {
    resetForm();
    handleClose();
  };

  useEffect(() => {
    if (open && sapidInputRef.current) {
      sapidInputRef.current.focus();
    }
  }, [open]);

  // Aquí va el renderizado del modal con validación de `open`
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleCloseAndReset}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>
          {isEntrega
            ? "Registrar nuevo préstamo"
            : "Registrar recepción de equipo"}
        </h2>
        <form onSubmit={handleSubmit}>
          <label>SAP ID</label>
          <input
            type="text"
            value={sapid}
            onChange={(e) => setSapid(e.target.value)}
            onKeyDown={handleSapidEnter}
            maxLength={8}
            required
            ref={sapidInputRef}
          />

          <label>Usuario</label>
          <input
            type="text"
            value={nombreRecibe}
            disabled
            className={userNotFound ? "error" : ""}
          />
          {userNotFound && (
            <small className="error-text">
              Usuario no registrado en la base de datos
            </small>
          )}

          {isEntrega && (
            <>
              <label>Días de préstamo</label>
              <input
                type="number"
                value={diasPrestamo}
                onChange={(e) => setDiasPrestamo(e.target.value)}
                required
              />

              <label>Tipo de equipo</label>
              <select
                value={tipoEquipo}
                onChange={(e) => setTipoEquipo(e.target.value)}
                required
              >
                <option value="">Selecciona un tipo</option>
                <option value="Laptop">Laptop</option>
                <option value="Tablet">Tablet</option>
                <option value="Escáner">Escáner</option>
                <option value="Impresora">Impresora</option>
                <option value="Extensión">Extensión</option>
                <option value="UPS">UPS</option>
              </select>

              <label>Serie de equipo</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                required
              />
            </>
          )}

          {isRecepcion && selectedLoan && (
            <>
              <p>
                <strong>TAG / Serie Equipo:</strong> {selectedLoan.serie}
              </p>
              <p>
                <strong>Préstamo registrado:</strong>{" "}
                {new Date(selectedLoan.created_at).toLocaleString()}
              </p>
            </>
          )}

          {error && <p className="error-text">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading
              ? "Guardando..."
              : isEntrega
              ? "Registrar préstamo"
              : "Registrar recepción"}
          </button>
        </form>
      </div>
    </div>
  );
}
